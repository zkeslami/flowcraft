"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  X,
  Settings,
  Variable,
  Plus,
  Trash2,
  GripVertical,
  Workflow,
  Play,
  Square,
  Pause,
  StepForward,
  RotateCcw,
  Bug,
  Loader2,
} from "lucide-react"
import type {
  WorkflowNode,
  Connection,
  WorkflowMetadata,
  Variable as VariableType,
  NodeExecutionStatus,
} from "@/lib/workflow-types"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

type TopLevelTab = "properties" | "variables"

interface WorkflowPanelV2Props {
  nodes: WorkflowNode[]
  connections: Connection[]
  metadata: WorkflowMetadata
  workflowVariables: VariableType[]
  onClose: () => void
  onMetadataUpdate: (metadata: WorkflowMetadata) => void
  onVariablesUpdate: (variables: VariableType[]) => void
  onNodeSelect: (node: WorkflowNode | null) => void
  onRunWorkflow?: () => void
  isRunning?: boolean
  nodeExecutionStatuses: Record<string, NodeExecutionStatus>
  isPaused?: boolean
  onStop?: () => void
  onPause?: () => void
  onStepForward?: () => void
  onReset?: () => void
  onTest?: () => void
  initialTab?: TopLevelTab
}

export function WorkflowPanelV2({
  nodes,
  connections,
  metadata,
  workflowVariables,
  onClose,
  onMetadataUpdate,
  onVariablesUpdate,
  onNodeSelect,
  onRunWorkflow,
  isRunning = false,
  nodeExecutionStatuses,
  isPaused = false,
  onStop,
  onPause,
  onStepForward,
  onReset,
  onTest,
  initialTab = "properties",
}: WorkflowPanelV2Props) {
  const [topLevelTab, setTopLevelTab] = useState<TopLevelTab>(initialTab)
  const [columnWidth, setColumnWidth] = useState(50)
  const [resizingColumn, setResizingColumn] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleColumnResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setResizingColumn(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100
        if (newWidth >= 25 && newWidth <= 75) {
          setColumnWidth(newWidth)
        }
      }
    }

    const handleMouseUp = () => {
      setResizingColumn(false)
    }

    if (resizingColumn) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = "none"
      document.body.style.cursor = "ew-resize"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [resizingColumn])

  const handleAddVariable = () => {
    const newVariable: VariableType = {
      id: `wv-${Date.now()}`,
      name: "NEW_VARIABLE",
      value: "",
      type: "string",
    }
    onVariablesUpdate([...workflowVariables, newVariable])
  }

  const handleUpdateVariable = (varId: string, field: keyof VariableType, value: string) => {
    onVariablesUpdate(workflowVariables.map((v) => (v.id === varId ? { ...v, [field]: value } : v)))
  }

  const handleDeleteVariable = (varId: string) => {
    onVariablesUpdate(workflowVariables.filter((v) => v.id !== varId))
  }

  // Calculate stats
  const nodesByType = nodes.reduce(
    (acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const renderPropertiesTab = () => (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      {/* Overview Stats */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Overview</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <div className="text-2xl font-bold text-foreground">{nodes.length}</div>
            <div className="text-xs text-muted-foreground">Total Nodes</div>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <div className="text-2xl font-bold text-foreground">{connections.length}</div>
            <div className="text-xs text-muted-foreground">Connections</div>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <div className="text-2xl font-bold text-foreground">{workflowVariables.length}</div>
            <div className="text-xs text-muted-foreground">Variables</div>
          </div>
        </div>
      </div>

      {/* Node Breakdown */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Node Breakdown</h4>
        <div className="space-y-2">
          {Object.entries(nodesByType).map(([type, count]) => (
            <div
              key={type}
              className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    type === "trigger" && "bg-chart-2",
                    type === "function" && "bg-chart-3",
                    type === "condition" && "bg-chart-4",
                    type === "action" && "bg-primary",
                  )}
                />
                <span className="text-sm capitalize text-foreground">{type}</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Settings</h4>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              value={metadata.name}
              onChange={(e) => onMetadataUpdate({ ...metadata, name: e.target.value })}
              className="mt-1 h-9 bg-secondary/50"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              value={metadata.description}
              onChange={(e) => onMetadataUpdate({ ...metadata, description: e.target.value })}
              className="mt-1 min-h-[80px] bg-secondary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Version</Label>
              <Input
                value={metadata.version}
                onChange={(e) => onMetadataUpdate({ ...metadata, version: e.target.value })}
                className="mt-1 h-9 bg-secondary/50"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Author</Label>
              <Input
                value={metadata.author}
                onChange={(e) => onMetadataUpdate({ ...metadata, author: e.target.value })}
                className="mt-1 h-9 bg-secondary/50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderVariablesTab = () => (
    <div className="flex-1 overflow-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-foreground">Workflow Variables</h4>
        <Button size="sm" variant="outline" className="gap-2 bg-transparent" onClick={handleAddVariable}>
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Variables defined here are available to all nodes in the workflow.
      </p>
      <div className="space-y-2">
        {workflowVariables.map((variable) => (
          <div
            key={variable.id}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-2"
          >
            <Input
              value={variable.name}
              onChange={(e) => handleUpdateVariable(variable.id, "name", e.target.value)}
              className="h-8 flex-1 bg-secondary/50 font-mono text-xs"
              placeholder="VARIABLE_NAME"
            />
            <Input
              value={variable.value}
              onChange={(e) => handleUpdateVariable(variable.id, "value", e.target.value)}
              className="h-8 flex-1 bg-secondary/50 text-xs"
              placeholder="value"
            />
            <select
              value={variable.type}
              onChange={(e) => handleUpdateVariable(variable.id, "type", e.target.value)}
              className="h-8 rounded-md border border-border bg-secondary/50 px-2 text-xs text-foreground"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="secret">Secret</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive"
              onClick={() => handleDeleteVariable(variable.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {workflowVariables.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-6 text-center">
            <Variable className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No workflow variables defined</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div ref={containerRef} className="flex h-full bg-background">
      {/* Left: Graph with toolbar - no header here */}
      <div className="relative" style={{ width: `${columnWidth}%` }}>
        <WorkflowMiniGraph
          nodes={nodes}
          connections={connections}
          onNodeSelect={onNodeSelect}
          nodeExecutionStatuses={nodeExecutionStatuses}
        />

        <TooltipProvider delayDuration={300}>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card/95 backdrop-blur-sm px-2 py-1.5 shadow-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRunWorkflow}
                    disabled={isRunning && !isPaused}
                    className={cn("h-8 w-8 p-0", !isRunning && "text-primary hover:text-primary hover:bg-primary/10")}
                  >
                    {isRunning && !isPaused ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Run Workflow</p>
                </TooltipContent>
              </Tooltip>

              {onPause && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={onPause} disabled={!isRunning} className="h-8 w-8 p-0">
                      <Pause className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Pause</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {onStop && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onStop}
                      disabled={!isRunning}
                      className={cn(
                        "h-8 w-8 p-0",
                        isRunning && "text-destructive hover:text-destructive hover:bg-destructive/10",
                      )}
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Stop</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Separator orientation="vertical" className="h-5 mx-1" />

              {onStepForward && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onStepForward}
                      disabled={!isPaused}
                      className="h-8 w-8 p-0"
                    >
                      <StepForward className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Step Forward</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {onReset && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={onReset} className="h-8 w-8 p-0">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Reset</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {onTest && (
                <>
                  <Separator orientation="vertical" className="h-5 mx-1" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={onTest} disabled={isRunning} className="h-8 w-8 p-0">
                        <Bug className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Debug Mode</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* Resize handle */}
      <div
        className="relative w-1 cursor-ew-resize bg-border hover:bg-primary/50 active:bg-primary"
        onMouseDown={handleColumnResizeStart}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Right: Panel with header + content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header - only spans the right panel */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/20 text-primary">
              <Workflow className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">{metadata.name}</h3>
              <p className="text-xs text-muted-foreground">Workflow</p>
            </div>
          </div>

          {/* Properties/Variables toggle + close button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-md bg-muted p-0.5">
              <button
                onClick={() => setTopLevelTab("properties")}
                className={cn(
                  "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors",
                  topLevelTab === "properties"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Settings className="h-4 w-4" />
                Properties
              </button>
              <button
                onClick={() => setTopLevelTab("variables")}
                className={cn(
                  "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors",
                  topLevelTab === "variables"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Variable className="h-4 w-4" />
                Variables
              </button>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} title="Close panel">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {topLevelTab === "properties" ? renderPropertiesTab() : renderVariablesTab()}
      </div>
    </div>
  )
}

// Mini Graph Component - keeping existing implementation
function WorkflowMiniGraph({
  nodes,
  connections,
  onNodeSelect,
  nodeExecutionStatuses,
}: {
  nodes: WorkflowNode[]
  connections: Connection[]
  onNodeSelect: (node: WorkflowNode | null) => void
  nodeExecutionStatuses: Record<string, NodeExecutionStatus>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const hasDraggedRef = useRef(false)
  const mouseStartRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Initialize view to fit all nodes
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0 && nodes.length > 0) {
      const padding = 50
      const minX = Math.min(...nodes.map((n) => n.position.x)) - padding
      const maxX = Math.max(...nodes.map((n) => n.position.x + 180)) + padding
      const minY = Math.min(...nodes.map((n) => n.position.y)) - padding
      const maxY = Math.max(...nodes.map((n) => n.position.y + 80)) + padding

      const contentWidth = maxX - minX
      const contentHeight = maxY - minY

      const scaleX = dimensions.width / contentWidth
      const scaleY = dimensions.height / contentHeight
      const scale = Math.min(scaleX, scaleY, 1)

      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2

      setTransform({
        x: dimensions.width / 2 - centerX * scale,
        y: dimensions.height / 2 - centerY * scale,
        scale,
      })
    }
  }, [dimensions, nodes])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform((prev) => {
      const newScale = Math.min(Math.max(prev.scale * delta, 0.2), 3)
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return prev
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      return {
        x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
        y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
        scale: newScale,
      }
    })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsPanning(true)
    hasDraggedRef.current = false
    mouseStartRef.current = { x: e.clientX, y: e.clientY }
    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return
      const dx = e.clientX - lastMousePos.current.x
      const dy = e.clientY - lastMousePos.current.y

      const distFromStart = Math.sqrt(
        Math.pow(e.clientX - mouseStartRef.current.x, 2) + Math.pow(e.clientY - mouseStartRef.current.y, 2),
      )
      if (distFromStart > 3) {
        hasDraggedRef.current = true
      }

      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }))
      lastMousePos.current = { x: e.clientX, y: e.clientY }
    },
    [isPanning],
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleNodeClick = useCallback(
    (e: React.MouseEvent, node: WorkflowNode) => {
      e.stopPropagation()
      if (!hasDraggedRef.current) {
        onNodeSelect(node)
      }
    },
    [onNodeSelect],
  )

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "trigger":
        return "⚡"
      case "function":
        return "ƒ"
      case "condition":
        return "◇"
      case "action":
        return "▶"
      default:
        return "•"
    }
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case "trigger":
        return "border-chart-2 bg-chart-2/10"
      case "function":
        return "border-chart-3 bg-chart-3/10"
      case "condition":
        return "border-chart-4 bg-chart-4/10"
      case "action":
        return "border-primary bg-primary/10"
      default:
        return "border-border bg-secondary"
    }
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden bg-background"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
    >
      {/* Grid */}
      <svg className="absolute inset-0 h-full w-full pointer-events-none">
        <defs>
          <pattern
            id="mini-grid"
            width={20 * transform.scale}
            height={20 * transform.scale}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={1} cy={1} r={0.5} fill="currentColor" className="text-border" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mini-grid)" />
      </svg>

      {dimensions.width > 0 && (
        <div
          className="absolute"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Connections */}
          <svg className="absolute overflow-visible" style={{ width: 1, height: 1 }}>
            {connections.map((conn) => {
              const fromNode = nodes.find((n) => n.id === conn.from)
              const toNode = nodes.find((n) => n.id === conn.to)
              if (!fromNode || !toNode) return null

              const fromX = fromNode.position.x + 180
              const fromY = fromNode.position.y + 35
              const toX = toNode.position.x
              const toY = toNode.position.y + 35

              const midX = (fromX + toX) / 2

              return (
                <path
                  key={conn.id}
                  d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="text-border"
                />
              )
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const status = nodeExecutionStatuses[node.id]
            return (
              <div
                key={node.id}
                className={cn(
                  "absolute flex items-center gap-2 rounded-lg border-2 px-3 py-2 cursor-pointer transition-all",
                  getNodeColor(node.type),
                  status === "running" && "animate-pulse ring-2 ring-primary",
                  status === "completed" && "ring-2 ring-green-500",
                  status === "failed" && "ring-2 ring-destructive",
                )}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  width: 180,
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => handleNodeClick(e, node)}
              >
                <span className="text-base">{getNodeIcon(node.type)}</span>
                <span className="text-xs font-medium truncate text-foreground">{node.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
