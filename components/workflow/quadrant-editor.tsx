"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
  X,
  Code,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  GripVertical,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Settings,
  Variable,
  Plus,
  Trash2,
  SlidersHorizontal,
  AlertTriangle,
  Zap,
  GitBranch,
  Send,
  Bot,
} from "lucide-react"
import type { WorkflowNode, Connection, NodeExecutionStatus, Variable as VariableType } from "@/lib/workflow-types"
import { cn } from "@/lib/utils"
import { CodeEditor } from "./code-editor"
import { WorkflowNode as WorkflowNodeComponent } from "./workflow-node"
import { AgentPromptEditor } from "@/components/prompt-editor/AgentPromptEditor"

type ModuleType = "code" | "graph" | "input" | "output"
type TopLevelTab = "properties" | "variables"
type CodeModuleTab = "parameters" | "script" | "errorHandling"

type CanvasViewMode = "collapsed" | "expanded" | "visual"

interface QuadrantEditorProps {
  node: WorkflowNode
  nodes: WorkflowNode[]
  connections: Connection[]
  onClose: () => void
  onCollapse: () => void
  onNodeUpdate: (node: WorkflowNode) => void
  onNodeSelect: (node: WorkflowNode | null) => void
  onRunNode?: () => void
  isRunning?: boolean
  nodeExecutionStatus?: NodeExecutionStatus
  nodeExecutionStatuses: Record<string, NodeExecutionStatus>
  canvasViewMode?: CanvasViewMode
}

