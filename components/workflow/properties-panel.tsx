"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  X,
  ChevronRight,
  Code,
  Play,
  Loader2,
  CheckCircle,
  Rows3,
  Columns3,
  GripVertical,
  Settings,
  Variable,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  XCircle,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react"
import type { WorkflowNode, Variable as VariableType, NodeExecutionStatus } from "@/lib/workflow-types"
import { cn } from "@/lib/utils"
import { CodeEditor } from "./code-editor"

type ModuleType = "code" | "input" | "output"

interface PropertiesPanelProps {
  node: WorkflowNode
  onClose: () => void
  onCollapse: () => void
  onNodeUpdate: (node: WorkflowNode) => void
  width: number
  onWidthChange: (width: number) => void
  onRunNode?: () => void
  isRunning?: boolean
  nodeExecutionStatus?: NodeExecutionStatus
}

export function PropertiesPanel({
  node,
  onClose,
  onCollapse,
  onNodeUpdate,
  width,
  onWidthChange,
  onRunNode,
  isRunning = false,
  nodeExecutionStatus,
}: PropertiesPanelProps) {
  const [lastRunTime, setLastRunTime] = useState<string | null>(null)
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal")
  const [activeTab, setActiveTab] = useState<"properties" | "variables">("properties")

  const [horizontalModules, setHorizontalModules] = useState<{ left: ModuleType[]; right: ModuleType[] }>({
    left: ["code"],
    right: ["input", "output"],
  })
  const [verticalModules, setVerticalModules] = useState<{ top: ModuleType[]; bottom: ModuleType[] }>({
    top: ["code"],
    bottom: ["input", "output"],
  })
  const [moduleHeights, setModuleHeights] = useState<Record<string, number>>({
    code: 100,
    input: 50,
    output: 50,
  })
  const [moduleWidths, setModuleWidths] = useState<Record<string, number>>({
    code: 60,
    input: 50,
    output: 50,
  })

  const [draggingModule, setDraggingModule] = useState<ModuleType | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ zone: string; index: number } | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const [isResizingWidth, setIsResizingWidth] = useState(false)
  const [isResizingVertical, setIsResizingVertical] = useState(false)
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false)
  const [isResizingInputOutput, setIsResizingInputOutput] = useState(false)
  const [codePaneWidth, setCodePaneWidth] = useState(60)
  const [codePaneHeight, setCodePaneHeight] = useState(60)
  const [inputOutputSplit, setInputOutputSplit] = useState(50)

  useEffect(() => {
    if (nodeExecutionStatus === "completed" || nodeExecutionStatus === "failed") {
      setLastRunTime(new Date().toLocaleTimeString())
    }
  }, [nodeExecutionStatus])

  const handleWidthResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingWidth(true)
  }, [])

  const handleVerticalResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingVertical(true)
  }, [])

  const handleHorizontalResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingHorizontal(true)
  }, [])

  const handleInputOutputResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingInputOutput(true)
  }, [])

  const handleModuleDragStart = useCallback((e: React.MouseEvent, moduleType: ModuleType) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingModule(moduleType)
    setDragPosition({ x: e.clientX, y: e.clientY })
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingWidth) {
        const windowWidth = window.innerWidth
        const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100
        onWidthChange(Math.min(Math.max(newWidth, 30), 85))
      }
      if (isResizingVertical && panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect()
        const relativeX = e.clientX - rect.left
        const newWidth = (relativeX / rect.width) * 100
        setCodePaneWidth(Math.min(Math.max(newWidth, 25), 75))
      }
      if (isResizingHorizontal && panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect()
        const contentTop = rect.top + 112
        const contentHeight = rect.height - 112
        const relativeY = e.clientY - contentTop
        const newHeight = (relativeY / contentHeight) * 100
        setCodePaneHeight(Math.min(Math.max(newHeight, 25), 75))
      }
      if (isResizingInputOutput && panelRef.current) {
        const ioPaneEl = panelRef.current.querySelector("[data-io-pane]") as HTMLElement
        if (ioPaneEl) {
          const rect = ioPaneEl.getBoundingClientRect()
          const relativeY = e.clientY - rect.top
          const newSplit = (relativeY / rect.height) * 100
          setInputOutputSplit(Math.min(Math.max(newSplit, 20), 80))
        }
      }
      if (draggingModule) {
        setDragPosition({ x: e.clientX, y: e.clientY })

        const elements = document.elementsFromPoint(e.clientX, e.clientY)
        const dropZone = elements.find((el) => el.hasAttribute("data-drop-zone"))

        if (dropZone) {
          const zone = dropZone.getAttribute("data-drop-zone") || ""
          const index = Number.parseInt(dropZone.getAttribute("data-drop-index") || "0")
          setDropTarget({ zone, index })
        } else {
          setDropTarget(null)
        }
      }
    }

    const handleMouseUp = () => {
      if (draggingModule && dropTarget) {
        if (layout === "horizontal") {
          const newModules = { ...horizontalModules }
          // Remove from current position
          newModules.left = newModules.left.filter((m) => m !== draggingModule)
          newModules.right = newModules.right.filter((m) => m !== draggingModule)

          // Add to new position
          if (dropTarget.zone === "left") {
            newModules.left.splice(dropTarget.index, 0, draggingModule)
          } else if (dropTarget.zone === "right") {
            newModules.right.splice(dropTarget.index, 0, draggingModule)
          }

          // Ensure each zone has at least one module
          if (newModules.left.length > 0 && newModules.right.length > 0) {
            setHorizontalModules(newModules)
          }
        } else {
          const newModules = { ...verticalModules }
          // Remove from current position
          newModules.top = newModules.top.filter((m) => m !== draggingModule)
          newModules.bottom = newModules.bottom.filter((m) => m !== draggingModule)

          // Add to new position
          if (dropTarget.zone === "top") {
            newModules.top.splice(dropTarget.index, 0, draggingModule)
          } else if (dropTarget.zone === "bottom") {
            newModules.bottom.splice(dropTarget.index, 0, draggingModule)
          }

          // Ensure each zone has at least one module
          if (newModules.top.length > 0 && newModules.bottom.length > 0) {
            setVerticalModules(newModules)
          }
        }
      }

      setIsResizingWidth(false)
      setIsResizingVertical(false)
      setIsResizingHorizontal(false)
      setIsResizingInputOutput(false)
      setDraggingModule(null)
      setDragPosition(null)
      setDropTarget(null)
    }

    if (isResizingWidth || isResizingVertical || isResizingHorizontal || isResizingInputOutput || draggingModule) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = draggingModule
        ? "grabbing"
        : isResizingWidth || isResizingVertical
          ? "ew-resize"
          : "ns-resize"
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [
    isResizingWidth,
    isResizingVertical,
    isResizingHorizontal,
    isResizingInputOutput,
    onWidthChange,
    draggingModule,
    dropTarget,
    layout,
    horizontalModules,
    verticalModules,
  ])

  const handleRun = () => {
    if (onRunNode) {
      onRunNode()
    }
  }

  const isNodeRunning = isRunning || nodeExecutionStatus === "running"

  const getModuleHeader = (type: ModuleType) => {
    switch (type) {
      case "code":
        return { icon: <Code className="h-3 w-3" />, label: "Code" }
      case "input":
        return { icon: <div className="h-2 w-2 rounded-full bg-chart-4" />, label: "Input" }
      case "output":
        return { icon: <div className="h-2 w-2 rounded-full bg-chart-2" />, label: "Output" }
    }
  }

  return (
    <div
      ref={panelRef}
      className="relative flex h-full flex-col border-l border-border bg-card"
      style={{ width: `${width}%` }}
    >
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
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              node.type === "trigger" && "bg-chart-2/20 text-chart-2",
              node.type === "function" && "bg-chart-3/20 text-chart-3",
              node.type === "condition" && "bg-chart-4/20 text-chart-4",
              node.type === "action" && "bg-primary/20 text-primary",
            )}
          >
            <Code className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{node.label}</h3>
            <p className="text-xs text-muted-foreground capitalize">{node.type} Node</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onCollapse} title="Collapse panel">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex border-b border-border">
        <button
          className={cn(
            "flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors",
            activeTab === "properties"
              ? "border-b-2 border-primary text-foreground bg-secondary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/20",
          )}
          onClick={() => setActiveTab("properties")}
        >
          <Settings className="h-3.5 w-3.5" />
          Properties
        </button>
        <button
          className={cn(
            "flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors",
            activeTab === "variables"
              ? "border-b-2 border-primary text-foreground bg-secondary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/20",
          )}
          onClick={() => setActiveTab("variables")}
        >
          <Variable className="h-3.5 w-3.5" />
          Variables
          {node.variables && node.variables.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">
              {node.variables.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "properties" ? (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-2">
            <div className="flex items-center gap-3">
              <div className="mr-2 flex items-center rounded-md border border-border bg-secondary p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-7 w-7 p-0", layout === "horizontal" && "bg-card shadow-sm")}
                  onClick={() => setLayout("horizontal")}
                  title="Horizontal layout"
                >
                  <Columns3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-7 w-7 p-0", layout === "vertical" && "bg-card shadow-sm")}
                  onClick={() => setLayout("vertical")}
                  title="Vertical layout"
                >
                  <Rows3 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <span className="rounded bg-chart-3/20 px-2 py-0.5 text-[10px] font-medium text-chart-3">
                {node.data?.runtime || "JavaScript"}
              </span>
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
          </div>

          {layout === "horizontal" ? (
            <DraggableHorizontalLayout
              node={node}
              onNodeUpdate={onNodeUpdate}
              modules={horizontalModules}
              codePaneWidth={codePaneWidth}
              onResizeStart={handleVerticalResizeStart}
              inputOutputSplit={inputOutputSplit}
              onInputOutputResizeStart={handleInputOutputResizeStart}
              onModuleDragStart={handleModuleDragStart}
              draggingModule={draggingModule}
              dropTarget={dropTarget}
            />
          ) : (
            <DraggableVerticalLayout
              node={node}
              onNodeUpdate={onNodeUpdate}
              modules={verticalModules}
              codePaneHeight={codePaneHeight}
              onResizeStart={handleHorizontalResizeStart}
              inputOutputSplit={inputOutputSplit}
              onInputOutputResizeStart={handleInputOutputResizeStart}
              onModuleDragStart={handleModuleDragStart}
              draggingModule={draggingModule}
              dropTarget={dropTarget}
            />
          )}
        </>
      ) : (
        <NodeVariablesTab node={node} onNodeUpdate={onNodeUpdate} />
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
          {getModuleHeader(draggingModule).icon}
          <span className="text-xs font-medium">{getModuleHeader(draggingModule).label}</span>
        </div>
      )}
    </div>
  )
}

