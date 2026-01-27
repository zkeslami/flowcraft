"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { ZoomIn, ZoomOut, Maximize2, LayoutGrid, PanelTop, Minus, Square } from "lucide-react"
import type { WorkflowNode, Connection, NodeExecutionStatus } from "@/lib/workflow-types"
import { EnhancedWorkflowNodeV8, type NodeViewMode } from "./enhanced-workflow-node-v8"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EnhancedWorkflowCanvasV8Props {
  nodes: WorkflowNode[]
  connections: Connection[]
  selectedNode: WorkflowNode | null
  onNodeSelect: (node: WorkflowNode | null) => void
  onNodeDoubleClick: (node: WorkflowNode) => void
  onTidyUp: (viewMode: NodeViewMode) => void
  isPanelOpen: boolean
  onCanvasClick: () => void
  nodeExecutionStatuses: Record<string, NodeExecutionStatus>
  onTransformChange?: (transform: { x: number; y: number; scale: number }) => void
  onViewModeChange?: (viewMode: NodeViewMode) => void
  onRunNode?: (nodeId: string) => void
  onAddNodeAfter?: (nodeId: string) => void
  onDeleteNode?: (nodeId: string) => void
  onNodePositionChange?: (nodeId: string, position: { x: number; y: number }) => void
  isRunning?: boolean
  isModuleView?: boolean
  theme?: "dark" | "light"
  showExecutionIndicators?: boolean
  startNodeId?: string
  finishNodeId?: string
}