export function QuadrantEditor({
  node,
  nodes,
  connections,
  onClose,
  onCollapse,
  onNodeUpdate,
  onNodeSelect,
  onRunNode,
  isRunning = false,
  nodeExecutionStatus,
  nodeExecutionStatuses = {},
  canvasViewMode = "expanded",
}: QuadrantEditorProps) {
  const [lastRunTime, setLastRunTime] = useState<string | null>(null)

  const [topLevelTab, setTopLevelTab] = useState<TopLevelTab>("properties")

  const [columns, setColumns] = useState<ModuleType[][]>([
    ["code", "graph"],
    ["input", "output"],
  ])
  const [columnWidths, setColumnWidths] = useState<number[]>([50, 50])
  const [moduleHeights, setModuleHeights] = useState<Record<string, number[]>>({
    "0": [50, 50],
    "1": [50, 50],
  })

  const [draggingModule, setDraggingModule] = useState<{ colIndex: number; modIndex: number; type: ModuleType } | null>(
    null,
  )
  const [dropTarget, setDropTarget] = useState<{ colIndex: number; modIndex: number } | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [resizingColumn, setResizingColumn] = useState<number | null>(null)
  const [resizingModule, setResizingModule] = useState<{ colIndex: number; modIndex: number } | null>(null)

  const [codeTab, setCodeTab] = useState<CodeModuleTab>("script")

  useEffect(() => {
    if (nodeExecutionStatus === "completed" || nodeExecutionStatus === "failed") {
      setLastRunTime(new Date().toLocaleTimeString())
    }
  }, [nodeExecutionStatus])

  const handleColumnResizeStart = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.preventDefault()
    setResizingColumn(colIndex)
  }, [])

  const handleModuleResizeStart = useCallback((e: React.MouseEvent, colIndex: number, modIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingModule({ colIndex, modIndex })
  }, [])

  const handleModuleDragStart = useCallback(
    (e: React.MouseEvent, colIndex: number, modIndex: number, type: ModuleType) => {
      e.preventDefault()
      e.stopPropagation()
      setDraggingModule({ colIndex, modIndex, type })
      setDragPosition({ x: e.clientX, y: e.clientY })
    },
    [],
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Handle column resizing
      if (resizingColumn !== null && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const relativeX = e.clientX - rect.left
        const totalWidth = rect.width

        let cumulativeWidth = 0
        for (let i = 0; i < resizingColumn; i++) {
          cumulativeWidth += (columnWidths[i] / 100) * totalWidth
        }

        const newWidth = ((relativeX - cumulativeWidth) / totalWidth) * 100
        const nextColWidth = columnWidths[resizingColumn] + columnWidths[resizingColumn + 1] - newWidth

        if (newWidth >= 20 && nextColWidth >= 20) {
          const newWidths = [...columnWidths]
          newWidths[resizingColumn] = newWidth
          newWidths[resizingColumn + 1] = nextColWidth
          setColumnWidths(newWidths)
        }
      }

      // Handle module height resizing
      if (resizingModule && containerRef.current) {
        const { colIndex, modIndex } = resizingModule
        const colElement = containerRef.current.querySelector(`[data-col="${colIndex}"]`)
        if (colElement) {
          const rect = colElement.getBoundingClientRect()
          const relativeY = e.clientY - rect.top
          const totalHeight = rect.height

          const currentHeights = moduleHeights[colIndex] || []
          let cumulativeHeight = 0
          for (let i = 0; i < modIndex; i++) {
            cumulativeHeight += (currentHeights[i] / 100) * totalHeight
          }

          const newHeight = ((relativeY - cumulativeHeight) / totalHeight) * 100
          const nextHeight = currentHeights[modIndex] + currentHeights[modIndex + 1] - newHeight

          if (newHeight >= 15 && nextHeight >= 15) {
            const newHeights = [...currentHeights]
            newHeights[modIndex] = newHeight
            newHeights[modIndex + 1] = nextHeight
            setModuleHeights({ ...moduleHeights, [colIndex]: newHeights })
          }
        }
      }

      if (draggingModule && containerRef.current) {
        setDragPosition({ x: e.clientX, y: e.clientY })

        // Find which module cell we're over
        const elements = document.elementsFromPoint(e.clientX, e.clientY)
        const moduleCell = elements.find((el) => el.hasAttribute("data-module-cell"))

        if (moduleCell) {
          const colIndex = Number.parseInt(moduleCell.getAttribute("data-col-index") || "0")
          const modIndex = Number.parseInt(moduleCell.getAttribute("data-mod-index") || "0")

          // Only set drop target if it's different from source
          if (colIndex !== draggingModule.colIndex || modIndex !== draggingModule.modIndex) {
            setDropTarget({ colIndex, modIndex })
          } else {
            setDropTarget(null)
          }
        } else {
          setDropTarget(null)
        }
      }
    }

    const handleMouseUp = () => {
      if (draggingModule && dropTarget) {
        const { colIndex: sourceColIndex, modIndex: sourceModIndex, type: sourceModule } = draggingModule
        const { colIndex: targetColIndex, modIndex: targetModIndex } = dropTarget

        // Validate the move
        const canMove =
          sourceColIndex === targetColIndex || // Same column reorder always allowed
          (columns[sourceColIndex].length > 1 && columns[targetColIndex].length < 3) // Cross-column move

        if (canMove) {
          const newColumns = columns.map((col) => [...col])

          if (sourceColIndex === targetColIndex) {
            // Reorder within same column
            newColumns[sourceColIndex].splice(sourceModIndex, 1)
            const adjustedIndex = targetModIndex > sourceModIndex ? targetModIndex : targetModIndex
            newColumns[sourceColIndex].splice(adjustedIndex, 0, sourceModule)
          } else {
            // Move between columns
            newColumns[sourceColIndex].splice(sourceModIndex, 1)
            newColumns[targetColIndex].splice(targetModIndex, 0, sourceModule)

            // Update heights for affected columns
            const newModuleHeights = { ...moduleHeights }
            const sourceColModules = newColumns[sourceColIndex].length
            const targetColModules = newColumns[targetColIndex].length

            newModuleHeights[sourceColIndex] = Array(sourceColModules).fill(100 / sourceColModules)
            newModuleHeights[targetColIndex] = Array(targetColModules).fill(100 / targetColModules)

            setModuleHeights(newModuleHeights)
          }

          setColumns(newColumns)
        }
      }

      setResizingColumn(null)
      setResizingModule(null)
      setDraggingModule(null)
      setDropTarget(null)
      setDragPosition(null)
    }

    if (resizingColumn !== null || resizingModule !== null || draggingModule !== null) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = "none"

      if (resizingColumn !== null) {
        document.body.style.cursor = "ew-resize"
      } else if (resizingModule !== null) {
        document.body.style.cursor = "ns-resize"
      } else if (draggingModule !== null) {
        document.body.style.cursor = "grabbing"
      }
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [resizingColumn, resizingModule, columnWidths, moduleHeights, draggingModule, dropTarget, columns])

  const handleRun = () => {
    if (onRunNode) {
      onRunNode()
    }
  }

  const handleAddVariable = () => {
    const newVariable: VariableType = {
      id: `var-${Date.now()}`,
      name: "new_variable",
      value: "",
      type: "string",
    }
    const currentVariables = node.variables || []
    onNodeUpdate({
      ...node,
      variables: [...currentVariables, newVariable],
    })
  }

  const handleUpdateVariable = (varId: string, field: keyof VariableType, value: string) => {
    const currentVariables = node.variables || []
    onNodeUpdate({
      ...node,
      variables: currentVariables.map((v) => (v.id === varId ? { ...v, [field]: value } : v)),
    })
  }

  const handleDeleteVariable = (varId: string) => {
    const currentVariables = node.variables || []
    onNodeUpdate({
      ...node,
      variables: currentVariables.filter((v) => v.id !== varId),
    })
  }

  const isNodeRunning = isRunning || nodeExecutionStatus === "running"

  const renderModuleContent = (type: ModuleType) => {
    switch (type) {
      case "code":
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center border-b border-border bg-secondary/20 shrink-0">
              <button
                onClick={() => setCodeTab("parameters")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-b-2",
                  codeTab === "parameters"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <SlidersHorizontal className="h-3 w-3" />
                Parameters
              </button>
              <button
                onClick={() => setCodeTab("script")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-b-2",
                  codeTab === "script"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Code className="h-3 w-3" />
                Script
              </button>
              <button
                onClick={() => setCodeTab("errorHandling")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-b-2",
                  codeTab === "errorHandling"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <AlertTriangle className="h-3 w-3" />
                Errors
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {codeTab === "parameters" && (
                <div className="h-full overflow-auto p-3 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Node Name</Label>
                    <Input
                      value={node.label}
                      onChange={(e) => onNodeUpdate({ ...node, label: e.target.value })}
                      className="mt-1 h-7 bg-secondary/50 text-sm"
                    />
                  </div>
                  
                  {/* Agent-specific parameters */}
                  {node.type === "agent" ? (
                    <>
                      <div>
                        <Label className="text-xs text-muted-foreground">System Prompt</Label>
                        <div className="mt-1">
                          <AgentPromptEditor
                            value={node.data?.systemPrompt || ""}
                            onChange={(value) => onNodeUpdate({ ...node, data: { ...node.data, systemPrompt: value } })}
                            nodeId={`${node.id}-system`}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">User Prompt</Label>
                        <div className="mt-1">
                          <AgentPromptEditor
                            value={node.data?.userPrompt || ""}
                            onChange={(value) => onNodeUpdate({ ...node, data: { ...node.data, userPrompt: value } })}
                            nodeId={node.id}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">LLM Model</Label>
                        <Input
                          value={node.data?.currentLLM || "GPT-4o"}
                          onChange={(e) => onNodeUpdate({ ...node, data: { ...node.data, currentLLM: e.target.value } })}
                          className="mt-1 h-7 bg-secondary/50 text-sm"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Temperature</Label>
                          <span className="text-xs text-foreground">{node.data?.temperature ?? 0.7}</span>
                        </div>
                        <Slider
                          value={[node.data?.temperature ?? 0.7]}
                          onValueChange={(value) => onNodeUpdate({ ...node, data: { ...node.data, temperature: value[0] } })}
                          min={0}
                          max={2}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Max Tokens</Label>
                          <span className="text-xs text-foreground">{node.data?.maxTokens ?? 2048}</span>
                        </div>
                        <Slider
                          value={[node.data?.maxTokens ?? 2048]}
                          onValueChange={(value) => onNodeUpdate({ ...node, data: { ...node.data, maxTokens: value[0] } })}
                          min={256}
                          max={8192}
                          step={256}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Context Files</Label>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(node.data?.context || ["Invoice Schema", "Vendor Database", "Payment Terms"]).map((ctx: string, i: number) => (
                            <span key={i} className="px-2 py-1 text-xs rounded bg-secondary text-muted-foreground">
                              {ctx}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Tools</Label>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(node.data?.tools || ["OCR Extract", "Amount Validator", "Date Parser", "Vendor Lookup"]).map((tool: string, i: number) => (
                            <span key={i} className="px-2 py-1 text-xs rounded bg-primary/10 text-primary border border-primary/20">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-xs text-muted-foreground">Runtime</Label>
                        <select
                          value={node.data?.runtime || "javascript"}
                          onChange={(e) => onNodeUpdate({ ...node, data: { ...node.data, runtime: e.target.value } })}
                          className="mt-1 h-7 w-full rounded-md border border-border bg-secondary/50 px-2 text-xs"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="typescript">TypeScript</option>
                          <option value="python">Python</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Timeout (ms)</Label>
                        <Input
                          type="number"
                          value={node.data?.timeout || 30000}
                          onChange={(e) =>
                            onNodeUpdate({ ...node, data: { ...node.data, timeout: Number.parseInt(e.target.value) } })
                          }
                          className="mt-1 h-7 bg-secondary/50 text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
              {codeTab === "script" && (
                <CodeEditor
                  value={node.data?.code || "// Write your code here"}
                  language="javascript"
                  onChange={(value) =>
                    onNodeUpdate({
                      ...node,
                      data: { ...node.data, code: value },
                    })
                  }
                />
              )}
              {codeTab === "errorHandling" && (
                <div className="h-full overflow-auto p-3 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">On Error</Label>
                    <select
                      value={node.data?.onError || "stop"}
                      onChange={(e) => onNodeUpdate({ ...node, data: { ...node.data, onError: e.target.value } })}
                      className="mt-1 h-7 w-full rounded-md border border-border bg-secondary/50 px-2 text-xs"
                    >
                      <option value="stop">Stop Workflow</option>
                      <option value="continue">Continue</option>
                      <option value="retry">Retry</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Max Retries</Label>
                    <Input
                      type="number"
                      value={node.data?.maxRetries || 3}
                      onChange={(e) =>
                        onNodeUpdate({ ...node, data: { ...node.data, maxRetries: Number.parseInt(e.target.value) } })
                      }
                      className="mt-1 h-7 bg-secondary/50 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      case "graph":
        return (
          <MiniGraph
            key={`graph-${node.id}`}
            nodes={nodes}
            connections={connections}
            selectedNode={node}
            onNodeSelect={onNodeSelect}
            nodeExecutionStatuses={nodeExecutionStatuses}
            viewMode={canvasViewMode}
          />
        )
      case "input":
        return (
          <CodeEditor
            value={node.data?.input || "{}"}
            language="json"
            onChange={(value) =>
              onNodeUpdate({
                ...node,
                data: { ...node.data, input: value },
              })
            }
          />
        )
      case "output":
        return <CodeEditor value={node.data?.output || "{}"} language="json" readOnly />
    }
  }

  const getModuleHeader = (type: ModuleType) => {
    switch (type) {
      case "code":
        return {
          icon: <Code className="h-3.5 w-3.5 text-muted-foreground" />,
          label: "Code",
          badge: null,
        }
      case "graph":
        return {
          icon: <div className="h-2 w-2 rounded-full bg-primary" />,
          label: "Graph",
          badge: null,
        }
      case "input":
        return {
          icon: <div className="h-2 w-2 rounded-full bg-chart-4" />,
          label: "Input",
          badge: (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
              JSON
            </span>
          ),
        }
      case "output":
        return {
          icon: <div className="h-2 w-2 rounded-full bg-chart-2" />,
          label: "Output",
          badge: (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
              Read-only
            </span>
          ),
        }
    }
  }

  const ModuleCell = ({
    type,
    colIndex,
    modIndex,
    isLast,
    heightPercent,
  }: {
    type: ModuleType
    colIndex: number
    modIndex: number
    isLast: boolean
    heightPercent: number
  }) => {
    const header = getModuleHeader(type)
    const isDragOver = dropTarget?.colIndex === colIndex && dropTarget?.modIndex === modIndex
    const isDragging = draggingModule?.colIndex === colIndex && draggingModule?.modIndex === modIndex

    return (
      <>
        <div
          data-module-cell
          data-col-index={colIndex}
          data-mod-index={modIndex}
          className={cn(
            "flex flex-col overflow-hidden transition-all border border-transparent rounded-lg",
            isDragOver && "border-primary bg-primary/10",
            isDragging && "opacity-40",
          )}
          style={{ height: `${heightPercent}%` }}
        >
          <div
            className="flex items-center justify-between border-b border-border bg-secondary/30 px-3 py-2 cursor-grab active:cursor-grabbing select-none rounded-t-lg"
            onMouseDown={(e) => handleModuleDragStart(e, colIndex, modIndex, type)}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="h-3 w-3 text-muted-foreground" />
              {header.icon}
              <Label className="text-xs font-medium text-foreground">{header.label}</Label>
            </div>
            {header.badge}
          </div>
          <div className="flex-1 overflow-hidden">{renderModuleContent(type)}</div>
        </div>
        {!isLast && (
          <div
            className="relative z-10 flex h-1 cursor-ns-resize items-center justify-center hover:bg-primary/50 active:bg-primary"
            onMouseDown={(e) => handleModuleResizeStart(e, colIndex, modIndex)}
          >
            <div className="absolute flex h-4 w-12 items-center justify-center rounded bg-border opacity-0 hover:opacity-100">
              <GripVertical className="h-4 w-4 rotate-90 text-muted-foreground" />
            </div>
          </div>
        )}
      </>
    )
  }

  const renderVariablesTab = () => {
    const variables = node.variables || []
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-foreground">Node Variables</h4>
            <p className="text-xs text-muted-foreground">Variables specific to this node</p>
          </div>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-transparent" onClick={handleAddVariable}>
            <Plus className="h-3.5 w-3.5" />
            Add Variable
          </Button>
        </div>

        {variables.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20 py-12 text-center">
            <Variable className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No variables defined</p>
            <p className="text-xs text-muted-foreground">Click "Add Variable" to create one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {variables.map((variable) => (
              <div key={variable.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={variable.name}
                        onChange={(e) => handleUpdateVariable(variable.id, "name", e.target.value)}
                        placeholder="Variable name"
                        className="h-8 bg-secondary/50 text-sm"
                      />
                      <select
                        value={variable.type}
                        onChange={(e) => handleUpdateVariable(variable.id, "type", e.target.value)}
                        className="h-8 rounded-md border border-border bg-secondary/50 px-2 text-sm"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="json">JSON</option>
                      </select>
                    </div>
                    <Input
                      value={variable.value}
                      onChange={(e) => handleUpdateVariable(variable.id, "value", e.target.value)}
                      placeholder="Value"
                      className="h-8 bg-secondary/50 text-sm"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteVariable(variable.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          {/* Collapse to docked mode - left of node title icon */}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onCollapse} title="Collapse to docked view">
            <Minimize2 className="h-4 w-4" />
          </Button>
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md",
              "bg-[#1a1a1e]",
            )}
          >
            {node.type === "trigger" && <Zap className="h-4 w-4 text-foreground" />}
            {node.type === "function" && <Code className="h-4 w-4 text-foreground" />}
            {node.type === "condition" && <GitBranch className="h-4 w-4 text-foreground" />}
            {node.type === "action" && <Send className="h-4 w-4 text-foreground" />}
            {node.type === "agent" && <Bot className="h-4 w-4 text-foreground" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{node.label}</h3>
            <p className="text-xs text-muted-foreground capitalize">{node.type} Node</p>
          </div>
          {nodeExecutionStatus === "completed" && (
            <div className="flex items-center gap-1.5 text-xs text-green-500">
              <CheckCircle className="h-3 w-3" />
              Completed
            </div>
          )}
          {nodeExecutionStatus === "failed" && (
            <div className="flex items-center gap-1.5 text-xs text-red-500">
              <XCircle className="h-3 w-3" />
              Failed
            </div>
          )}
          {lastRunTime && !nodeExecutionStatus && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-chart-2" />
              Last run: {lastRunTime}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 items-center rounded-md border border-border bg-secondary/50 p-0.5">
            <button
              onClick={() => setTopLevelTab("properties")}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded px-3 text-xs font-medium transition-colors",
                topLevelTab === "properties"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              Properties
            </button>
            <button
              onClick={() => setTopLevelTab("variables")}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded px-3 text-xs font-medium transition-colors",
                topLevelTab === "variables"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Variable className="h-3.5 w-3.5" />
              Variables
            </button>
          </div>
          <Button
            size="sm"
            className="h-8 gap-2 bg-chart-2 text-chart-2-foreground hover:bg-chart-2/90"
            onClick={handleRun}
            disabled={isNodeRunning}
          >
            {isNodeRunning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Run Node
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose} title="Close panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content area */}
      {topLevelTab === "properties" ? (
        <div className="flex min-h-0 flex-1 gap-1 overflow-hidden p-2">
          {columns.map((column, colIndex) => {
            const widthPercent = columnWidths[colIndex] || 100 / columns.length
            const heights = moduleHeights[colIndex.toString()] || column.map(() => 100 / column.length)

            return (
              <div key={colIndex} className="flex" style={{ width: `${widthPercent}%` }}>
                <div data-col={colIndex} className="flex min-h-0 flex-1 flex-col gap-1">
                  {column.map((moduleType, modIndex) => {
                    return (
                      <ModuleCell
                        key={`${moduleType}-${colIndex}-${modIndex}`}
                        type={moduleType}
                        colIndex={colIndex}
                        modIndex={modIndex}
                        isLast={modIndex === column.length - 1}
                        heightPercent={heights[modIndex] || 100 / column.length}
                      />
                    )
                  })}
                </div>
                {colIndex < columns.length - 1 && (
                  <div
                    className="relative z-10 flex w-1 cursor-ew-resize items-center justify-center border-x border-border hover:bg-primary/50 active:bg-primary"
                    onMouseDown={(e) => handleColumnResizeStart(e, colIndex)}
                  >
                    <div className="absolute flex h-12 w-4 items-center justify-center rounded bg-border opacity-0 hover:opacity-100">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">{renderVariablesTab()}</div>
      )}

      {draggingModule && dragPosition && (
        <div
          className="fixed z-50 pointer-events-none bg-card border border-primary rounded-md px-3 py-2 shadow-lg flex items-center gap-2"
          style={{
            left: dragPosition.x + 10,
            top: dragPosition.y + 10,
          }}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
          {getModuleHeader(draggingModule.type).icon}
          <span className="text-xs font-medium">{getModuleHeader(draggingModule.type).label}</span>
        </div>
      )}
    </div>
  )
}

function MiniGraph({
  nodes,
  connections,
  selectedNode,
  onNodeSelect,
  nodeExecutionStatuses,
  viewMode = "expanded",
}: {
  nodes: WorkflowNode[]
  connections: Connection[]
  selectedNode: WorkflowNode
  onNodeSelect: (node: WorkflowNode | null) => void
  nodeExecutionStatuses: Record<string, NodeExecutionStatus>
  viewMode?: CanvasViewMode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const hasInitializedRef = useRef(false)
  const hasDraggedRef = useRef(false)
  const mouseStartRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
        }
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0 && nodes.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true

      // Get node dimensions based on view mode
      const nodeWidth = viewMode === "visual" ? 80 : 180
      const nodeHeight = viewMode === "visual" ? 70 : viewMode === "collapsed" ? 36 : 60

      const minX = Math.min(...nodes.map((n) => n.position.x))
      const maxX = Math.max(...nodes.map((n) => n.position.x + nodeWidth))
      const minY = Math.min(...nodes.map((n) => n.position.y))
      const maxY = Math.max(...nodes.map((n) => n.position.y + nodeHeight))

      const graphWidth = maxX - minX
      const graphHeight = maxY - minY
      const graphCenterX = minX + graphWidth / 2
      const graphCenterY = minY + graphHeight / 2

      const padding = 40
      const scaleX = (dimensions.width - padding * 2) / graphWidth
      const scaleY = (dimensions.height - padding * 2) / graphHeight
      const fitScale = Math.min(scaleX, scaleY, 1)

      setTransform({
        x: dimensions.width / 2 - graphCenterX * fitScale,
        y: dimensions.height / 2 - graphCenterY * fitScale,
        scale: fitScale,
      })
    }
  }, [dimensions, nodes, viewMode])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.min(Math.max(transform.scale * delta, 0.2), 4)

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const scaleRatio = newScale / transform.scale
        const newX = mouseX - (mouseX - transform.x) * scaleRatio
        const newY = mouseY - (mouseY - transform.y) * scaleRatio

        setTransform({ x: newX, y: newY, scale: newScale })
      }
    },
    [transform],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      setIsPanning(true)
      hasDraggedRef.current = false
      mouseStartRef.current = { x: e.clientX, y: e.clientY }
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
    },
    [transform],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        const dx = Math.abs(e.clientX - mouseStartRef.current.x)
        const dy = Math.abs(e.clientY - mouseStartRef.current.y)
        if (dx > 3 || dy > 3) {
          hasDraggedRef.current = true
        }
        setTransform((prev) => ({
          ...prev,
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        }))
      }
    },
    [isPanning, panStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleNodeClick = useCallback(
    (node: WorkflowNode, e: React.MouseEvent) => {
      e.stopPropagation()
      if (!hasDraggedRef.current) {
        onNodeSelect(node)
      }
    },
    [onNodeSelect],
  )

  const handleZoomIn = () => {
    const newScale = Math.min(transform.scale * 1.2, 4)
    const scaleRatio = newScale / transform.scale
    setTransform({
      x: dimensions.width / 2 - (dimensions.width / 2 - transform.x) * scaleRatio,
      y: dimensions.height / 2 - (dimensions.height / 2 - transform.y) * scaleRatio,
      scale: newScale,
    })
  }

  const handleZoomOut = () => {
    const newScale = Math.max(transform.scale / 1.2, 0.2)
    const scaleRatio = newScale / transform.scale
    setTransform({
      x: dimensions.width / 2 - (dimensions.width / 2 - transform.x) * scaleRatio,
      y: dimensions.height / 2 - (dimensions.height / 2 - transform.y) * scaleRatio,
      scale: newScale,
    })
  }

  const handleFitView = () => {
    if (selectedNode && dimensions.width > 0) {
      setTransform({
        x: dimensions.width / 2 - (selectedNode.position.x + 90) * transform.scale,
        y: dimensions.height / 2 - (selectedNode.position.y + 30) * transform.scale,
        scale: transform.scale,
      })
    }
  }

  // Get node dimensions based on view mode
  const getNodeDimensions = () => {
    if (viewMode === "visual") return { width: 80, height: 70 } // visual container
    if (viewMode === "collapsed") return { width: 180, height: 36 } // collapsed bar
    return { width: 180, height: 60 } // expanded
  }
  
  const nodeDims = getNodeDimensions()

  const getNodeCenter = (node: WorkflowNode) => {
    if (viewMode === "visual") {
      return { x: node.position.x + 40, y: node.position.y + 24 } // center of visual icon
    }
    return { x: node.position.x + nodeDims.width / 2, y: node.position.y + nodeDims.height / 2 }
  }

  const getPortPosition = (node: WorkflowNode, port: string): { x: number; y: number } => {
    const { width, height } = nodeDims
    const center = getNodeCenter(node)

    if (viewMode === "visual") {
      // For visual mode, ports are on the sides of the icon
      if (port === "input") return { x: node.position.x + 16, y: node.position.y + 24 }
      if (port === "output" || port === "true" || port === "false") return { x: node.position.x + 64, y: node.position.y + 24 }
      return center
    }

    if (port === "input") return { x: node.position.x, y: center.y }
    if (port === "output") return { x: node.position.x + width, y: center.y }
    if (port === "true") return { x: node.position.x + width, y: node.position.y + height * 0.3 }
    if (port === "false") return { x: node.position.x + width, y: node.position.y + height * 0.7 }
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

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-background"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
    >
      {/* Grid pattern matching main canvas */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, oklch(0.28 0.01 260) 1px, transparent 1px)`,
          backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
          backgroundPosition: `${transform.x}px ${transform.y}px`,
        }}
      />

      {dimensions.width > 0 && (
        <>
          {/* Connections SVG */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: "0 0",
            }}
          >
            {connections.map(renderConnection)}
          </svg>

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: "0 0",
            }}
          >
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id
              const status = nodeExecutionStatuses[node.id]
              
              // Get icon based on node type
              const getIcon = () => {
                switch (node.type) {
                  case "trigger": return Zap
                  case "function": return Code
                  case "condition": return GitBranch
                  case "action": return Send
                  case "agent": return Bot
                  default: return Code
                }
              }
              const Icon = getIcon()
              
              // Squircle view - small rounded square with icon
              if (viewMode === "visual") {
                return (
                  <div
                    key={node.id}
                    className="pointer-events-auto absolute"
                    style={{ left: node.position.x, top: node.position.y }}
                    onClick={(e) => handleNodeClick(node, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-center" style={{ width: 80 }}>
                      <div
                        className={cn(
                          "flex items-center justify-center rounded-[16px] bg-[#1e1e22] transition-all",
                          "border shadow-[0_4px_12px_rgba(0,0,0,0.4)]",
                          isSelected ? "border-2 border-primary ring-2 ring-primary/30" : "border-border",
                          status === "running" && "border-primary animate-pulse",
                          status === "completed" && "border-green-500",
                          status === "failed" && "border-red-500"
                        )}
                        style={{ width: 48, height: 48 }}
                      >
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <span className="mt-1.5 text-[10px] font-medium text-foreground text-center truncate max-w-[80px]">
                        {node.label}
                      </span>
                    </div>
                  </div>
                )
              }
              
              // Collapsed view - narrow horizontal bar
              if (viewMode === "collapsed") {
                return (
                  <div
                    key={node.id}
                    className="pointer-events-auto absolute"
                    style={{ left: node.position.x, top: node.position.y }}
                    onClick={(e) => handleNodeClick(node, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-lg bg-[#1e1e22] px-3 py-2 transition-all",
                        "border shadow-[0_4px_12px_rgba(0,0,0,0.4)]",
                        isSelected ? "border-2 border-primary ring-2 ring-primary/30" : "border-border",
                        status === "running" && "border-primary animate-pulse",
                        status === "completed" && "border-green-500",
                        status === "failed" && "border-red-500"
                      )}
                      style={{ width: 180 }}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate">{node.label}</span>
                    </div>
                  </div>
                )
              }
              
              // Expanded view - use the original WorkflowNodeComponent
              return (
                <div
                  key={node.id}
                  className="pointer-events-auto"
                  onClick={(e) => handleNodeClick(node, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <WorkflowNodeComponent
                    node={node}
                    isSelected={isSelected}
                    onSelect={() => {}}
                    executionStatus={status}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md border border-border bg-card p-1">
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleZoomOut}>
          <ZoomOut className="h-3 w-3" />
        </Button>
        <span className="w-10 text-center text-[10px] text-muted-foreground">{Math.round(transform.scale * 100)}%</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleZoomIn}>
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleFitView}>
          <Maximize className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
