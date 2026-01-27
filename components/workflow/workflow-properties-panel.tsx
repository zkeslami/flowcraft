"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  X,
  ChevronRight,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  GitBranch,
  Activity,
  Settings,
  History,
  BarChart3,
  GripVertical,
  AlertCircle,
  Box,
  ArrowRight,
  Variable,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react"
import type {
  WorkflowNode,
  Connection,
  WorkflowMetadata,
  WorkflowExecution,
  WorkflowStats,
  Variable as VariableType,
} from "@/lib/workflow-types"
import { cn } from "@/lib/utils"

interface WorkflowPropertiesPanelProps {
  nodes: WorkflowNode[]
  connections: Connection[]
  metadata: WorkflowMetadata
  onMetadataUpdate: (metadata: WorkflowMetadata) => void
  workflowVariables: VariableType[]
  onWorkflowVariablesUpdate: (variables: VariableType[]) => void
  onClose: () => void
  onCollapse: () => void
  width: number
  onWidthChange: (width: number) => void
  onRunWorkflow?: () => void
  isRunning?: boolean
}

const mockExecutions: WorkflowExecution[] = [
  {
    id: "exec-1",
    status: "success",
    startedAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T10:30:02Z",
    duration: 2340,
    triggeredBy: "HTTP Webhook",
    nodesExecuted: 5,
    totalNodes: 5,
  },
  {
    id: "exec-2",
    status: "success",
    startedAt: "2024-01-15T09:15:00Z",
    completedAt: "2024-01-15T09:15:01Z",
    duration: 1890,
    triggeredBy: "HTTP Webhook",
    nodesExecuted: 5,
    totalNodes: 5,
  },
  {
    id: "exec-3",
    status: "failed",
    startedAt: "2024-01-15T08:00:00Z",
    completedAt: "2024-01-15T08:00:03Z",
    duration: 3120,
    triggeredBy: "Scheduled",
    nodesExecuted: 3,
    totalNodes: 5,
    error: "Connection timeout on 'Send Welcome Email' node",
  },
  {
    id: "exec-4",
    status: "success",
    startedAt: "2024-01-14T16:45:00Z",
    completedAt: "2024-01-14T16:45:02Z",
    duration: 2100,
    triggeredBy: "Manual",
    nodesExecuted: 5,
    totalNodes: 5,
  },
]

const mockStats: WorkflowStats = {
  totalExecutions: 142,
  successRate: 94.4,
  avgDuration: 2.1,
  lastExecuted: "2024-01-15T10:30:00Z",
}