// ... existing NodeVariablesTab code ...

type CodeModuleTab = "parameters" | "script" | "errorHandling"

function DraggableHorizontalLayout({
  node,
  onNodeUpdate,
  modules,
  codePaneWidth,
  onResizeStart,
  inputOutputSplit,
  onInputOutputResizeStart,
  onModuleDragStart,
  draggingModule,
  dropTarget,
}: {
  node: WorkflowNode
  onNodeUpdate: (node: WorkflowNode) => void
  modules: { left: ModuleType[]; right: ModuleType[] }
  codePaneWidth: number
  onResizeStart: (e: React.MouseEvent) => void
  inputOutputSplit: number
  onInputOutputResizeStart: (e: React.MouseEvent) => void
  onModuleDragStart: (e: React.MouseEvent, type: ModuleType) => void
  draggingModule: ModuleType | null
  dropTarget: { zone: string; index: number } | null
}) {
  const [codeTab, setCodeTab] = useState<CodeModuleTab>("script")

  const renderModuleContent = (type: ModuleType) => {
    switch (type) {
      case "code":
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center border-b border-border bg-secondary/30 shrink-0">
              <button
                onClick={() => setCodeTab("parameters")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2",
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
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2",
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
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2",
                  codeTab === "errorHandling"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <AlertTriangle className="h-3 w-3" />
                Error Handling
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {codeTab === "parameters" && (
                <div className="h-full overflow-auto p-4 space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Node Name</Label>
                    <Input
                      value={node.label}
                      onChange={(e) => onNodeUpdate({ ...node, label: e.target.value })}
                      className="mt-1 h-8 bg-secondary/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Runtime</Label>
                    <select
                      value={node.data?.runtime || "javascript"}
                      onChange={(e) => onNodeUpdate({ ...node, data: { ...node.data, runtime: e.target.value } })}
                      className="mt-1 h-8 w-full rounded-md border border-border bg-secondary/50 px-2 text-sm"
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
                      className="mt-1 h-8 bg-secondary/50"
                    />
                  </div>
                </div>
              )}
              {codeTab === "script" && (
                <CodeEditor
                  value={
                    node.data?.code ||
                    "// Write your code here\n\nmodule.exports = async (input) => {\n  return { result: input };\n};"
                  }
                  language="javascript"
                  onChange={(value) => onNodeUpdate({ ...node, data: { ...node.data, code: value } })}
                />
              )}
              {codeTab === "errorHandling" && (
                <div className="h-full overflow-auto p-4 space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">On Error</Label>
                    <select
                      value={node.data?.onError || "stop"}
                      onChange={(e) => onNodeUpdate({ ...node, data: { ...node.data, onError: e.target.value } })}
                      className="mt-1 h-8 w-full rounded-md border border-border bg-secondary/50 px-2 text-sm"
                    >
                      <option value="stop">Stop Workflow</option>
                      <option value="continue">Continue</option>
                      <option value="retry">Retry</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Retry Count</Label>
                    <Input
                      type="number"
                      value={node.data?.retryCount || 3}
                      onChange={(e) =>
                        onNodeUpdate({ ...node, data: { ...node.data, retryCount: Number.parseInt(e.target.value) } })
                      }
                      className="mt-1 h-8 bg-secondary/50"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      case "input":
        return (
          <CodeEditor
            value={node.data?.input || "{\n  \n}"}
            language="json"
            onChange={(value) => onNodeUpdate({ ...node, data: { ...node.data, input: value } })}
          />
        )
      case "output":
        return <CodeEditor value={node.data?.output || "{\n  \n}"} language="json" readOnly />
    }
  }

  const getModuleHeader = (type: ModuleType) => {
    switch (type) {
      case "code":
        return { icon: <Code className="h-3 w-3 text-muted-foreground" />, label: "Code" }
      case "input":
        return { icon: <div className="h-2 w-2 rounded-full bg-chart-4" />, label: "Input", badge: "JSON" }
      case "output":
        return { icon: <div className="h-2 w-2 rounded-full bg-chart-2" />, label: "Output", badge: "Read-only" }
    }
  }

  const renderModule = (type: ModuleType, zone: string, index: number) => {
    const header = getModuleHeader(type)
    const isDragOver = dropTarget?.zone === zone && dropTarget?.index === index
    const isDragging = draggingModule === type

    return (
      <div
        key={type}
        data-drop-zone={zone}
        data-drop-index={index}
        className={cn(
          "flex flex-col overflow-hidden border border-transparent rounded-lg flex-1",
          isDragOver && "border-primary bg-primary/10",
          isDragging && "opacity-40",
        )}
      >
        <div
          className="flex items-center justify-between border-b border-border bg-secondary/30 px-3 py-2 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={(e) => onModuleDragStart(e, type)}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
            {header.icon}
            <Label className="text-xs font-medium text-foreground">{header.label}</Label>
          </div>
          {header.badge && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
              {header.badge}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">{renderModuleContent(type)}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Zone */}
      <div className="flex flex-col gap-1 p-1" style={{ width: `${codePaneWidth}%` }}>
        {modules.left.map((type, index) => renderModule(type, "left", index))}
        {/* Drop zone at end of left column */}
        <div
          data-drop-zone="left"
          data-drop-index={modules.left.length}
          className={cn(
            "h-8 rounded border-2 border-dashed border-transparent transition-colors",
            dropTarget?.zone === "left" && dropTarget?.index === modules.left.length && "border-primary bg-primary/10",
          )}
        />
      </div>

      {/* Resize handle */}
      <div
        className="relative flex w-1 cursor-ew-resize items-center justify-center hover:bg-primary/50 active:bg-primary"
        onMouseDown={onResizeStart}
      >
        <div className="absolute flex h-12 w-4 items-center justify-center rounded bg-border opacity-0 hover:opacity-100">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Right Zone */}
      <div className="flex flex-1 flex-col gap-1 p-1">
        {modules.right.map((type, index) => renderModule(type, "right", index))}
        {/* Drop zone at end of right column */}
        <div
          data-drop-zone="right"
          data-drop-index={modules.right.length}
          className={cn(
            "h-8 rounded border-2 border-dashed border-transparent transition-colors",
            dropTarget?.zone === "right" &&
              dropTarget?.index === modules.right.length &&
              "border-primary bg-primary/10",
          )}
        />
      </div>
    </div>
  )
}

function DraggableVerticalLayout({
  node,
  onNodeUpdate,
  modules,
  codePaneHeight,
  onResizeStart,
  inputOutputSplit,
  onInputOutputResizeStart,
  onModuleDragStart,
  draggingModule,
  dropTarget,
}: {
  node: WorkflowNode
  onNodeUpdate: (node: WorkflowNode) => void
  modules: { top: ModuleType[]; bottom: ModuleType[] }
  codePaneHeight: number
  onResizeStart: (e: React.MouseEvent) => void
  inputOutputSplit: number
  onInputOutputResizeStart: (e: React.MouseEvent) => void
  onModuleDragStart: (e: React.MouseEvent, type: ModuleType) => void
  draggingModule: ModuleType | null
  dropTarget: { zone: string; index: number } | null
}) {
  const [codeTab, setCodeTab] = useState<CodeModuleTab>("script")

  const renderModuleContent = (type: ModuleType) => {
    switch (type) {
      case "code":
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center border-b border-border bg-secondary/30 shrink-0">
              <button
                onClick={() => setCodeTab("parameters")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2",
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
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2",
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
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2",
                  codeTab === "errorHandling"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <AlertTriangle className="h-3 w-3" />
                Error Handling
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {codeTab === "parameters" && (
                <div className="h-full overflow-auto p-4 space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Node Name</Label>
                    <Input
                      value={node.label}
                      onChange={(e) => onNodeUpdate({ ...node, label: e.target.value })}
                      className="mt-1 h-8 bg-secondary/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Runtime</Label>
                    <select
                      value={node.data?.runtime || "javascript"}
                      onChange={(e) => onNodeUpdate({ ...node, data: { ...node.data, runtime: e.target.value } })}
                      className="mt-1 h-8 w-full rounded-md border border-border bg-secondary/50 px-2 text-sm"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                    </select>
                  </div>
                </div>
              )}
              {codeTab === "script" && (
                <CodeEditor
                  value={
                    node.data?.code ||
                    "// Write your code here\n\nmodule.exports = async (input) => {\n  return { result: input };\n};"
                  }
                  language="javascript"
                  onChange={(value) => onNodeUpdate({ ...node, data: { ...node.data, code: value } })}
                />
              )}
              {codeTab === "errorHandling" && (
                <div className="h-full overflow-auto p-4 space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">On Error</Label>
                    <select
                      value={node.data?.onError || "stop"}
                      onChange={(e) => onNodeUpdate({ ...node, data: { ...node.data, onError: e.target.value } })}
                      className="mt-1 h-8 w-full rounded-md border border-border bg-secondary/50 px-2 text-sm"
                    >
                      <option value="stop">Stop Workflow</option>
                      <option value="continue">Continue</option>
                      <option value="retry">Retry</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      case "input":
        return (
          <CodeEditor
            value={node.data?.input || "{\n  \n}"}
            language="json"
            onChange={(value) => onNodeUpdate({ ...node, data: { ...node.data, input: value } })}
          />
        )
      case "output":
        return <CodeEditor value={node.data?.output || "{\n  \n}"} language="json" readOnly />
    }
  }

  const getModuleHeader = (type: ModuleType) => {
    switch (type) {
      case "code":
        return { icon: <Code className="h-3 w-3 text-muted-foreground" />, label: "Code" }
      case "input":
        return { icon: <div className="h-2 w-2 rounded-full bg-chart-4" />, label: "Input", badge: "JSON" }
      case "output":
        return { icon: <div className="h-2 w-2 rounded-full bg-chart-2" />, label: "Output", badge: "Read-only" }
    }
  }

  const renderModule = (type: ModuleType, zone: string, index: number) => {
    const header = getModuleHeader(type)
    const isDragOver = dropTarget?.zone === zone && dropTarget?.index === index
    const isDragging = draggingModule === type

    return (
      <div
        key={type}
        data-drop-zone={zone}
        data-drop-index={index}
        className={cn(
          "flex flex-col overflow-hidden border border-transparent rounded-lg flex-1",
          isDragOver && "border-primary bg-primary/10",
          isDragging && "opacity-40",
        )}
      >
        <div
          className="flex items-center justify-between border-b border-border bg-secondary/30 px-3 py-2 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={(e) => onModuleDragStart(e, type)}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
            {header.icon}
            <Label className="text-xs font-medium text-foreground">{header.label}</Label>
          </div>
          {header.badge && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
              {header.badge}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-hidden">{renderModuleContent(type)}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Top Zone */}
      <div className="flex gap-1 p-1" style={{ height: `${codePaneHeight}%` }}>
        {modules.top.map((type, index) => renderModule(type, "top", index))}
        {/* Drop zone at end */}
        <div
          data-drop-zone="top"
          data-drop-index={modules.top.length}
          className={cn(
            "w-8 rounded border-2 border-dashed border-transparent transition-colors",
            dropTarget?.zone === "top" && dropTarget?.index === modules.top.length && "border-primary bg-primary/10",
          )}
        />
      </div>

      {/* Resize handle */}
      <div
        className="relative flex h-1 cursor-ns-resize items-center justify-center hover:bg-primary/50 active:bg-primary"
        onMouseDown={onResizeStart}
      >
        <div className="absolute flex h-4 w-12 items-center justify-center rounded bg-border opacity-0 hover:opacity-100">
          <GripVertical className="h-4 w-4 rotate-90 text-muted-foreground" />
        </div>
      </div>

      {/* Bottom Zone */}
      <div className="flex flex-1 gap-1 p-1">
        {modules.bottom.map((type, index) => renderModule(type, "bottom", index))}
        {/* Drop zone at end */}
        <div
          data-drop-zone="bottom"
          data-drop-index={modules.bottom.length}
          className={cn(
            "w-8 rounded border-2 border-dashed border-transparent transition-colors",
            dropTarget?.zone === "bottom" &&
              dropTarget?.index === modules.bottom.length &&
              "border-primary bg-primary/10",
          )}
        />
      </div>
    </div>
  )
}

function NodeVariablesTab({
  node,
  onNodeUpdate,
}: {
  node: WorkflowNode
  onNodeUpdate: (node: WorkflowNode) => void
}) {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const variables = node.variables || []

  const handleAddVariable = () => {
    const newVariable: VariableType = {
      id: `v${Date.now()}`,
      name: "",
      value: "",
      type: "string",
    }
    onNodeUpdate({
      ...node,
      variables: [...variables, newVariable],
    })
  }

  const handleUpdateVariable = (id: string, updates: Partial<VariableType>) => {
    onNodeUpdate({
      ...node,
      variables: variables.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    })
  }

  const handleDeleteVariable = (id: string) => {
    onNodeUpdate({
      ...node,
      variables: variables.filter((v) => v.id !== id),
    })
  }

  const toggleSecret = (id: string) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Variables Header */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Node-specific variables for "{node.label}"</span>
        </div>
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs bg-transparent" onClick={handleAddVariable}>
          <Plus className="h-3 w-3" />
          Add Variable
        </Button>
      </div>

      {/* Variables List */}
      <div className="flex-1 overflow-auto p-4">
        {variables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Variable className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No variables defined</p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
              Add variables specific to this node for configuration and secrets
            </p>
            <Button size="sm" variant="outline" className="mt-4 gap-1.5 bg-transparent" onClick={handleAddVariable}>
              <Plus className="h-3.5 w-3.5" />
              Add Variable
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {variables.map((variable) => (
              <div key={variable.id} className="rounded-lg border border-border bg-secondary/20 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={variable.name}
                    onChange={(e) => handleUpdateVariable(variable.id, { name: e.target.value })}
                    placeholder="VARIABLE_NAME"
                    className="h-7 text-xs font-mono flex-1"
                  />
                  <select
                    value={variable.type}
                    onChange={(e) =>
                      handleUpdateVariable(variable.id, { type: e.target.value as VariableType["type"] })
                    }
                    className="h-7 rounded-md border border-border bg-background px-2 text-xs"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="secret">Secret</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteVariable(variable.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={variable.value}
                    onChange={(e) => handleUpdateVariable(variable.id, { value: e.target.value })}
                    placeholder="Value"
                    type={variable.type === "secret" && !showSecrets[variable.id] ? "password" : "text"}
                    className="h-7 text-xs flex-1"
                  />
                  {variable.type === "secret" && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleSecret(variable.id)}>
                      {showSecrets[variable.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
