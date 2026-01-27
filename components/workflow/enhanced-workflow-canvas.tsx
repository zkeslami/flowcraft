"use client"

import type React from "react"
import { useRef, useState, useEffect, useCallback } from "react"
import { EnhancedWorkflowNode } from "./enhanced-workflow-node"
import { ZoomIn, ZoomOut, Maximize2, AlignLeft, Minimize2, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import type { WorkflowNode, Connection, NodeExecutionStatus } from "@/lib/workflow-types"

interface EnhancedWorkflowCanvasProps {
  nodes: WorkflowNode[]
  connections: Connection[]
  selectedNode: WorkflowNode | null
  minimizedNodes: Set<string>
  onNodeSelect: (node: WorkflowNode | null) => void
  onNodeDoubleClick: (node: WorkflowNode) => void
  onToggleNodeMinimize: (nodeId: string) => void
  onMinimizeAll: () => void
  onMaximizeAll: () => void
  onTidyUp: () => void
  allMinimized: boolean
  isPanelOpen: boolean
  onCanvasClick?: () => void
  nodeExecutionStatuses?: Record<string, NodeExecutionStatus>
  onTransformChange?: (transform: { x: number; y: number; scale: number }) => void
  onRunNode?: (nodeId: string) => void
  onAddNodeAfter?: (nodeId: string) => void
  onDeleteNode?: (nodeId: string) => void
  onNodePositionChange?: (nodeId: string, position: { x: number; y: number }) => void
  isRunning?: boolean
}

export function EnhancedWorkflowCanvas({
  nodes,
  connections,
  selectedNode,
  minimizedNodes,
  onNodeSelect,
  onNodeDoubleClick,
  onToggleNodeMinimize,
  onMinimizeAll,
  onMaximizeAll,
  onTidyUp,
  allMinimized,
  isPanelOpen,
  onCanvasClick,
  nodeExecutionStatuses = {},
  onTransformChange,
  onRunNode,
  onAddNodeAfter,
  onDeleteNode,
  onNodePositionChange,
  isRunning = false,
}: EnhancedWorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [targetTransform, setTargetTransform] = useState<{ offset: { x: number; y: number }; scale: number } | null>(
    null,
  )
  const wasDraggingRef = useRef(false)
  const mouseStartRef = useRef({ x: 0, y: 0 })

  const MIN_SCALE = 0.25
  const MAX_SCALE = 2
  const ZOOM_STEP = 0.1

  useEffect(() => {
    onTransformChange?.({ x: offset.x, y: offset.y, scale })
  }, [offset, scale, onTransformChange])

  useEffect(() => {
    if (targetTransform) {
      const animate = () => {
        setOffset((prev) => ({
          x: prev.x + (targetTransform.offset.x - prev.x) * 0.15,
          y: prev.y + (targetTransform.offset.y - prev.y) * 0.15,
        }))
        setScale((prev) => prev + (targetTransform.scale - prev) * 0.15)
      }
      const id = requestAnimationFrame(animate)

      const isClose =
        Math.abs(offset.x - targetTransform.offset.x) < 1 &&
        Math.abs(offset.y - targetTransform.offset.y) < 1 &&
        Math.abs(scale - targetTransform.scale) < 0.01
      if (isClose) {
        setTargetTransform(null)
      }

      return () => cancelAnimationFrame(id)
    }
  }, [targetTransform, offset, scale])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onNodeSelect(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onNodeSelect])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta))

      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const scaleRatio = newScale / scale
        const newOffset = {
          x: mouseX - (mouseX - offset.x) * scaleRatio,
          y: mouseY - (mouseY - offset.y) * scaleRatio,
        }

        setOffset(newOffset)
        setScale(newScale)
      }
    },
    [scale, offset],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("[data-workflow-node]")) {
        return
      }

      if (e.button === 0) {
        setIsDragging(true)
        wasDraggingRef.current = false
        mouseStartRef.current = { x: e.clientX, y: e.clientY }
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
      }
    },
    [offset],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        const dx = Math.abs(e.clientX - mouseStartRef.current.x)
        const dy = Math.abs(e.clientY - mouseStartRef.current.y)
        if (dx > 3 || dy > 3) {
          wasDraggingRef.current = true
        }
        setOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      }
    },
    [isDragging, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(MAX_SCALE, prev + ZOOM_STEP))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(MIN_SCALE, prev - ZOOM_STEP))
  }, [])

  const handleFitToView = useCallback(() => {
    if (!canvasRef.current || nodes.length === 0) return

    const rect = canvasRef.current.getBoundingClientRect()
    const padding = 80

    const minX = Math.min(...nodes.map((n) => n.position.x))
    const maxX = Math.max(...nodes.map((n) => n.position.x + 280))
    const minY = Math.min(...nodes.map((n) => n.position.y))
    const maxY = Math.max(...nodes.map((n) => n.position.y + (minimizedNodes.has(n.id) ? 44 : 160)))

    const contentWidth = maxX - minX + padding * 2
    const contentHeight = maxY - minY + padding * 2

    const scaleX = rect.width / contentWidth
    const scaleY = rect.height / contentHeight
    const newScale = Math.min(Math.min(scaleX, scaleY), 1)

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    setTargetTransform({
      offset: {
        x: rect.width / 2 - centerX * newScale,
        y: rect.height / 2 - centerY * newScale,
      },
      scale: newScale,
    })
  }, [nodes, minimizedNodes])

  const handleNodeDrag = useCallback(
    (nodeId: string, deltaX: number, deltaY: number) => {
      const node = nodes.find((n) => n.id === nodeId)
      if (node && onNodePositionChange) {
        onNodePositionChange(nodeId, {
          x: node.position.x + deltaX / scale,
          y: node.position.y + deltaY / scale,
        })
      }
    },
    [nodes, scale, onNodePositionChange],
  )

  const getNodeHeight = (node: WorkflowNode) => {
    return minimizedNodes.has(node.id) ? 44 : 160
  }

  const getNodeCenter = (node: WorkflowNode) => {
    const width = 280
    const height = getNodeHeight(node)
    return {
      x: node.position.x + width / 2,
      y: node.position.y + height / 2,
    }
  }

  const getPortPosition = (node: WorkflowNode, port: string): { x: number; y: number } => {
    const width = 280
    const height = getNodeHeight(node)

    if (port === "input") {
      return { x: node.position.x, y: node.position.y + 20 }
    }
    if (port === "output") {
      return { x: node.position.x + width, y: node.position.y + 20 }
    }
    if (port === "true") {
      return { x: node.position.x + width, y: node.position.y + height * 0.3 }
    }
    if (port === "false") {
      return { x: node.position.x + width, y: node.position.y + height * 0.7 }
    }
    return getNodeCenter(node)
  }

  const getConnectionStatus = (conn: Connection): "idle" | "running" | "completed" => {
    const fromStatus = nodeExecutionStatuses[conn.from]
    if (fromStatus === "running") return "running"
    if (fromStatus === "completed") return "completed"
    return "idle"
  }

  const renderConnection = (conn: Connection) => {
    const fromNode = nodes.find((n) => n.id === conn.from)
    const toNode = nodes.find((n) => n.id === conn.to)
    if (!fromNode || !toNode) return null

    const start = getPortPosition(fromNode, conn.fromPort)
    const end = getPortPosition(toNode, conn.toPort)

    const midX = (start.x + end.x) / 2
    const path = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`

    const connectionStatus = getConnectionStatus(conn)

    return (
      <g key={conn.id}>
        <path
          d={path}
          stroke={
            connectionStatus === "completed"
              ? "oklch(0.72 0.19 149)"
              : connectionStatus === "running"
                ? "oklch(0.79 0.14 195)"
                : "oklch(0.28 0.01 260)"
          }
          strokeWidth="2"
          fill="none"
          className="transition-all duration-300"
        />
        {connectionStatus === "running" && (
          <>
            <circle r="4" fill="oklch(0.79 0.14 195)">
              <animateMotion dur="1s" repeatCount="indefinite" path={path} />
            </circle>
            <circle r="4" fill="oklch(0.79 0.14 195)" opacity="0.5">
              <animateMotion dur="1s" repeatCount="indefinite" path={path} begin="0.33s" />
            </circle>
          </>
        )}
      </g>
    )
  }

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (wasDraggingRef.current) {
        wasDraggingRef.current = false
        return
      }
      const target = e.target as HTMLElement
      if (!target.closest("[data-workflow-node]")) {
        onNodeSelect(null)
        onCanvasClick?.()
      }
    },
    [onNodeSelect, onCanvasClick],
  )

  const handleNodePositionChange = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      onNodePositionChange?.(nodeId, position)
    },
    [onNodePositionChange],
  )

  return (
    <TooltipProvider>
      <div
        ref={canvasRef}
        className={`relative h-full w-full overflow-hidden ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          backgroundImage: `radial-gradient(circle, oklch(0.28 0.01 260) 1px, transparent 1px)`,
          backgroundSize: `${24 * scale}px ${24 * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`,
        }}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          {connections.map(renderConnection)}
        </svg>

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          {nodes.map((node) => (
            <div key={node.id} data-workflow-node className="pointer-events-auto">
              <EnhancedWorkflowNode
                node={node}
                isSelected={selectedNode?.id === node.id}
                isMinimized={minimizedNodes.has(node.id)}
                onSelect={() => onNodeSelect(node)}
                onDoubleClick={() => onNodeDoubleClick(node)}
                onToggleMinimize={() => onToggleNodeMinimize(node.id)}
                onRun={() => onRunNode?.(node.id)}
                onAddNode={() => onAddNodeAfter?.(node.id)}
                onDelete={() => onDeleteNode?.(node.id)}
                onDrag={handleNodeDrag}
                onPositionChange={handleNodePositionChange}
                scale={scale}
                executionStatus={nodeExecutionStatuses[node.id]}
                isRunning={isRunning}
              />
            </div>
          ))}
        </div>

        {/* Zoom and canvas controls */}
        <div className="absolute right-4 bottom-4 flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-border bg-card/90 backdrop-blur-sm hover:bg-accent"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Zoom In
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-border bg-card/90 backdrop-blur-sm hover:bg-accent"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Zoom Out
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-border bg-card/90 backdrop-blur-sm hover:bg-accent"
                onClick={handleFitToView}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Fit to View
            </TooltipContent>
          </Tooltip>
          <div className="my-1 h-px w-full bg-border" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-border bg-card/90 backdrop-blur-sm hover:bg-accent"
                onClick={onTidyUp}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Tidy Up
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-border bg-card/90 backdrop-blur-sm hover:bg-accent"
                onClick={allMinimized ? onMaximizeAll : onMinimizeAll}
              >
                {allMinimized ? <Maximize className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              {allMinimized ? "Maximize All" : "Minimize All"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Status bar */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-md border border-border bg-card/90 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
          <span>{nodes.length} nodes</span>
          <span className="text-border">|</span>
          <span>{connections.length} connections</span>
          <span className="text-border">|</span>
          <span>{Math.round(scale * 100)}%</span>
        </div>
      </div>
    </TooltipProvider>
  )
}