function WorkflowVariableRow({
  variable,
  onUpdate,
  onDelete,
}: {
  variable: VariableType
  onUpdate: (field: keyof VariableType, value: string) => void
  onDelete: () => void
}) {
  const [showValue, setShowValue] = useState(false)

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-2">
      <Input
        value={variable.name}
        onChange={(e) => onUpdate("name", e.target.value)}
        className="h-8 flex-1 bg-secondary/50 font-mono text-xs"
        placeholder="VARIABLE_NAME"
      />
      <div className="relative flex-1">
        <Input
          type={showValue ? "text" : "password"}
          value={variable.value}
          onChange={(e) => onUpdate("value", e.target.value)}
          className="h-8 bg-secondary/50 pr-8 text-xs"
          placeholder="value"
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-8 w-8 p-0"
          onClick={() => setShowValue(!showValue)}
        >
          {showValue ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </Button>
      </div>
      <select
        value={variable.type}
        onChange={(e) => onUpdate("type", e.target.value)}
        className="h-8 rounded-md border border-border bg-secondary/50 px-2 text-xs text-foreground"
      >
        <option value="string">String</option>
        <option value="number">Number</option>
        <option value="boolean">Boolean</option>
        <option value="secret">Secret</option>
      </select>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={onDelete}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}

export function WorkflowPropertiesPanel({
  nodes,
  connections,
  metadata,
  onMetadataUpdate,
  workflowVariables,
  onWorkflowVariablesUpdate,
  onClose,
  onCollapse,
  width,
  onWidthChange,
  onRunWorkflow,
  isRunning = false,
}: WorkflowPropertiesPanelProps) {
  const [mainTab, setMainTab] = useState<"properties" | "variables">("properties")
  const [activeTab, setActiveTab] = useState<"overview" | "settings" | "history">("overview")
  const panelRef = useRef<HTMLDivElement>(null)
  const [isResizingWidth, setIsResizingWidth] = useState(false)

  const handleWidthResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingWidth(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingWidth) {
        const windowWidth = window.innerWidth
        const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100
        onWidthChange(Math.min(Math.max(newWidth, 30), 85))
      }
    }

    const handleMouseUp = () => {
      setIsResizingWidth(false)
    }

    if (isResizingWidth) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "ew-resize"
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizingWidth, onWidthChange])

  const handleRunWorkflow = () => {
    if (onRunWorkflow) {
      onRunWorkflow()
    }
  }

  const nodesByType = {
    trigger: nodes.filter((n) => n.type === "trigger").length,
    function: nodes.filter((n) => n.type === "function").length,
    condition: nodes.filter((n) => n.type === "condition").length,
    action: nodes.filter((n) => n.type === "action").length,
  }

  return (
    <div
      ref={panelRef}
      className="relative flex h-full flex-col border-l border-border bg-card"
      style={{ width: `${width}%` }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 z-10 h-full w-1 cursor-ew-resize hover:bg-primary/50 active:bg-primary"
        onMouseDown={handleWidthResizeStart}
      >
        <div className="absolute left-0 top-1/2 flex h-12 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded bg-border opacity-0 hover:opacity-100">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Panel Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/20 text-primary">
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{metadata.name}</h3>
            <p className="text-xs text-muted-foreground">Workflow Overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Properties/Variables Toggle - segmented control style */}
          <div className="flex items-center rounded-md bg-muted p-0.5">
            <button
              onClick={() => setMainTab("properties")}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all",
                mainTab === "properties"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              Properties
            </button>
            <button
              onClick={() => setMainTab("variables")}
              className={cn(
                "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all",
                mainTab === "variables"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Variable className="h-3.5 w-3.5" />
              Variables
              {workflowVariables && workflowVariables.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">
                  {workflowVariables.length}
                </span>
              )}
            </button>
          </div>

          <div className="mx-1 h-6 w-px bg-border" />

          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onCollapse}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {mainTab === "properties" && (
          <>
            {/* Sub Tab Navigation */}
            <div className="flex border-b border-border px-4">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "settings", label: "Settings", icon: Settings },
                { id: "history", label: "History", icon: History },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "overview" | "settings" | "history")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content - Wireframe placeholders */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Execute workflow wireframe */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 w-32 rounded bg-muted/50" />
                        <div className="h-3 w-48 rounded bg-muted/40" />
                      </div>
                      <div className="h-8 w-28 rounded-md bg-muted/50" />
                    </div>
                  </div>

                  {/* Stats Grid wireframe */}
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="rounded-lg border border-border bg-muted/30 p-4">
                        <div className="h-4 w-20 rounded bg-muted/40" />
                        <div className="mt-3 h-7 w-16 rounded bg-muted/50" />
                      </div>
                    ))}
                  </div>

                  {/* Node Breakdown wireframe */}
                  <div>
                    <div className="mb-3 h-4 w-28 rounded bg-muted/50" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-muted/50" />
                            <div className="h-4 w-16 rounded bg-muted/40" />
                          </div>
                          <div className="h-4 w-6 rounded bg-muted/40" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Execution Flow wireframe */}
                  <div>
                    <div className="mb-3 h-4 w-28 rounded bg-muted/50" />
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-14 rounded bg-muted/40" />
                        <div className="h-3 w-3 rounded bg-muted/30" />
                        <div className="h-4 w-14 rounded bg-muted/40" />
                        <div className="h-3 w-3 rounded bg-muted/30" />
                        <div className="h-4 w-14 rounded bg-muted/40" />
                        <div className="h-3 w-3 rounded bg-muted/30" />
                        <div className="h-4 w-10 rounded bg-muted/40" />
                      </div>
                    </div>
                  </div>

                  {/* Connections wireframe */}
                  <div>
                    <div className="mb-3 h-4 w-32 rounded bg-muted/50" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                        >
                          <div className="h-4 w-24 rounded bg-muted/40" />
                          <div className="h-3 w-3 rounded bg-muted/30" />
                          <div className="h-4 w-24 rounded bg-muted/40" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {/* Workflow Name wireframe */}
                    <div>
                      <div className="h-3 w-24 rounded bg-muted/40" />
                      <div className="mt-1.5 h-9 rounded-md bg-muted/50" />
                    </div>
                    {/* Description wireframe */}
                    <div>
                      <div className="h-3 w-20 rounded bg-muted/40" />
                      <div className="mt-1.5 h-24 rounded-md bg-muted/50" />
                    </div>
                    {/* Version/Tags wireframe */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="h-3 w-14 rounded bg-muted/40" />
                        <div className="mt-1.5 h-9 rounded-md bg-muted/50" />
                      </div>
                      <div>
                        <div className="h-3 w-10 rounded bg-muted/40" />
                        <div className="mt-1.5 h-9 rounded-md bg-muted/50" />
                      </div>
                    </div>
                  </div>

                  {/* Metadata wireframe */}
                  <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                    <div className="h-4 w-20 rounded bg-muted/50" />
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-3 w-12 rounded bg-muted/30" />
                          <div className="h-3 w-20 rounded bg-muted/40" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Danger Zone wireframe */}
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="h-4 w-24 rounded bg-muted/50" />
                    <div className="mt-2 h-3 w-full rounded bg-muted/30" />
                    <div className="mt-3 h-8 w-32 rounded-md bg-muted/50" />
                  </div>
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-3">
                  <div className="h-4 w-32 rounded bg-muted/50" />
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-muted/50" />
                          <div className="h-5 w-16 rounded-full bg-muted/40" />
                        </div>
                        <div className="h-3 w-28 rounded bg-muted/30" />
                      </div>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="h-3 w-12 rounded bg-muted/30" />
                        <div className="h-3 w-16 rounded bg-muted/30" />
                        <div className="h-3 w-20 rounded bg-muted/30" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {mainTab === "variables" && (
          <div className="flex-1 overflow-auto p-4">
            {/* Variables header wireframe */}
            <div className="mb-4 flex items-center justify-between">
              <div className="h-4 w-32 rounded bg-muted/50" />
              <div className="h-8 w-28 rounded-md bg-muted/50" />
            </div>
            <div className="mb-4 h-3 w-64 rounded bg-muted/30" />
            {/* Variable rows wireframe */}
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
                  <div className="h-8 flex-1 rounded bg-muted/40" />
                  <div className="h-8 flex-1 rounded bg-muted/40" />
                  <div className="h-8 w-20 rounded bg-muted/40" />
                  <div className="h-8 w-8 rounded bg-muted/40" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
