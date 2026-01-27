"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Maximize2, Sparkles, X, Play, Plus, Trash2, Loader2 } from "lucide-react"
import type { WorkflowNode } from "@/lib/workflow-types"
import { cn } from "@/lib/utils"

interface InlineNodePopoverProps {
  node: WorkflowNode
  position: { x: number; y: number }
  canvasTransform: { x: number; y: number; scale: number }
  onExpand: () => void
  onClose: () => void
  onNodeUpdate: (node: WorkflowNode) => void
  onRunNode?: () => void
  onAddNode?: () => void
  onDeleteNode?: () => void
  isRunning?: boolean
}

const nodeColors: Record<string, string> = {
  trigger: "border-chart-2",
  function: "border-chart-3",
  condition: "border-chart-4",
  action: "border-primary",
}

const aiSuggestions: Record<string, string[]> = {
  trigger: ["Add rate limiting", "Validate payload schema", "Add authentication header check"],
  function: ["Add error handling", "Optimize data transformation", "Add logging for debugging"],
  condition: ["Add fallback branch", "Simplify condition logic", "Add null check"],
  action: ["Add retry logic", "Queue for batch processing", "Add timeout handling"],
}

export function InlineNodePopover({
  node,
  position,
  canvasTransform,
  onExpand,
  onClose,
  onNodeUpdate,
  onRunNode,
  onAddNode,
  onDeleteNode,
  isRunning = false,
}: InlineNodePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const suggestions = aiSuggestions[node.type] || []

  const screenX = position.x * canvasTransform.scale + canvasTransform.x + 200 * canvasTransform.scale
  const screenY = position.y * canvasTransform.scale + canvasTransform.y - 20

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if click is outside popover and not on a workflow node
      if (popoverRef.current && !popoverRef.current.contains(target) && !target.closest("[data-workflow-node]")) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={popoverRef}
      className={cn("absolute z-50 w-72 rounded-lg border-2 bg-card shadow-xl", nodeColors[node.type])}
      style={{
        left: screenX,
        top: screenY,
      }}
      onDoubleClick={onExpand}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h4 className="text-sm font-medium text-foreground">{node.label}</h4>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={onExpand}
            title="Expand to full editor"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-3 p-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Name</Label>
          <Input
            value={node.label}
            onChange={(e) => onNodeUpdate({ ...node, label: e.target.value })}
            className="h-8 bg-secondary text-sm"
          />
        </div>

        {node.type === "trigger" && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Endpoint</Label>
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-2 py-1.5 text-xs">
              <span className="rounded bg-chart-2/20 px-1.5 py-0.5 font-mono text-chart-2">{node.data?.method}</span>
              <span className="text-muted-foreground">{node.data?.path}</span>
            </div>
          </div>
        )}

        {node.type === "function" && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Runtime</Label>
            <div className="rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-foreground">
              {node.data?.runtime || "Node.js"}
            </div>
          </div>
        )}

        {node.type === "condition" && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Condition</Label>
            <div className="rounded-md border border-border bg-secondary px-2 py-1.5 font-mono text-xs text-foreground">
              {node.data?.condition}
            </div>
          </div>
        )}

        {node.type === "action" && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Service</Label>
            <div className="rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-foreground">
              {node.data?.service}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-chart-4" />
            <Label className="text-xs text-chart-4">AI Suggestions</Label>
          </div>
          <div className="space-y-1">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                className="w-full rounded-md border border-border bg-secondary/50 px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border p-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 bg-transparent text-xs"
          onClick={onRunNode}
          disabled={isRunning}
        >
          {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Run
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1.5 bg-transparent text-xs" onClick={onAddNode}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 bg-transparent text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDeleteNode}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  )
}
