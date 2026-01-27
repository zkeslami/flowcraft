"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { ZoomIn, ZoomOut, Maximize2, LayoutGrid, ChevronDown, ChevronUp } from "lucide-react"
import type { WorkflowNode, Connection, NodeExecutionStatus } from "@/lib/workflow-types"
import { EnhancedWorkflowNodeV7 } from "./enhanced-workflow-node-v7"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EnhancedWorkflowCanvasV7Props {
  nodes: WorkflowNode[]
  connections: Connection[]
  selectedNode: WorkflowNode | null
  minimizedNodes: Set<string>
  onNodeSelect: (node: WorkflowNode | null) => void
  onNodeDoubleClick: (node: WorkflowNode) => void
  onToggleNodeMinimize: (nodeId: string) => void
  onMinimizeAll: () => void
  onMaximizeAll: () => void
  allMinimized: boolean
  onTidyUp: () => void
  isPanelOpen: boolean
  onCanvasClick: () => void
  nodeExecutionStatuses: Record<string, NodeExecutionStatus>
  onTransformChange?: (transform: { x: number; y: number; scale: number }) => void
  onRunNode?: (nodeId: string) => void
  onAddNodeAfter?: (nodeId: string) => void
  onDeleteNode?: (nodeId: string) => void
  onNodePositionChange?: (nodeId: string, position: { x: number; y: number }) => void
  isRunning?: boolean
  isModuleView?: boolean
}

export function EnhancedWorkflowCanvasV7({
  nodes,
  connections,
  selectedNode,
  minimizedNodes,
  onNodeSelect,
  onNodeDoubleClick,
  onToggleNodeMinimize,
  onMinimizeAll,
  onMaximizeAll,
  allMinimized,
  onTidyUp,
  isPanelOpen,
  onCanvasClick,
  nodeExecutionStatuses,
  onTransformChange,
  onRunNode,
  onAddNodeAfter,
  onDeleteNode,
  onNodePositionChange,
  isRunning = false,
  isModuleView = false,
}: EnhancedWorkflowCanvasV7Props) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onTransformChange?.(transform)
  }, [transform, onTransformChange])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * delta, 0.25), 2),
    }))
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains("canvas-background")) {
        setIsDragging(true)
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
      }
    },
    [transform],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setTransform((prev) => ({
          ...prev,
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        }))
      }
    },
    [isDragging, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains("canvas-background")) {
        onCanvasClick()
      }
    },
    [onCanvasClick],
  )

  const handleZoomIn = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 2),
    }))
  }, [])

  const handleZoomOut = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(prev.scale * 0.8, 0.25),
    }))
  }, [])

  const handleFitView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 })
  }, [])

  const renderConnections = () => {
    return connections.map((conn) => {
      const fromNode = nodes.find((n) => n.id === conn.from)
      const toNode = nodes.find((n) => n.id === conn.to)
      if (!fromNode || !toNode) return null

      // Match the node dimensions from enhanced-workflow-node-v7.tsx
      const nodeWidth = fromNode.type === "agent" ? 320 : 300
      const toNodeWidth = toNode.type === "agent" ? 320 : 300
      const fromMinHeight = minimizedNodes.has(fromNode.id) ? 48 : fromNode.type === "agent" ? 320 : 180
      const toMinHeight = minimizedNodes.has(toNode.id) ? 48 : toNode.type === "agent" ? 320 : 180

      // Port position - aligned with header (top-7 = 28px from top)
      const portYOffset = 28

      let startY: number
      if (fromNode.type === "condition") {
        startY = conn.fromPort === "true" ? fromNode.position.y + fromMinHeight * 0.3 : fromNode.position.y + fromMinHeight * 0.7
      } else {
        startY = fromNode.position.y + portYOffset
      }

      const startX = fromNode.position.x + nodeWidth
      const endX = toNode.position.x
      const endY = toNode.position.y + portYOffset

      const midX = (startX + endX) / 2
      const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`

      const fromStatus = nodeExecutionStatuses[fromNode.id]
      const toStatus = nodeExecutionStatuses[toNode.id]
      const isActive = fromStatus === "completed" && (toStatus === "running" || toStatus === "completed")
      const isRunningConnection = fromStatus === "completed" && toStatus === "running"

      return (
        <g key={conn.id}>
          {/* Shadow/glow line - only show when running */}
          {isRunningConnection && (
            <path d={path} fill="none" stroke="rgba(14,165,165,0.2)" strokeWidth={6} />
          )}
          {/* Main connection line - gray by default, teal when running */}
          <path
            d={path}
            fill="none"
            stroke={isRunningConnection ? "#0ea5a5" : isActive ? "#10b981" : "#3f3f46"}
            strokeWidth={isRunningConnection ? 3 : 2}
            className={cn("transition-all duration-300", isRunningConnection && "animate-pulse")}
          />
        </g>
      )
    })
  }

  return (
    <TooltipProvider>
    <div className={cn("relative h-full w-full overflow-hidden", isModuleView && "rounded-lg border border-border")}>
      <div
        ref={canvasRef}
        className="canvas-background absolute inset-0 bg-[#0c0c0e]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
          backgroundPosition: `${transform.x}px ${transform.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <svg className="absolute inset-0 h-full w-full pointer-events-none">
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--chart-3))" />
            </linearGradient>
          </defs>
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {renderConnections()}
          </g>
        </svg>

        <div
          className="absolute"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {nodes.map((node) => (
            <EnhancedWorkflowNodeV7
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              isMinimized={minimizedNodes.has(node.id)}
              onSelect={() => onNodeSelect(node)}
              onDoubleClick={() => onNodeDoubleClick(node)}
              onToggleMinimize={() => onToggleNodeMinimize(node.id)}
              onRun={() => onRunNode?.(node.id)}
              onAddNode={() => onAddNodeAfter?.(node.id)}
              onDelete={() => onDeleteNode?.(node.id)}
              onPositionChange={onNodePositionChange}
              scale={transform.scale}
              executionStatus={nodeExecutionStatuses[node.id]}
              isRunning={isRunning}
            />
          ))}
        </div>
      </div>

      {/* Zoom and canvas controls - stacked vertically */}
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
              onClick={handleFitView}
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
              <LayoutGrid className="h-4 w-4" />
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
              {allMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            {allMinimized ? "Maximize All" : "Minimize All"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Status bar - bottom left */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-md border border-border bg-card/90 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
        <span>{nodes.length} nodes</span>
        <span className="text-border">|</span>
        <span>{connections.length} connections</span>
        <span className="text-border">|</span>
        <span>{Math.round(transform.scale * 100)}%</span>
      </div>
    </div>
    </TooltipProvider>
  )
}
