"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import {
  Zap,
  Code,
  GitBranch,
  Send,
  Webhook,
  ChevronDown,
  ChevronRight,
  Play,
  Plus,
  Settings,
  Trash2,
  Bot,
  Brain,
  Wrench,
  FileText,
  Activity,
} from "lucide-react"
import type { WorkflowNode as WorkflowNodeType, NodeExecutionStatus } from "@/lib/workflow-types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface EnhancedWorkflowNodeProps {
  node: WorkflowNodeType
  isSelected: boolean
  isMinimized: boolean
  onSelect: () => void
  onDoubleClick: () => void
  onToggleMinimize: () => void
  onRun?: () => void
  onAddNode?: () => void
  onDelete?: () => void
  onPositionChange?: (nodeId: string, position: { x: number; y: number }) => void
  scale?: number
  executionStatus?: NodeExecutionStatus
  isRunning?: boolean
}

const nodeIcons: Record<string, React.ElementType> = {
  trigger: Webhook,
  function: Code,
  condition: GitBranch,
  action: Send,
  agent: Bot,
}

const nodeColors: Record<string, string> = {
  trigger: "border-chart-2 bg-chart-2/10",
  function: "border-chart-3 bg-chart-3/10",
  condition: "border-chart-4 bg-chart-4/10",
  action: "border-primary bg-primary/10",
  agent: "border-emerald-500 bg-emerald-500/10",
}

const iconColors: Record<string, string> = {
  trigger: "text-chart-2",
  function: "text-chart-3",
  condition: "text-chart-4",
  action: "text-primary",
  agent: "text-emerald-500",
}

const hoverGlowColors: Record<string, string> = {
  trigger: "hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]",
  function: "hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]",
  condition: "hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]",
  action: "hover:shadow-[0_0_20px_rgba(14,208,229,0.3)]",
  agent: "hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]",
}

