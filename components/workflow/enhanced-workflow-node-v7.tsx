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
  Play,
  Plus,
  Pencil,
  Trash2,
  Bot,
  Brain,
  Wrench,
  FileText,
  Activity,
  Sparkles,
  Settings, // Added import for Settings
} from "lucide-react"
import type { WorkflowNode as WorkflowNodeType, NodeExecutionStatus } from "@/lib/workflow-types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AgentPromptEditor } from "@/components/prompt-editor/AgentPromptEditor"

interface EnhancedWorkflowNodeV7Props {
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

// Icon background colors - dark rounded square
const iconBgColors: Record<string, string> = {
  trigger: "bg-[#1a1a1e]",
  function: "bg-[#1a1a1e]",
  condition: "bg-[#1a1a1e]",
  action: "bg-[#1a1a1e]",
  agent: "bg-[#1a1a1e]",
}

const iconColors: Record<string, string> = {
  trigger: "text-foreground",
  function: "text-foreground",
  condition: "text-foreground",
  action: "text-foreground",
  agent: "text-foreground",
}

const hoverColors: Record<string, string> = {
  trigger: "border-teal-500",
  function: "border-teal-500",
  condition: "border-teal-500",
  action: "border-teal-500",
  agent: "border-teal-500",
}

const selectedColors: Record<string, string> = {
  trigger: "border-teal-500",
  function: "border-teal-500",
  condition: "border-teal-500",
  action: "border-teal-500",
  agent: "border-teal-500",
}

export function EnhancedWorkflowNodeV7({
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
}: EnhancedWorkflowNodeV7Props) {
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Health Score</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-[#1a1a1e] overflow-hidden">
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
          <span className="text-xs font-medium text-primary">{llm}</span>
        </div>
      </div>
    )
  }

  const nodeWidth = node.type === "agent" ? 320 : 300
  const minHeight = isMinimized ? 48 : node.type === "agent" ? 320 : 180
  const maxHeight = node.type === "agent" ? 380 : 250

  const displayX = dragPosition?.x ?? node.position.x
  const displayY = dragPosition?.y ?? node.position.y

  // Show hover menu on hover (regardless of selection state)
  const showHoverMenu = isHovered && !isDragging

  return (
    <TooltipProvider>
      <div
        className={cn(
          "absolute flex flex-col rounded-xl bg-[#1e1e22] transition-all duration-200 select-none",
          // Default border and shadow
          "border border-border shadow-md",
          // Hover state - bold 2px primary border with drop shadow
          isHovered && !isSelected && "border-2 border-primary shadow-[0_8px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(14,165,165,0.15)]",
          // Selected state - double border effect with stronger drop shadow
          isSelected && "border-2 border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-[#1e1e22] shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(14,165,165,0.25)]",
          isDragging && "cursor-grabbing opacity-90 scale-105 z-50 shadow-2xl",
          !isDragging && "cursor-grab",
          executionStatus === "running" && "border-2 border-primary shadow-[0_8px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(14,165,165,0.3)]",
          executionStatus === "completed" && "border-2 border-green-500 shadow-[0_8px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(34,197,94,0.3)]",
          executionStatus === "failed" && "border-2 border-red-500 shadow-[0_8px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(239,68,68,0.3)]",
        )}
        style={{
          left: displayX,
          top: displayY,
          width: nodeWidth,
          minHeight: isMinimized ? "auto" : minHeight,
          maxHeight: isMinimized ? "auto" : maxHeight,
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

        {node.type !== "trigger" && !isMinimized && isHovered && (
          <div
            className={cn(
              "absolute -left-2 top-7 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-border bg-[#1e1e22] transition-all duration-200 z-10",
              executionStatus === "completed" && "border-green-500 bg-green-500",
            )}
          />
        )}

        {/* Header */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-3",
          isMinimized && "py-2"
        )}>
          <div className={cn(
            "flex items-center justify-center rounded-lg",
            isMinimized ? "h-8 w-8" : "h-10 w-10",
            iconBgColors[node.type]
          )}>
            <Icon className={cn(isMinimized ? "h-4 w-4" : "h-5 w-5", iconColors[node.type])} />
          </div>
          <span className="flex-1 text-sm font-medium text-foreground truncate">{node.label}</span>
          <button
            onClick={handleToggleMinimize}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted/50 transition-colors"
          >
            <ChevronDown className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              !isMinimized && "rotate-180"
            )} />
          </button>
        </div>

        {/* Content area */}
        {!isMinimized && (
          <div className="flex-1 overflow-hidden px-3 pb-3">
            <div className="h-full rounded-lg bg-[#2a2a2e] overflow-auto p-3 space-y-3">
              {/* Agent-specific content with sliders */}
              {node.type === "agent" ? (
                <div className="space-y-3">
                  {/* User Prompt field */}
                  <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wide">User Prompt</label>
                    <div className="mt-1">
                      <AgentPromptEditor
                        value={node.data?.userPrompt || ""}
                        onChange={() => {}}
                        nodeId={`${node.id}-v7`}
                      />
                    </div>
                  </div>

                  {renderAgentContent()}
                  
                  {/* Temperature slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Temperature</label>
                      <span className="text-xs text-foreground">{node.data?.temperature ?? 0.7}</span>
                    </div>
                    <Slider
                      defaultValue={[node.data?.temperature ?? 0.7]}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full"
                      onPointerDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Max tokens slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Max Tokens</label>
                      <span className="text-xs text-foreground">{node.data?.maxTokens ?? 2048}</span>
                    </div>
                    <Slider
                      defaultValue={[node.data?.maxTokens ?? 2048]}
                      min={256}
                      max={8192}
                      step={256}
                      className="w-full"
                      onPointerDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* Empty field boxes for non-agent nodes */}
                  <div className="space-y-2">
                    <div className="h-8 rounded bg-[#1a1a1e]" />
                    <div className="h-8 rounded bg-[#1a1a1e]" />
                  </div>

                  {/* Autopilot recommendations - only on specific nodes */}
                  {(node.id === "validate-invoice" || node.id === "process-payment") && (
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Autopilot Recommendations</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Add error handling for invalid data
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs w-full bg-transparent border-primary/30 text-primary hover:bg-primary/10"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        Apply Recommendation
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Hover menu - only on hover, NOT on selection, right-aligned */}
        {showHoverMenu && (
          <div className="absolute -top-10 right-0 flex items-center gap-1 rounded-lg border border-border bg-[#1e1e22] px-2 py-1 shadow-lg backdrop-blur-sm z-20">
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
                  <Pencil className="h-3.5 w-3.5" />
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
                  className="h-7 w-7"
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

        {!isMinimized && isHovered && (
          node.type === "condition" ? (
            <>
              <div
                className={cn(
                  "absolute -right-2 top-[30%] h-4 w-4 rounded-full border-2 border-primary bg-[#1e1e22] transition-all duration-200 z-10",
                  executionStatus === "completed" && "border-green-500 bg-green-500",
                )}
              >
                <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-primary">T</span>
              </div>
              <div
                className={cn(
                  "absolute -right-2 top-[70%] h-4 w-4 rounded-full border-2 border-red-500/70 bg-[#1e1e22] transition-all duration-200 z-10",
                  executionStatus === "failed" && "border-red-500 bg-red-500",
                )}
              >
                <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-red-500/70">F</span>
              </div>
            </>
          ) : (
            <div
              className={cn(
                "absolute -right-2 top-7 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-border bg-[#1e1e22] transition-all duration-200 z-10",
                executionStatus === "completed" && "border-green-500 bg-green-500",
              )}
            />
          )
        )}
      </div>
    </TooltipProvider>
  )
}
