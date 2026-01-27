"use client"

import type React from "react"

import { Zap, Code, GitBranch, Send, Webhook } from "lucide-react"
import type { WorkflowNode as WorkflowNodeType, NodeExecutionStatus } from "@/lib/workflow-types"
import { cn } from "@/lib/utils"

interface WorkflowNodeProps {
  node: WorkflowNodeType
  isSelected: boolean
  onSelect: () => void
  executionStatus?: NodeExecutionStatus
}

const nodeIcons: Record<string, React.ElementType> = {
  trigger: Webhook,
  function: Code,
  condition: GitBranch,
  action: Send,
}

const nodeColors: Record<string, string> = {
  trigger: "border-chart-2 bg-chart-2/10",
  function: "border-chart-3 bg-chart-3/10",
  condition: "border-chart-4 bg-chart-4/10",
  action: "border-primary bg-primary/10",
}

const iconColors: Record<string, string> = {
  trigger: "text-chart-2",
  function: "text-chart-3",
  condition: "text-chart-4",
  action: "text-primary",
}

export function WorkflowNodeComponent({ node, isSelected, onSelect, executionStatus = "idle" }: WorkflowNodeProps) {
  const Icon = nodeIcons[node.type] || Zap

  return (
    <div
      className={cn(
        "absolute flex cursor-pointer items-center gap-3 rounded-lg border-2 bg-card px-4 py-3 shadow-lg transition-all duration-200",
        nodeColors[node.type],
        isSelected
          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
          : "hover:shadow-xl hover:shadow-primary/5",
        executionStatus === "running" && "ring-2 ring-chart-2 ring-offset-2 ring-offset-background",
        executionStatus === "completed" && "ring-2 ring-green-500 ring-offset-2 ring-offset-background",
        executionStatus === "failed" && "ring-2 ring-red-500 ring-offset-2 ring-offset-background",
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
        minWidth: 180,
      }}
      onClick={onSelect}
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
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-lg animate-in zoom-in duration-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {executionStatus === "failed" && (
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg animate-in zoom-in duration-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}

      {/* Input port */}
      {node.type !== "trigger" && (
        <div
          className={cn(
            "absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-border bg-card transition-colors duration-300",
            executionStatus === "running" && "border-chart-2 bg-chart-2",
            executionStatus === "completed" && "border-green-500 bg-green-500",
          )}
        />
      )}

      <div
        className={cn(
          "relative z-10 flex h-8 w-8 items-center justify-center rounded-md",
          nodeColors[node.type],
          executionStatus === "running" && "animate-spin",
        )}
        style={{ animationDuration: executionStatus === "running" ? "2s" : undefined }}
      >
        <Icon className={cn("h-4 w-4", iconColors[node.type])} />
      </div>

      <div className="relative z-10 flex flex-col">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{node.type}</span>
        <span className="text-sm font-medium text-foreground">{node.label}</span>
      </div>

      {/* Output ports */}
      {node.type === "condition" ? (
        <>
          <div
            className={cn(
              "absolute -right-2 top-[30%] h-4 w-4 -translate-y-1/2 rounded-full border-2 border-primary bg-card transition-colors duration-300",
              executionStatus === "completed" && "border-green-500 bg-green-500",
            )}
          >
            <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-primary">T</span>
          </div>
          <div
            className={cn(
              "absolute -right-2 top-[70%] h-4 w-4 -translate-y-1/2 rounded-full border-2 border-chart-5 bg-card transition-colors duration-300",
              executionStatus === "completed" && "border-green-500 bg-green-500",
            )}
          >
            <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-chart-5">F</span>
          </div>
        </>
      ) : (
        <div
          className={cn(
            "absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-primary bg-primary transition-colors duration-300",
            executionStatus === "completed" && "border-green-500 bg-green-500",
          )}
        />
      )}
    </div>
  )
}

export { WorkflowNodeComponent as WorkflowNode }