export function EnhancedWorkflowNode({
  node,
  isSelected,
  isMinimized,
  onSelect,
  onDoubleClick,
  onToggleMinimize,
  onRun,
  onAddNode,
  onDelete,
  onPositionChange,
  scale = 1,
  executionStatus = "idle",
  isRunning = false,
}: EnhancedWorkflowNodeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const nodeStartPos = useRef({ x: 0, y: 0 })
  const hasDragged = useRef(false)
  const Icon = nodeIcons[node.type] || Zap

  useEffect(() => {
    if (!isDragging) {
      setDragPosition(null)
    }
  }, [node.position.x, node.position.y, isDragging])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("button") || target.closest("input")) {
        return
      }

      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      hasDragged.current = false
      dragStartPos.current = { x: e.clientX, y: e.clientY }
      nodeStartPos.current = { x: node.position.x, y: node.position.y }

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const totalDeltaX = (moveEvent.clientX - dragStartPos.current.x) / scale
        const totalDeltaY = (moveEvent.clientY - dragStartPos.current.y) / scale

        if (Math.abs(totalDeltaX) > 3 || Math.abs(totalDeltaY) > 3) {
          hasDragged.current = true
        }

        const newX = nodeStartPos.current.x + totalDeltaX
        const newY = nodeStartPos.current.y + totalDeltaY

        setDragPosition({ x: newX, y: newY })
      }

      const handleMouseUp = (upEvent: MouseEvent) => {
        setIsDragging(false)

        if (hasDragged.current) {
          const totalDeltaX = (upEvent.clientX - dragStartPos.current.x) / scale
          const totalDeltaY = (upEvent.clientY - dragStartPos.current.y) / scale
          const finalX = nodeStartPos.current.x + totalDeltaX
          const finalY = nodeStartPos.current.y + totalDeltaY
          onPositionChange?.(node.id, { x: finalX, y: finalY })
        }

        setDragPosition(null)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [node.id, node.position.x, node.position.y, scale, onPositionChange],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!hasDragged.current) {
        onSelect()
      }
      hasDragged.current = false
    },
    [onSelect],
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!hasDragged.current) {
        onDoubleClick()
      }
    },
    [onDoubleClick],
  )

  const handleToggleMinimize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggleMinimize()
    },
    [onToggleMinimize],
  )

  const getPreviewContent = () => {
    if (node.data?.code) {
      const lines = node.data.code
        .split("\n")
        .filter((line: string) => line.trim() && !line.trim().startsWith("//"))
        .slice(0, 4)
      return lines.join("\n")
    }
    if (node.type === "trigger") {
      return `Method: ${node.data?.method || "POST"}\nPath: ${node.data?.path || "/api/webhook"}`
    }
    if (node.type === "condition") {
      return `Condition: ${node.data?.condition || "value === true"}`
    }
    if (node.type === "action") {
      return `Service: ${node.data?.service || "API"}`
    }
    return "Configure this node..."
  }

  const renderAgentContent = () => {
    if (node.type !== "agent") return null

    const health = node.data?.agentHealth ?? 94
    const evaluations = node.data?.evaluationsRun ?? 1247
    const llm = node.data?.currentLLM ?? "GPT-4o"
    const context = node.data?.context ?? ["Invoice Schema", "Vendor Database", "Payment Terms"]
    const tools = node.data?.tools ?? ["OCR Extract", "Amount Validator", "Date Parser", "Vendor Lookup"]

    const healthColor = health >= 90 ? "text-green-500" : health >= 70 ? "text-yellow-500" : "text-red-500"

    return (
      <div className="px-3 py-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Health Score</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  health >= 90 ? "bg-green-500" : health >= 70 ? "bg-yellow-500" : "bg-red-500",
                )}
                style={{ width: `${health}%` }}
              />
            </div>
            <span className={cn("text-xs font-medium", healthColor)}>{health}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Evaluations</span>
          </div>
          <span className="text-xs font-medium text-foreground">{evaluations.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">LLM</span>
          </div>
          <span className="text-xs font-medium text-emerald-500">{llm}</span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Context</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {context.slice(0, 3).map((ctx: string, i: number) => (
              <span key={i} className="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground">
                {ctx}
              </span>
            ))}
            {context.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground">
                +{context.length - 3}
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Tools</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {tools.slice(0, 3).map((tool: string, i: number) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              >
                {tool}
              </span>
            ))}
            {tools.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                +{tools.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  const nodeWidth = node.type === "agent" ? 300 : 280
  const minHeight = isMinimized ? 44 : node.type === "agent" ? 220 : 160
  const maxHeight = node.type === "agent" ? 280 : 240

  const displayX = dragPosition?.x ?? node.position.x
  const displayY = dragPosition?.y ?? node.position.y

  return (
    <TooltipProvider>
      <div
        className={cn(
          "absolute flex flex-col rounded-lg border-2 bg-card shadow-lg transition-all duration-200 select-none",
          nodeColors[node.type],
          hoverGlowColors[node.type],
          isHovered && !isSelected && "scale-[1.02] shadow-xl bg-card/95",
          isSelected
            ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_30px_rgba(14,208,229,0.4)]"
            : "",
          isDragging && "cursor-grabbing opacity-90 scale-105 z-50 shadow-2xl",
          !isDragging && "cursor-grab",
          executionStatus === "running" && "ring-2 ring-chart-2 ring-offset-2 ring-offset-background",
          executionStatus === "completed" && "ring-2 ring-green-500 ring-offset-2 ring-offset-background",
          executionStatus === "failed" && "ring-2 ring-red-500 ring-offset-2 ring-offset-background",
        )}
        style={{
          left: displayX,
          top: displayY,
          width: nodeWidth,
          minHeight: minHeight,
          maxHeight: isMinimized ? minHeight : maxHeight,
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {executionStatus === "running" && (
          <>
            <div className="absolute inset-0 animate-pulse rounded-lg bg-chart-2/20" />
            <div
              className="absolute -inset-1 animate-ping rounded-lg bg-chart-2/30 opacity-75"
              style={{ animationDuration: "1.5s" }}
            />
          </>
        )}

        {executionStatus === "completed" && (
          <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-lg animate-in zoom-in duration-300 z-10">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {executionStatus === "failed" && (
          <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg animate-in zoom-in duration-300 z-10">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}

        {node.type !== "trigger" && (
          <div
            className={cn(
              "absolute -left-2 top-5 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-border bg-card transition-colors duration-300 z-10",
              executionStatus === "running" && "border-chart-2 bg-chart-2",
              executionStatus === "completed" && "border-green-500 bg-green-500",
            )}
          />
        )}

        <div className={cn("flex items-center gap-2 px-3 py-2 border-b border-border/50", isMinimized && "border-b-0")}>
          <div className={cn("flex h-6 w-6 items-center justify-center rounded", nodeColors[node.type])}>
            <Icon className={cn("h-3.5 w-3.5", iconColors[node.type])} />
          </div>
          <span className="flex-1 text-sm font-medium text-foreground truncate">{node.label}</span>
          <button
            onClick={handleToggleMinimize}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted transition-colors"
          >
            {isMinimized ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {!isMinimized && (
          <div className="flex-1 overflow-hidden">
            {node.type === "agent" ? (
              renderAgentContent()
            ) : (
              <>
                <div className="px-3 py-2">
                  <div className="rounded-md border border-dashed border-border bg-muted/30 p-2">
                    <pre className="text-xs text-muted-foreground overflow-hidden whitespace-pre-wrap line-clamp-4 font-mono">
                      {getPreviewContent()}
                    </pre>
                  </div>
                </div>

                {(node.type === "function" || node.type === "trigger") && (
                  <div className="px-3 pb-2">
                    <input
                      type="text"
                      placeholder="Write additional text"
                      className="w-full rounded-md border border-border bg-muted/50 px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                {node.type === "function" && (
                  <div className="px-3 pb-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRun?.()
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      disabled={isRunning}
                    >
                      <Play className="h-3 w-3" />
                      Run Model
                    </Button>
                  </div>
                )}
              </>
            )}

            {node.type === "agent" && (
              <div className="px-3 pb-2 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 bg-transparent border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRun?.()
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={isRunning}
                >
                  <Play className="h-3 w-3" />
                  Run Agent
                </Button>
              </div>
            )}
          </div>
        )}

        {(isHovered || isSelected) && !isDragging && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-lg border border-border bg-card/95 px-2 py-1 shadow-lg backdrop-blur-sm z-20">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRun?.()
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={isRunning}
                >
                  <Play className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Run Node
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddNode?.()
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Add Node
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDoubleClick()
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Properties
              </TooltipContent>
            </Tooltip>
            <div className="mx-1 h-4 w-px bg-border" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.()
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Delete
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {node.type === "condition" ? (
          <>
            <div
              className={cn(
                "absolute -right-2 top-[30%] h-4 w-4 rounded-full border-2 border-primary bg-card transition-colors duration-300 z-10",
                executionStatus === "completed" && "border-green-500 bg-green-500",
              )}
            >
              <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-primary">T</span>
            </div>
            <div
              className={cn(
                "absolute -right-2 top-[70%] h-4 w-4 rounded-full border-2 border-chart-5 bg-card transition-colors duration-300 z-10",
                executionStatus === "completed" && "border-green-500 bg-green-500",
              )}
            >
              <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-chart-5">F</span>
            </div>
          </>
        ) : (
          <div
            className={cn(
              "absolute -right-2 top-5 h-4 w-4 rounded-full border-2 border-primary bg-primary transition-colors duration-300 z-10",
              executionStatus === "completed" && "border-green-500 bg-green-500",
            )}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