export function EnhancedWorkflowCanvasV8({
  nodes,
  connections,
  selectedNode,
  onNodeSelect,
  onNodeDoubleClick,
  onTidyUp,
  isPanelOpen,
  onCanvasClick,
  nodeExecutionStatuses,
  onTransformChange,
  onViewModeChange,
  onRunNode,
  onAddNodeAfter,
  onDeleteNode,
  onNodePositionChange,
  isRunning = false,
  isModuleView = false,
  theme = "dark",
  showExecutionIndicators = false,
  startNodeId,
  finishNodeId,
}: EnhancedWorkflowCanvasV8Props) {
  const isLight = theme === "light"
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [nodeViewMode, setNodeViewModeInternal] = useState<NodeViewMode>("expanded")
  const [individuallyExpandedNodes, setIndividuallyExpandedNodes] = useState<Set<string>>(new Set())
  const canvasRef = useRef<HTMLDivElement>(null)

  const setNodeViewMode = useCallback((mode: NodeViewMode) => {
    setNodeViewModeInternal(mode)
    // Clear individual expansion state when switching view modes
    setIndividuallyExpandedNodes(new Set())
    onViewModeChange?.(mode)
  }, [onViewModeChange])

  const handleToggleNodeExpand = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    
    const isCurrentlyExpanded = individuallyExpandedNodes.has(nodeId)
    const willBeExpanded = !isCurrentlyExpanded
    
    // In visual mode, when expanding a node inline, shift nodes to the right
    if (nodeViewMode === "visual") {
      // Calculate the width difference between visual (90px) and expanded (300-320px)
      const visualWidth = 90
      const expandedWidth = node.type === "agent" ? 320 : 300
      const widthDiff = expandedWidth - visualWidth
      
      // Find nodes that are to the right of this node
      const nodeX = node.position.x
      
      // Update positions of nodes to the right
      nodes.forEach(n => {
        if (n.id !== nodeId && n.position.x > nodeX) {
          const newX = willBeExpanded 
            ? n.position.x + widthDiff 
            : n.position.x - widthDiff
          onNodePositionChange?.(n.id, { x: newX, y: n.position.y })
        }
      })
    }
    
    setIndividuallyExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [nodes, nodeViewMode, individuallyExpandedNodes, onNodePositionChange])

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

  const [hasDraggedCanvas, setHasDraggedCanvas] = useState(false)
  
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains("canvas-background")) {
        setIsDragging(true)
        setHasDraggedCanvas(false)
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
      }
    },
    [transform],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setHasDraggedCanvas(true)
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
      // Only deselect if it was a pure click (no drag occurred)
      if (!hasDraggedCanvas && (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains("canvas-background"))) {
        onCanvasClick()
      }
      setHasDraggedCanvas(false)
    },
    [onCanvasClick, hasDraggedCanvas],
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

      const fromHasToggle = individuallyExpandedNodes.has(fromNode.id)
      const toHasToggle = individuallyExpandedNodes.has(toNode.id)
      
      const getEffectiveMode = (hasToggle: boolean) => {
        if (nodeViewMode === "expanded") {
          return hasToggle ? "collapsed" : "expanded"
        }
        return hasToggle ? "expanded" : nodeViewMode
      }
      
      const fromEffectiveMode = getEffectiveMode(fromHasToggle)
      const toEffectiveMode = getEffectiveMode(toHasToggle)
      
      let fromNodeWidth: number
      let toNodeWidth: number
      let fromPortYOffset: number
      let toPortYOffset: number
      
      if (fromEffectiveMode === "expanded") {
        fromNodeWidth = fromNode.type === "agent" ? 320 : 300
        fromPortYOffset = 28
      } else if (fromEffectiveMode === "visual") {
        fromNodeWidth = 90
        fromPortYOffset = 40
      } else {
        fromNodeWidth = fromNode.type === "agent" ? 320 : 300
        fromPortYOffset = 24
      }
      
      if (toEffectiveMode === "expanded") {
        toNodeWidth = toNode.type === "agent" ? 320 : 300
        toPortYOffset = 28
      } else if (toEffectiveMode === "visual") {
        toNodeWidth = 30
        toPortYOffset = 40
      } else {
        toNodeWidth = toNode.type === "agent" ? 320 : 300
        toPortYOffset = 24
      }

      let startY: number
      const isFromVisual = fromEffectiveMode === "visual"
      if (fromNode.type === "condition" && !isFromVisual) {
        const conditionHeight = fromEffectiveMode === "collapsed" ? 48 : (fromNode.type === "agent" ? 320 : 180)
        startY = conn.fromPort === "true" ? fromNode.position.y + conditionHeight * 0.3 : fromNode.position.y + conditionHeight * 0.7
      } else {
        startY = fromNode.position.y + fromPortYOffset
      }

      const startX = fromNode.position.x + fromNodeWidth
      const endX = toNode.position.x + (toEffectiveMode === "visual" ? 10 : 0)
      const endY = toNode.position.y + toPortYOffset

      const midX = (startX + endX) / 2
      const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`

      const fromStatus = nodeExecutionStatuses[fromNode.id]
      const toStatus = nodeExecutionStatuses[toNode.id]
      const isActive = fromStatus === "completed" && (toStatus === "running" || toStatus === "completed")
      const isRunningConnection = fromStatus === "completed" && toStatus === "running"

      return (
        <g key={conn.id}>
          {isRunningConnection && (
            <path d={path} fill="none" stroke="rgba(14,165,165,0.2)" strokeWidth={6} />
          )}
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
              <EnhancedWorkflowNodeV8
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                viewMode={nodeViewMode}
                isIndividuallyExpanded={individuallyExpandedNodes.has(node.id)}
                onToggleIndividualExpand={() => handleToggleNodeExpand(node.id)}
                onSelect={() => onNodeSelect(node)}
                onDoubleClick={() => onNodeDoubleClick(node)}
                onRun={() => onRunNode?.(node.id)}
                onAddNode={() => onAddNodeAfter?.(node.id)}
                onDelete={() => onDeleteNode?.(node.id)}
                onPositionChange={onNodePositionChange}
                scale={transform.scale}
                executionStatus={nodeExecutionStatuses[node.id]}
                isRunning={isRunning}
                theme={theme}
              />
            ))}

            {/* Execution Flow Indicators */}
            {showExecutionIndicators && startNodeId && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: nodes.find(n => n.id === startNodeId)?.position.x,
                  top: (nodes.find(n => n.id === startNodeId)?.position.y ?? 0) - 50,
                }}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-semibold shadow-lg border-2 border-green-400 animate-pulse">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  START
                </div>
              </div>
            )}

            {showExecutionIndicators && finishNodeId && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: nodes.find(n => n.id === finishNodeId)?.position.x,
                  top: (nodes.find(n => n.id === finishNodeId)?.position.y ?? 0) - 50,
                }}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500 text-white text-xs font-semibold shadow-lg border-2 border-blue-400 animate-pulse">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  FINISH
                </div>
              </div>
            )}
          </div>
        </div>

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
                onClick={() => onTidyUp(nodeViewMode)}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              Tidy Up
            </TooltipContent>
          </Tooltip>
          <div className="my-1 h-px w-full bg-border" />
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col rounded-full border border-border bg-muted/50 p-0.5 backdrop-blur-sm">
                <button
                  onClick={() => setNodeViewMode("visual")}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200",
                    nodeViewMode === "visual" 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Square className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={() => setNodeViewMode("collapsed")}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200",
                    nodeViewMode === "collapsed" 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setNodeViewMode("expanded")}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200",
                    nodeViewMode === "expanded" 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <PanelTop className="h-3.5 w-3.5" />
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              <div className="flex flex-col gap-1">
                <span>View Mode</span>
                <span className="text-muted-foreground">Visual / Collapsed / Expanded</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

      </div>
    </TooltipProvider>
  )
}
