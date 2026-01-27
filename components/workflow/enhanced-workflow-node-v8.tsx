"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import {
  Zap,
  Code,
  GitBranch,
  Send,
  Webhook,
  Play,
  Plus,
  Pencil,
  Trash2,
  Bot,
  Brain,
  FileText,
  Sparkles,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react"
import type { WorkflowNode as WorkflowNodeType, NodeExecutionStatus } from "@/lib/workflow-types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AgentPromptEditor } from "@/components/prompt-editor/AgentPromptEditor"

export type NodeViewMode = "collapsed" | "expanded" | "visual"

interface EnhancedWorkflowNodeV8Props {
  node: WorkflowNodeType
  isSelected: boolean
  viewMode: NodeViewMode
  isIndividuallyExpanded?: boolean
  onToggleIndividualExpand?: () => void
  onSelect: () => void
  onDoubleClick: () => void
  onRun?: () => void
  onAddNode?: () => void
  onDelete?: () => void
  onPositionChange?: (nodeId: string, position: { x: number; y: number }) => void
  scale?: number
  executionStatus?: NodeExecutionStatus
  isRunning?: boolean
  theme?: "dark" | "light"
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

export function EnhancedWorkflowNodeV8({
  node,
  isSelected,
  viewMode,
  isIndividuallyExpanded = false,
  onToggleIndividualExpand,
  onSelect,
  onDoubleClick,
  onRun,
  onAddNode,
  onDelete,
  onPositionChange,
  scale = 1,
  executionStatus = "idle",
  isRunning = false,
  theme = "dark",
}: EnhancedWorkflowNodeV8Props) {
  const isLight = theme === "light"
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

  // Calculate effective view mode based on global mode and individual expansion
  const getEffectiveViewMode = (): NodeViewMode => {
    // In expanded global mode: 
    // - Default is expanded, but can be individually collapsed
    if (viewMode === "expanded") {
      return isIndividuallyExpanded ? "collapsed" : "expanded"
    }
    // In collapsed/visual modes:
    // - Default is the global mode, but can be individually expanded
    if (isIndividuallyExpanded) return "expanded"
    return viewMode
  }
  
  const effectiveViewMode = getEffectiveViewMode()
  
  // Calculate dimensions based on effective view mode
  const getNodeDimensions = () => {
  if (effectiveViewMode === "expanded") {
  // Larger height for agent nodes with autopilot section (id: 3 is Validate Invoice)
  const isAgentWithAutopilot = node.type === "agent" && node.id === "3"
  return {
  width: node.type === "agent" ? 320 : 300,
  minHeight: isAgentWithAutopilot ? 420 : (node.type === "agent" ? 320 : 180),
  maxHeight: isAgentWithAutopilot ? 480 : (node.type === "agent" ? 380 : 250)
  }
  }
    if (effectiveViewMode === "visual") {
      return { width: 120, minHeight: "auto", maxHeight: "auto" }
    }
    // collapsed
    return { width: node.type === "agent" ? 320 : 300, minHeight: "auto", maxHeight: "auto" }
  }

  const dimensions = getNodeDimensions()
  const displayX = dragPosition?.x ?? node.position.x
  const displayY = dragPosition?.y ?? node.position.y

  // Show hover menu on hover (regardless of selection state)
  const showHoverMenu = isHovered && !isDragging

  // Visual view - larger icon with label below and hover menu
  if (effectiveViewMode === "visual") {
    return (
      <TooltipProvider>
        <div
          className="absolute flex flex-col items-center transition-all duration-200 select-none"
          style={{
            left: displayX,
            top: displayY,
            width: 120,
          }}
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          onDoubleClick={(e) => {
            e.stopPropagation()
            if (!hasDragged.current) {
              // Double click expands to expanded wide view in visual mode
              onToggleIndividualExpand?.()
            }
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Hover menu for visual */}
          {showHoverMenu && (
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-lg bg-[#1e1e22] border border-border p-1 shadow-lg z-20"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRun?.()
                    }}
                  >
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Run Node</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDoubleClick()
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Edit Properties</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete?.()
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Delete Node</TooltipContent>
              </Tooltip>
            </div>
          )}
          
          {/* Visual icon container - larger size */}
          <div
            className={cn(
              "relative flex items-center justify-center rounded-[24px] transition-all duration-200",
              isLight ? "bg-white" : "bg-[#1e1e22]",
              isLight
                ? "border border-border shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                : "border border-border shadow-[0_8px_24px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.3)]",
              isSelected && (isLight
                ? "border-2 border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-white"
                : "border-2 border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-[#1e1e22]"),
              isHovered && !isSelected && "border-2 border-primary",
              isDragging && "cursor-grabbing opacity-90 scale-105 z-50",
              !isDragging && "cursor-grab",
              executionStatus === "running" && "border-2 border-blue-500",
              executionStatus === "completed" && "border-2 border-green-500",
              executionStatus === "failed" && "border-2 border-red-500",
            )}
            style={{ width: 80, height: 80 }}
          >
            {/* Running status - blue pulsing background */}
            {executionStatus === "running" && (
              <>
                <div className="absolute inset-0 animate-pulse rounded-[24px] bg-blue-500/20" />
                <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-blue-500/15 to-blue-600/5" />
              </>
            )}

            {/* Completed status - green tint background */}
            {executionStatus === "completed" && (
              <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-green-500/15 to-green-600/5" />
            )}

            {/* Failed status - red tint background */}
            {executionStatus === "failed" && (
              <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-red-500/15 to-red-600/5" />
            )}

            <Icon className={cn(
              "h-9 w-9 relative z-10",
              isSelected ? "text-primary" : "text-foreground",
              executionStatus === "running" && "text-blue-400",
              executionStatus === "completed" && "text-green-400",
              executionStatus === "failed" && "text-red-400"
            )} />

            {/* Running icon - spinning loader */}
            {executionStatus === "running" && (
              <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg z-20 animate-spin">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}

            {/* Completed icon - checkmark */}
            {executionStatus === "completed" && (
              <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-lg z-20">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}

            {/* Failed icon - X mark */}
            {executionStatus === "failed" && (
              <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg z-20">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Label below visual icon */}
          <div className="relative mt-2.5 flex items-center justify-center">
            <span className="text-xs font-medium text-foreground text-center max-w-[120px] truncate">
              {node.label}
            </span>
            {/* Autopilot indicator - anchored to upper right of label */}
            {(node.id === "2" || node.id === "3") && (
              <Sparkles className="absolute -top-1.5 -right-3 h-3 w-3 text-primary" />
            )}
          </div>
          
          {/* Connection ports - only on hover */}
          {isHovered && (
            <>
              {node.type !== "trigger" && (
                <div className="absolute left-[10px] top-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-border bg-[#1e1e22] z-10" />
              )}
              {node.type === "condition" ? (
                <>
                  <div className="absolute right-[10px] top-6 h-3 w-3 translate-x-1/2 rounded-full border-2 border-primary bg-[#1e1e22] z-10" />
                  <div className="absolute right-[10px] top-14 h-3 w-3 translate-x-1/2 rounded-full border-2 border-red-500/70 bg-[#1e1e22] z-10" />
                </>
              ) : (
                <div className="absolute right-[10px] top-10 h-3 w-3 translate-x-1/2 rounded-full border-2 border-border bg-[#1e1e22] z-10" />
              )}
            </>
          )}
        </div>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "absolute flex flex-col rounded-xl transition-all duration-200 select-none z-10",
          isLight ? "bg-white" : "bg-[#1e1e22]",
          // Default border and shadow
          isLight 
            ? "border border-border shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)]"
            : "border border-border shadow-[0_8px_24px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.3)]",
          // Selected state - primary border with ring
          isSelected && (isLight 
            ? "border-2 border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-white shadow-[0_8px_24px_rgba(0,0,0,0.12),0_0_20px_rgba(14,165,165,0.15)] z-30"
            : "border-2 border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-[#1e1e22] shadow-[0_16px_50px_rgba(0,0,0,0.7),0_0_35px_rgba(14,165,165,0.3)] z-30"),
          // Hover state - bold 2px primary border with enhanced drop shadow
          isHovered && !isSelected && (isLight
            ? "border-2 border-primary shadow-[0_6px_20px_rgba(0,0,0,0.1),0_0_12px_rgba(14,165,165,0.1)] z-20"
            : "border-2 border-primary shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_24px_rgba(14,165,165,0.2)] z-20"),
          isDragging && (isLight
            ? "cursor-grabbing opacity-90 scale-105 z-50 shadow-[0_12px_30px_rgba(0,0,0,0.15)]"
            : "cursor-grabbing opacity-90 scale-105 z-50 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"),
          !isDragging && "cursor-grab",
          executionStatus === "running" && "border-2 border-blue-500",
          executionStatus === "completed" && "border-2 border-green-500",
          executionStatus === "failed" && "border-2 border-red-500",
        )}
        style={{
          left: displayX,
          top: displayY,
          width: dimensions.width,
          minHeight: dimensions.minHeight,
          maxHeight: dimensions.maxHeight,
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Running status - blue pulsing background */}
        {executionStatus === "running" && (
          <>
            <div className="absolute inset-0 animate-pulse rounded-xl bg-blue-500/20" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5" />
            <div
              className="absolute -inset-1 animate-ping rounded-xl bg-blue-500/30 opacity-75"
              style={{ animationDuration: "1.5s" }}
            />
          </>
        )}

        {/* Completed status - green tint background */}
        {executionStatus === "completed" && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5" />
        )}

        {/* Failed status - red tint background */}
        {executionStatus === "failed" && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5" />
        )}

        {/* Running icon - spinning loader */}
        {executionStatus === "running" && (
          <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg z-20 animate-spin">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}

        {/* Completed icon - checkmark */}
        {executionStatus === "completed" && (
          <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white shadow-lg animate-in zoom-in duration-300 z-20">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Failed icon - X mark */}
        {executionStatus === "failed" && (
          <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg animate-in zoom-in duration-300 z-20">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}

        {node.type !== "trigger" && effectiveViewMode !== "collapsed" && isHovered && (
          <div
            className={cn(
              "absolute -left-2 top-7 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-border bg-[#1e1e22] transition-all duration-200 z-10",
              executionStatus === "running" && "border-blue-500 bg-blue-500",
              executionStatus === "completed" && "border-green-500 bg-green-500",
              executionStatus === "failed" && "border-red-500 bg-red-500",
            )}
          />
        )}

        {/* Header */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-3",
          viewMode === "collapsed" && "py-2"
        )}>
          <div className={cn(
            "flex items-center justify-center rounded-lg",
            viewMode === "collapsed" ? "h-8 w-8" : "h-10 w-10",
            isSelected ? "bg-primary/20" : iconBgColors[node.type],
            executionStatus === "running" && "bg-blue-500/20",
            executionStatus === "completed" && "bg-green-500/20",
            executionStatus === "failed" && "bg-red-500/20"
          )}>
            <Icon className={cn(
              effectiveViewMode === "collapsed" ? "h-4 w-4" : "h-5 w-5",
              isSelected ? "text-primary" : iconColors[node.type],
              executionStatus === "running" && "text-blue-400",
              executionStatus === "completed" && "text-green-400",
              executionStatus === "failed" && "text-red-400"
            )} />
          </div>
          <span className="flex-1 text-sm font-medium text-foreground truncate">{node.label}</span>
          {/* Autopilot indicator for collapsed view */}
          {(node.id === "2" || node.id === "3") && effectiveViewMode === "collapsed" && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 mr-1">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
          )}
          {/* Expand/Collapse button - always show for individual node control */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleIndividualExpand?.()
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted/50 transition-colors"
            title={
              effectiveViewMode === "expanded" 
                ? (viewMode === "visual" ? "Collapse to icon" : "Collapse") 
                : "Expand"
            }
          >
            {effectiveViewMode === "expanded" ? (
              viewMode === "visual" ? (
                <Minimize2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Content area - show when effectively expanded */}
        {effectiveViewMode === "expanded" && (
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
                        nodeId={`${node.id}-v8`}
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
                  
                  {/* Autopilot Suggested - for agent nodes (id: 3 is Validate Invoice agent) */}
                  {node.id === "3" && (
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Autopilot Suggested</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          Action 1
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          Action 2
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Empty field boxes for non-agent nodes */}
                  <div className="space-y-2">
                    <div className="h-8 rounded bg-[#1a1a1e]" />
                    <div className="h-8 rounded bg-[#1a1a1e]" />
                  </div>

                  {/* Autopilot Suggested - only on "Extract Invoice Data" (id: 2) and "Validate Invoice" (id: 3) */}
                  {(node.id === "2" || node.id === "3") && (
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Autopilot Suggested</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          Action 1
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          Action 2
                        </Button>
                      </div>
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

        {effectiveViewMode !== "collapsed" && isHovered && (
          node.type === "condition" ? (
            <>
              <div
                className={cn(
                  "absolute -right-2 top-[30%] h-4 w-4 rounded-full border-2 border-primary bg-[#1e1e22] transition-all duration-200 z-10",
                  executionStatus === "running" && "border-blue-500 bg-blue-500",
                  executionStatus === "completed" && "border-green-500 bg-green-500",
                  executionStatus === "failed" && "border-red-500 bg-red-500",
                )}
              >
                <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-primary">T</span>
              </div>
              <div
                className={cn(
                  "absolute -right-2 top-[70%] h-4 w-4 rounded-full border-2 border-red-500/70 bg-[#1e1e22] transition-all duration-200 z-10",
                  executionStatus === "running" && "border-blue-500 bg-blue-500",
                  executionStatus === "completed" && "border-green-500 bg-green-500",
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
                executionStatus === "running" && "border-blue-500 bg-blue-500",
                executionStatus === "completed" && "border-green-500 bg-green-500",
                executionStatus === "failed" && "border-red-500 bg-red-500",
              )}
            />
          )
        )}
      </div>
    </TooltipProvider>
  )
}
