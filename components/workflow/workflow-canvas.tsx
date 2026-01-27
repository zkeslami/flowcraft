"use client"

import type React from "react"

import { useRef, useState, useEffect, useCallback } from "react"
import { WorkflowNode as WorkflowNodeComponent } from "./workflow-node"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { WorkflowNode, Connection, NodeExecutionStatus } from "@/lib/workflow-types"

interface WorkflowCanvasProps {
  nodes: WorkflowNode[]
  connections: Connection[]
  selectedNode: WorkflowNode | null
  onNodeSelect: (node: WorkflowNode | null) => void
  isPanelOpen: boolean
  onCanvasClick?: () => void
  nodeExecutionStatuses?: Record<string, NodeExecutionStatus>
  onTransformChange?: (transform: { x: number; y: number; scale: number }) => void
}

export function WorkflowCanvas({
  nodes,
  connections,
  selectedNode,
  onNodeSelect,
  isPanelOpen,
  onCanvasClick,
  nodeExecutionStatuses = {},
  onTransformChange,
}: WorkflowCanvasProps) {
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
    if (selectedNode && isPanelOpen && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const nodeCenter = {
        x: selectedNode.position.x + 90,
        y: selectedNode.position.y + 30,
      }
      const newScale = 0.7
      const newOffset = {
        x: rect.width / 2 - nodeCenter.x * newScale,
        y: rect.height / 2 - nodeCenter.y * newScale,
      }
      setTargetTransform({ offset: newOffset, scale: newScale })
    }
  }, [selectedNode, isPanelOpen])

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
      // Check if clicking on a node
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
    const maxX = Math.max(...nodes.map((n) => n.position.x + 180))
    const minY = Math.min(...nodes.map((n) => n.position.y))
    const maxY = Math.max(...nodes.map((n) => n.position.y + 60))

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
  }, [nodes])

  const getNodeCenter = (node: WorkflowNode) => {
    const width = 180
    const height = 60
    return {
      x: node.position.x + width / 2,
      y: node.position.y + height / 2,
    }
  }

  const getPortPosition = (node: WorkflowNode, port: string): { x: number; y: number } => {
    const width = 180
    const height = 60
    const center = getNodeCenter(node)

    if (port === "input") {
      return { x: node.position.x, y: center.y }
    }
    if (port === "output") {
      return { x: node.position.x + width, y: center.y }
    }
    if (port === "true") {
      return { x: node.position.x + width, y: node.position.y + height * 0.3 }
    }
    if (port === "false") {
      return { x: node.position.x + width, y: node.position.y + height * 0.7 }
    }
    return center
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
                ? "oklch(0.65 0.2 145)"
                : "oklch(0.28 0.01 260)"
          }
          strokeWidth="2"
          fill="none"
          className="transition-all duration-300"
        />
        {connectionStatus === "running" && (
          <>
            <circle r="4" fill="oklch(0.65 0.2 145)">
              <animateMotion dur="1s" repeatCount="indefinite" path={path} />
            </circle>
            <circle r="4" fill="oklch(0.65 0.2 145)" opacity="0.5">
              <animateMotion dur="1s" repeatCount="indefinite" path={path} begin="0.33s" />
            </circle>
            <circle r="4" fill="oklch(0.65 0.2 145)" opacity="0.3">
              <animateMotion dur="1s" repeatCount="indefinite" path={path} begin="0.66s" />
            </circle>
          </>
        )}
        {connectionStatus === "completed" && (
          <path
            d={path}
            stroke="oklch(0.72 0.19 149)"
            strokeWidth="6"
            fill="none"
            opacity="0.3"
            className="animate-pulse"
          />
        )}
        <path
          d={path}
          stroke="oklch(0.65 0.2 145)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 4"
          className={connectionStatus === "idle" ? "animate-pulse opacity-50" : "opacity-0"}
        />
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

  return (
    <div
      ref={canvasRef}
      className={`relative h-full w-full overflow-hidden ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        backgroundImage: `
          radial-gradient(circle, oklch(0.28 0.01 260) 1px, transparent 1px)
        `,
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
            <WorkflowNodeComponent
              node={node}
              isSelected={selectedNode?.id === node.id}
              onSelect={() => onNodeSelect(node)}
              executionStatus={nodeExecutionStatuses[node.id]}
            />
          </div>
        ))}
      </div>

      <div className="absolute right-4 bottom-4 flex flex-col gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border bg-card/90 backdrop-blur-sm hover:bg-accent"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border bg-card/90 backdrop-blur-sm hover:bg-accent"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border bg-card/90 backdrop-blur-sm hover:bg-accent"
          onClick={handleFitToView}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-md border border-border bg-card/90 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
        <span>{nodes.length} nodes</span>
        <span className="text-border">|</span>
        <span>{connections.length} connections</span>
        <span className="text-border">|</span>
        <span>{Math.round(scale * 100)}%</span>
      </div>
    </div>
  )
}
