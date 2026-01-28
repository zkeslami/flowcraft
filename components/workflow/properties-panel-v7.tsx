"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  X,
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
  Maximize2,
  Minimize2,
  Zap,
  GitBranch,
  Send,
  Bot,
  History,
} from "lucide-react"
import type { WorkflowNode, Variable as VariableType, NodeExecutionStatus, Connection } from "@/lib/workflow-types"
import { cn } from "@/lib/utils"
import { CodeEditor } from "./code-editor"
import { QuadrantEditor } from "./quadrant-editor"
import { AgentPromptEditor } from "@/components/prompt-editor/AgentPromptEditor"
import { DataViewer } from "./data-viewer"
import { NodeRunHistory } from "./node-run-history"
import { MockSimulationConfig, type MockConfig, type SimulationConfig } from "./mock-simulation-config"
import type { ExecutionSpan } from "@/lib/execution-types"
import { mockExecutionHistory, executionMap } from "@/lib/mock-execution-data"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Database, Wand2 } from "lucide-react"

type ModuleType = "code" | "input" | "output"
type DraggingModule = { index: number; type: ModuleType } | null
type DropTarget = { index: number } | null

type CanvasViewMode = "collapsed" | "expanded" | "visual"

interface PropertiesPanelV7Props {
  node: WorkflowNode
  onClose: () => void
  onNodeUpdate: (node: WorkflowNode) => void
  width: number
  onWidthChange: (width: number) => void
  onRunNode?: () => void
  isRunning?: boolean
  nodeExecutionStatus?: NodeExecutionStatus
  isMaximized: boolean
  onToggleMaximize: () => void
  // For maximized (quadrant) view
  nodes?: WorkflowNode[]
  connections?: Connection[]
  onNodeSelect?: (node: WorkflowNode | null) => void
  nodeExecutionStatuses?: Record<string, NodeExecutionStatus>
  canvasViewMode?: CanvasViewMode
}

export function PropertiesPanelV7({
  node,
  onClose,
  onNodeUpdate,
  width,
  onWidthChange,
  onRunNode,
  isRunning = false,
  nodeExecutionStatus,
  isMaximized,
  onToggleMaximize,
  nodes = [],
  connections = [],
  onNodeSelect,
  nodeExecutionStatuses = {},
  canvasViewMode = "expanded",
}: PropertiesPanelV7Props) {
  const [lastRunTime, setLastRunTime] = useState<string | null>(null)
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal")
  const [activeTab, setActiveTab] = useState<"properties" | "variables">("properties")

  // New state for mock/simulation/history
  const [showRunHistory, setShowRunHistory] = useState(false)
  const [showMockDialog, setShowMockDialog] = useState(false)
  const [showSimulationDialog, setShowSimulationDialog] = useState(false)
  const [mockConfig, setMockConfig] = useState<MockConfig>({
    enabled: false,
    source: "custom",
    customData: JSON.stringify({
      "invoiceId": "INV-2024-001",
      "vendor": "Acme Corp",
      "amount": 1250.00,
      "date": "2024-01-15",
      "isValid": true
    }, null, 2)
  })
  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig>({
    enabled: false,
    prompt: "Simulate a successful validation with confidence score of 0.95 and all checks passed"
  })
  const [runResult, setRunResult] = useState<Record<string, unknown> | null>(null)

  const [codePaneWidth, setCodePaneWidth] = useState(60)
  const [codePaneHeight, setCodePaneHeight] = useState(60)
  const [inputOutputSplit, setInputOutputSplit] = useState(50)
  const [graphPaneHeight, setGraphPaneHeight] = useState(40)
  
  // Module order state for drag and drop
  const [moduleOrder, setModuleOrder] = useState<ModuleType[]>(["code", "input", "output"])
  const [draggingModule, setDraggingModule] = useState<DraggingModule>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const draggingModuleRef = useRef<DraggingModule>(null)
  const dropTargetRef = useRef<DropTarget>(null)
  const moduleOrderRef = useRef<ModuleType[]>(moduleOrder)
  const [isResizingWidth, setIsResizingWidth] = useState(false)
  const [isResizingVertical, setIsResizingVertical] = useState(false)
  const [isResizingHorizontal, setIsResizingHorizontal] = useState(false)
  const [isResizingInputOutput, setIsResizingInputOutput] = useState(false)
  const [isResizingGraph, setIsResizingGraph] = useState(false)

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

  const handleGraphResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingGraph(true)
  }, [])

  const handleModuleDragStart = useCallback((e: React.MouseEvent, index: number, type: ModuleType) => {
    e.preventDefault()
    e.stopPropagation()
    const dragData = { index, type }
    setDraggingModule(dragData)
    draggingModuleRef.current = dragData
    setDragPosition({ x: e.clientX, y: e.clientY })
  }, [])
  
  // Keep refs in sync with state
  useEffect(() => {
    moduleOrderRef.current = moduleOrder
  }, [moduleOrder])

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
      if (isResizingGraph && panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect()
        const contentTop = rect.top + 56
        const contentHeight = rect.height - 56
        const relativeY = e.clientY - contentTop
        const newHeight = (relativeY / contentHeight) * 100
        setGraphPaneHeight(Math.min(Math.max(newHeight, 20), 60))
      }
      
      // Handle module dragging
      if (draggingModule) {
        setDragPosition({ x: e.clientX, y: e.clientY })
        
        // Find which module cell we're over
        const elements = document.elementsFromPoint(e.clientX, e.clientY)
        const moduleCell = elements.find((el) => el.hasAttribute("data-module-cell"))
        
        if (moduleCell) {
          const targetIndex = Number.parseInt(moduleCell.getAttribute("data-module-index") || "0")
          if (targetIndex !== draggingModule.index) {
            const target = { index: targetIndex }
            setDropTarget(target)
            dropTargetRef.current = target
          } else {
            setDropTarget(null)
            dropTargetRef.current = null
          }
        } else {
          setDropTarget(null)
          dropTargetRef.current = null
        }
      }
    }

    const handleMouseUp = () => {
      // Handle module drop using refs for current values
      if (draggingModuleRef.current && dropTargetRef.current) {
        const newOrder = [...moduleOrderRef.current]
        const [removed] = newOrder.splice(draggingModuleRef.current.index, 1)
        newOrder.splice(dropTargetRef.current.index, 0, removed)
        setModuleOrder(newOrder)
        moduleOrderRef.current = newOrder
      }
      
      setIsResizingWidth(false)
      setIsResizingVertical(false)
      setIsResizingHorizontal(false)
      setIsResizingInputOutput(false)
      setIsResizingGraph(false)
      setDraggingModule(null)
      draggingModuleRef.current = null
      setDropTarget(null)
      dropTargetRef.current = null
      setDragPosition(null)
    }

    if (isResizingWidth || isResizingVertical || isResizingHorizontal || isResizingInputOutput || isResizingGraph || draggingModule) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = "none"
      
      if (draggingModule) {
        document.body.style.cursor = "grabbing"
      } else if (isResizingWidth || isResizingVertical) {
        document.body.style.cursor = "ew-resize"
      } else {
        document.body.style.cursor = "ns-resize"
      }
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizingWidth, isResizingVertical, isResizingHorizontal, isResizingInputOutput, isResizingGraph, onWidthChange, draggingModule, dropTarget, moduleOrder])

  // Get available runs for this node from execution history
  const availableRuns: ExecutionSpan[] = []
  mockExecutionHistory.forEach((historyItem) => {
    const execution = executionMap[historyItem.id]
    if (execution) {
      const nodeSpans = execution.spans.filter((span) => span.nodeId === node.id)
      availableRuns.push(...nodeSpans)
    }
  })

  // Generate dummy input data if not present
  const getDummyInputData = () => {
    if (node.id === "3") { // Validate Invoice node
      return {
        "extracted": {
          "vendor": "Acme Corp",
          "amount": 1250.00,
          "date": "2024-01-15",
          "items": [
            { "description": "Professional Services", "amount": 1250.00 }
          ]
        },
        "invoiceId": "INV-2024-001",
        "timestamp": new Date().toISOString()
      }
    }
    return { "message": "Sample input data", "timestamp": new Date().toISOString() }
  }

  const handleRun = () => {
    if (onRunNode) {
      // Handle mock/simulation modes
      if (simulationConfig.enabled) {
        // Simulate output based on prompt
        setTimeout(() => {
          setRunResult({
            "simulated": true,
            "isValid": true,
            "confidence": 0.95,
            "checks": {
              "vendorExists": true,
              "amountValid": true,
              "dateValid": true,
              "budgetApproved": true
            },
            "message": "Simulated validation successful",
            "timestamp": new Date().toISOString()
          })
        }, 1500)
      } else if (mockConfig.enabled) {
        // Use mock data
        setTimeout(() => {
          if (mockConfig.source === "custom" && mockConfig.customData) {
            try {
              setRunResult(JSON.parse(mockConfig.customData))
            } catch {
              setRunResult({ "error": "Invalid JSON in mock data" })
            }
          } else if (mockConfig.source === "history" && mockConfig.historyRunId) {
            const run = availableRuns.find((r) => r.id === mockConfig.historyRunId)
            setRunResult(run?.outputs || {})
          }
        }, 1000)
      }
      onRunNode()
    }
  }

  const isNodeRunning = isRunning || nodeExecutionStatus === "running"

  // When maximized, use the QuadrantEditor (same as V5 quadrant view)
  if (isMaximized) {
    return (
      <div className="h-full w-full">
        <QuadrantEditor
          node={node}
          nodes={nodes}
          connections={connections}
          onClose={onClose}
          onCollapse={onToggleMaximize}
          onNodeUpdate={onNodeUpdate}
          onNodeSelect={onNodeSelect || (() => {})}
          onRunNode={onRunNode}
          isRunning={isRunning}
          nodeExecutionStatus={nodeExecutionStatus}
          nodeExecutionStatuses={nodeExecutionStatuses}
          canvasViewMode={canvasViewMode}
        />
      </div>
    )
  }

  return (
    <div
      ref={panelRef}
      className="relative flex h-full w-full flex-col border-l border-border bg-card"
    >
      {!isMaximized && (
        <div
          className="absolute left-0 top-0 z-10 h-full w-1 cursor-ew-resize hover:bg-primary/50 active:bg-primary"
          onMouseDown={handleWidthResizeStart}
        >
          <div className="absolute left-0 top-1/2 flex h-12 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded bg-border opacity-0 hover:opacity-100">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Panel Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
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
        </div>
        <div className="flex items-center gap-2">
          {/* Properties/Variables Toggle - segmented control style, h-8 to match other buttons */}
          <div className="flex h-8 items-center rounded-md bg-muted p-0.5">
            <button
              onClick={() => setActiveTab("properties")}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded px-3 text-xs font-medium transition-all",
                activeTab === "properties"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              Properties
            </button>
            <button
              onClick={() => setActiveTab("variables")}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded px-3 text-xs font-medium transition-all",
                activeTab === "variables"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
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

          <div className="mx-1 h-6 w-px bg-border" />

          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {activeTab === "properties" ? (
        <>
          {/* Toolstrip */}
          <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-2">
            <div className="flex items-center gap-3">
              {/* Expand button - left of layout switcher */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onToggleMaximize}
                title={isMaximized ? "Collapse to docked view" : "Expand to full width"}
              >
                {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
              <div className="flex items-center rounded-md border border-border bg-secondary p-0.5">
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

          {showRunHistory ? (
            <NodeRunHistory
              nodeId={node.id}
              nodeName={node.label}
              runs={availableRuns}
              onClose={() => setShowRunHistory(false)}
              onSelectRun={(run) => {
                // Optionally load run data into node
                setMockConfig({
                  enabled: true,
                  source: "history",
                  historyRunId: run.id,
                })
              }}
            />
          ) : layout === "horizontal" ? (
            <HorizontalLayout
              node={node}
              onNodeUpdate={onNodeUpdate}
              codePaneWidth={codePaneWidth}
              onResizeStart={handleVerticalResizeStart}
              inputOutputSplit={inputOutputSplit}
              onInputOutputResizeStart={handleInputOutputResizeStart}
              isMaximized={isMaximized}
              graphPaneHeight={graphPaneHeight}
              moduleOrder={moduleOrder}
              onModuleDragStart={handleModuleDragStart}
              draggingModule={draggingModule}
              dropTarget={dropTarget}
              isNodeRunning={isNodeRunning}
              mockConfig={mockConfig}
              simulationConfig={simulationConfig}
              onMockConfigChange={setMockConfig}
              onSimulationConfigChange={setSimulationConfig}
              availableRuns={availableRuns}
              onShowRunHistory={() => setShowRunHistory(true)}
              runResult={runResult}
              getDummyInputData={getDummyInputData}
              showMockDialog={showMockDialog}
              setShowMockDialog={setShowMockDialog}
              showSimulationDialog={showSimulationDialog}
              setShowSimulationDialog={setShowSimulationDialog}
            />
          ) : (
            <VerticalLayout
              node={node}
              onNodeUpdate={onNodeUpdate}
              codePaneHeight={codePaneHeight}
              onResizeStart={handleHorizontalResizeStart}
              inputOutputSplit={inputOutputSplit}
              onInputOutputResizeStart={handleInputOutputResizeStart}
              isMaximized={isMaximized}
              graphPaneHeight={graphPaneHeight}
              moduleOrder={moduleOrder}
              onModuleDragStart={handleModuleDragStart}
              draggingModule={draggingModule}
              dropTarget={dropTarget}
              isNodeRunning={isNodeRunning}
              mockConfig={mockConfig}
              simulationConfig={simulationConfig}
              onMockConfigChange={setMockConfig}
              onSimulationConfigChange={setSimulationConfig}
              availableRuns={availableRuns}
              onShowRunHistory={() => setShowRunHistory(true)}
              runResult={runResult}
              getDummyInputData={getDummyInputData}
              showMockDialog={showMockDialog}
              setShowMockDialog={setShowMockDialog}
              showSimulationDialog={showSimulationDialog}
              setShowSimulationDialog={setShowSimulationDialog}
            />
          )}
        </>
      ) : (
        <NodeVariablesTab node={node} onNodeUpdate={onNodeUpdate} />
      )}
      
      {/* Floating drag preview */}
      {draggingModule && dragPosition && (
        <div
          className="fixed z-50 pointer-events-none bg-card border border-primary rounded-md px-3 py-2 shadow-lg flex items-center gap-2"
          style={{
            left: dragPosition.x + 10,
            top: dragPosition.y + 10,
          }}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
          <div className={cn(
            "h-2 w-2 rounded-full",
            draggingModule.type === "code" && "bg-chart-1",
            draggingModule.type === "input" && "bg-chart-4",
            draggingModule.type === "output" && "bg-chart-2"
          )} />
          <span className="text-xs font-medium capitalize">{draggingModule.type}</span>
        </div>
      )}
    </div>
  )
}

type CodeModuleTab = "parameters" | "script" | "errorHandling"

function ModuleContent({
  type,
  node,
  onNodeUpdate,
  codeTab,
  setCodeTab,
  isNodeRunning,
  mockConfig,
  simulationConfig,
  onMockConfigChange,
  onSimulationConfigChange,
  availableRuns,
  onShowRunHistory,
  runResult,
  getDummyInputData,
}: {
  type: ModuleType
  node: WorkflowNode
  onNodeUpdate: (node: WorkflowNode) => void
  codeTab: CodeModuleTab
  setCodeTab: (tab: CodeModuleTab) => void
  isNodeRunning?: boolean
  mockConfig?: MockConfig
  simulationConfig?: SimulationConfig
  onMockConfigChange?: (config: MockConfig) => void
  onSimulationConfigChange?: (config: SimulationConfig) => void
  availableRuns?: ExecutionSpan[]
  onShowRunHistory?: () => void
  runResult?: Record<string, unknown> | null
  getDummyInputData?: () => Record<string, unknown>
}) {
  if (type === "code") {
    return (
      <>
        {/* Tabs row below the Code header */}
        <div className="flex items-center border-b border-border bg-background/50 shrink-0 px-2">
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
            <div className="h-full overflow-auto p-4 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Node Name</Label>
                <Input
                  value={node.label}
                  onChange={(e) => onNodeUpdate({ ...node, label: e.target.value })}
                  className="mt-1 h-8 bg-secondary/50"
                  disabled={isNodeRunning}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Runtime</Label>
                <Input
                  value={node.data?.runtime || "Node.js"}
                  onChange={(e) => onNodeUpdate({ ...node, data: { ...node.data, runtime: e.target.value } })}
                  className="mt-1 h-8 bg-secondary/50"
                  disabled={isNodeRunning}
                />
              </div>
              
              {/* Agent-specific parameters */}
              {node.type === "agent" && (
                <>
                  <div className="pt-2 border-t border-border">
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
                      className="mt-1 h-8 bg-secondary/50"
                      disabled={isNodeRunning}
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
                      disabled={isNodeRunning}
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
                      disabled={isNodeRunning}
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
              )}
            </div>
          )}
          {codeTab === "script" && (
            <CodeEditor
              value={node.data?.code || "// Add your code here"}
              onChange={(code) => onNodeUpdate({ ...node, data: { ...node.data, code } })}
              language="javascript"
            />
          )}
          {codeTab === "errorHandling" && (
            <div className="h-full overflow-auto p-4 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Error Behavior</Label>
                <select className="mt-1 w-full h-8 rounded-md border border-border bg-secondary/50 px-2 text-sm">
                  <option>Stop workflow</option>
                  <option>Continue to next node</option>
                  <option>Retry (3 times)</option>
                  <option>Custom error handler</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </>
    )
  }

  if (type === "input") {
    const inputData = getDummyInputData ? getDummyInputData() : {}
    let parsedInput: Record<string, unknown> = inputData

    try {
      if (node.data?.input) {
        parsedInput = JSON.parse(node.data.input)
      }
    } catch {
      // Use dummy data if parsing fails
    }

    return (
      <div className="flex-1 overflow-hidden">
        <DataViewer
          data={parsedInput}
          mode="input"
          readOnly={isNodeRunning}
          onChange={(value) => onNodeUpdate({ ...node, data: { ...node.data, input: value } })}
        />
      </div>
    )
  }

  // output
  if (type === "output") {
    // Use run result if available, otherwise use node data
    const outputData = runResult || (node.data?.output ? (() => {
      try {
        return JSON.parse(node.data.output)
      } catch {
        return {}
      }
    })() : {
      "isValid": true,
      "confidence": 0.92,
      "checks": {
        "vendorExists": true,
        "amountValid": true,
        "dateValid": true,
        "budgetApproved": true
      },
      "timestamp": new Date().toISOString()
    })

    return (
      <div className="flex-1 overflow-hidden">
        <DataViewer
          data={outputData}
          mode="output"
          readOnly={isNodeRunning}
          onChange={(value) => onNodeUpdate({ ...node, data: { ...node.data, output: value } })}
        />
      </div>
    )
  }

  return null
}

function ModuleHeader({
  type,
  index,
  onModuleDragStart,
  actions,
}: {
  type: ModuleType
  index: number
  onModuleDragStart: (e: React.MouseEvent, index: number, type: ModuleType) => void
  actions?: React.ReactNode
}) {
  const colors = {
    code: "bg-chart-1",
    input: "bg-chart-4",
    output: "bg-chart-2",
  }
  const labels = {
    code: "Code",
    input: "Input",
    output: "Output",
  }

  return (
    <div className="flex h-8 items-center gap-2 border-b border-border bg-secondary/30 px-1 shrink-0">
      <div
        className="flex h-full cursor-grab items-center px-1 hover:bg-secondary active:cursor-grabbing"
        onMouseDown={(e) => onModuleDragStart(e, index, type)}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className={cn("h-2 w-2 rounded-full", colors[type])} />
      <span className="text-xs font-medium text-foreground">{labels[type]}</span>
      {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
    </div>
  )
}

function HorizontalLayout({
  node,
  onNodeUpdate,
  codePaneWidth,
  onResizeStart,
  inputOutputSplit,
  onInputOutputResizeStart,
  isMaximized,
  graphPaneHeight,
  moduleOrder,
  onModuleDragStart,
  draggingModule,
  dropTarget,
  isNodeRunning,
  mockConfig,
  simulationConfig,
  onMockConfigChange,
  onSimulationConfigChange,
  availableRuns,
  onShowRunHistory,
  runResult,
  getDummyInputData,
  showMockDialog,
  setShowMockDialog,
  showSimulationDialog,
  setShowSimulationDialog,
}: {
  node: WorkflowNode
  onNodeUpdate: (node: WorkflowNode) => void
  codePaneWidth: number
  onResizeStart: (e: React.MouseEvent) => void
  inputOutputSplit: number
  onInputOutputResizeStart: (e: React.MouseEvent) => void
  isMaximized: boolean
  graphPaneHeight: number
  moduleOrder: ModuleType[]
  onModuleDragStart: (e: React.MouseEvent, index: number, type: ModuleType) => void
  draggingModule: DraggingModule
  dropTarget: DropTarget
  isNodeRunning?: boolean
  mockConfig?: MockConfig
  simulationConfig?: SimulationConfig
  onMockConfigChange?: (config: MockConfig) => void
  onSimulationConfigChange?: (config: SimulationConfig) => void
  availableRuns?: ExecutionSpan[]
  onShowRunHistory?: () => void
  runResult?: Record<string, unknown> | null
  getDummyInputData?: () => Record<string, unknown>
  showMockDialog?: boolean
  setShowMockDialog?: (show: boolean) => void
  showSimulationDialog?: boolean
  setShowSimulationDialog?: (show: boolean) => void
}) {
  const [codeTab, setCodeTab] = useState<CodeModuleTab>("script")

  const contentHeight = isMaximized ? `${100 - graphPaneHeight}%` : "100%"

  // Get modules for each position based on moduleOrder
  const leftModule = moduleOrder[0]
  const topRightModule = moduleOrder[1]
  const bottomRightModule = moduleOrder[2]

  // Generate header actions
  const getModuleActions = (moduleType: ModuleType) => {
    if (moduleType === "input" && onShowRunHistory && availableRuns && availableRuns.length > 0) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 gap-1.5 text-xs"
          onClick={onShowRunHistory}
        >
          <History className="h-3 w-3" />
          History ({availableRuns.length})
        </Button>
      )
    }
    if (moduleType === "output" && mockConfig && simulationConfig && onMockConfigChange && onSimulationConfigChange) {
      return (
        <>
          <div className="flex items-center gap-1.5 px-2">
            <Database className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Mock</span>
            <Switch
              checked={mockConfig.enabled}
              onCheckedChange={(enabled) => {
                onMockConfigChange({ ...mockConfig, enabled })
                if (enabled && setShowMockDialog) setShowMockDialog(true)
              }}
              className="scale-75"
            />
          </div>
          <div className="flex items-center gap-1.5 px-2">
            <Wand2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Sim</span>
            <Switch
              checked={simulationConfig.enabled}
              onCheckedChange={(enabled) => {
                onSimulationConfigChange({ ...simulationConfig, enabled })
                if (enabled && setShowSimulationDialog) setShowSimulationDialog(true)
              }}
              className="scale-75"
            />
          </div>
        </>
      )
    }
    return null
  }

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: contentHeight }}>
      {/* Left panel - first module in order */}
      <div
        data-module-cell
        data-module-index={0}
        className={cn(
          "flex flex-col overflow-hidden transition-all",
          dropTarget?.index === 0 && "ring-2 ring-primary ring-inset",
          draggingModule?.index === 0 && "opacity-50"
        )}
        style={{ width: `${codePaneWidth}%` }}
      >
        <ModuleHeader
          type={leftModule}
          index={0}
          onModuleDragStart={onModuleDragStart}
          actions={getModuleActions(leftModule)}
        />
        <ModuleContent
          type={leftModule}
          node={node}
          onNodeUpdate={onNodeUpdate}
          codeTab={codeTab}
          setCodeTab={setCodeTab}
          isNodeRunning={isNodeRunning}
          mockConfig={mockConfig}
          simulationConfig={simulationConfig}
          onMockConfigChange={onMockConfigChange}
          onSimulationConfigChange={onSimulationConfigChange}
          availableRuns={availableRuns}
          onShowRunHistory={onShowRunHistory}
          runResult={runResult}
          getDummyInputData={getDummyInputData}
        />
      </div>

      <div className="w-1 cursor-ew-resize bg-border hover:bg-primary/50 active:bg-primary" onMouseDown={onResizeStart} />

      {/* Right panel - second and third modules */}
      <div data-io-pane className="flex flex-1 flex-col overflow-hidden">
        <div
          data-module-cell
          data-module-index={1}
          className={cn(
            "flex flex-col transition-all",
            dropTarget?.index === 1 && "ring-2 ring-primary ring-inset",
            draggingModule?.index === 1 && "opacity-50"
          )}
          style={{ height: `${inputOutputSplit}%` }}
        >
          <ModuleHeader
            type={topRightModule}
            index={1}
            onModuleDragStart={onModuleDragStart}
            actions={getModuleActions(topRightModule)}
          />
          <ModuleContent
            type={topRightModule}
            node={node}
            onNodeUpdate={onNodeUpdate}
            codeTab={codeTab}
            setCodeTab={setCodeTab}
            isNodeRunning={isNodeRunning}
            mockConfig={mockConfig}
            simulationConfig={simulationConfig}
            onMockConfigChange={onMockConfigChange}
            onSimulationConfigChange={onSimulationConfigChange}
            availableRuns={availableRuns}
            onShowRunHistory={onShowRunHistory}
            runResult={runResult}
            getDummyInputData={getDummyInputData}
          />
        </div>

        <div
          className="h-1 cursor-ns-resize bg-border hover:bg-primary/50 active:bg-primary shrink-0"
          onMouseDown={onInputOutputResizeStart}
        />

        <div
          data-module-cell
          data-module-index={2}
          className={cn(
            "flex flex-1 flex-col overflow-hidden transition-all",
            dropTarget?.index === 2 && "ring-2 ring-primary ring-inset",
            draggingModule?.index === 2 && "opacity-50"
          )}
        >
          <ModuleHeader
            type={bottomRightModule}
            index={2}
            onModuleDragStart={onModuleDragStart}
            actions={getModuleActions(bottomRightModule)}
          />
          <ModuleContent
            type={bottomRightModule}
            node={node}
            onNodeUpdate={onNodeUpdate}
            codeTab={codeTab}
            setCodeTab={setCodeTab}
            isNodeRunning={isNodeRunning}
            mockConfig={mockConfig}
            simulationConfig={simulationConfig}
            onMockConfigChange={onMockConfigChange}
            onSimulationConfigChange={onSimulationConfigChange}
            availableRuns={availableRuns}
            onShowRunHistory={onShowRunHistory}
            runResult={runResult}
            getDummyInputData={getDummyInputData}
          />
        </div>
      </div>

      {/* Mock Data Dialog */}
      {showMockDialog && setShowMockDialog && mockConfig && onMockConfigChange && (
        <Dialog open={showMockDialog} onOpenChange={setShowMockDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Mock Data Configuration
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto">
              <MockSimulationConfig
                mockConfig={mockConfig}
                simulationConfig={{ enabled: false, prompt: "" }}
                onMockConfigChange={onMockConfigChange}
                onSimulationConfigChange={() => {}}
                availableRuns={availableRuns || []}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Simulation Dialog */}
      {showSimulationDialog && setShowSimulationDialog && simulationConfig && onSimulationConfigChange && (
        <Dialog open={showSimulationDialog} onOpenChange={setShowSimulationDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Simulation Configuration
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto">
              <MockSimulationConfig
                mockConfig={{ enabled: false, source: "custom" }}
                simulationConfig={simulationConfig}
                onMockConfigChange={() => {}}
                onSimulationConfigChange={onSimulationConfigChange}
                availableRuns={availableRuns || []}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function VerticalLayout({
  node,
  onNodeUpdate,
  codePaneHeight,
  onResizeStart,
  inputOutputSplit,
  onInputOutputResizeStart,
  isMaximized,
  graphPaneHeight,
  moduleOrder,
  onModuleDragStart,
  draggingModule,
  dropTarget,
  isNodeRunning,
  mockConfig,
  simulationConfig,
  onMockConfigChange,
  onSimulationConfigChange,
  availableRuns,
  onShowRunHistory,
  runResult,
  getDummyInputData,
  showMockDialog,
  setShowMockDialog,
  showSimulationDialog,
  setShowSimulationDialog,
}: {
  node: WorkflowNode
  onNodeUpdate: (node: WorkflowNode) => void
  codePaneHeight: number
  onResizeStart: (e: React.MouseEvent) => void
  inputOutputSplit: number
  onInputOutputResizeStart: (e: React.MouseEvent) => void
  isMaximized: boolean
  graphPaneHeight: number
  moduleOrder: ModuleType[]
  onModuleDragStart: (e: React.MouseEvent, index: number, type: ModuleType) => void
  draggingModule: DraggingModule
  dropTarget: DropTarget
  isNodeRunning?: boolean
  mockConfig?: MockConfig
  simulationConfig?: SimulationConfig
  onMockConfigChange?: (config: MockConfig) => void
  onSimulationConfigChange?: (config: SimulationConfig) => void
  availableRuns?: ExecutionSpan[]
  onShowRunHistory?: () => void
  runResult?: Record<string, unknown> | null
  getDummyInputData?: () => Record<string, unknown>
  showMockDialog?: boolean
  setShowMockDialog?: (show: boolean) => void
  showSimulationDialog?: boolean
  setShowSimulationDialog?: (show: boolean) => void
}) {
  const [codeTab, setCodeTab] = useState<CodeModuleTab>("script")

  const contentHeight = isMaximized ? `${100 - graphPaneHeight}%` : "100%"

  // Get modules for each position based on moduleOrder
  const topModule = moduleOrder[0]
  const bottomLeftModule = moduleOrder[1]
  const bottomRightModule = moduleOrder[2]

  // Generate header actions
  const getModuleActions = (moduleType: ModuleType) => {
    if (moduleType === "input" && onShowRunHistory && availableRuns && availableRuns.length > 0) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 gap-1.5 text-xs"
          onClick={onShowRunHistory}
        >
          <History className="h-3 w-3" />
          History ({availableRuns.length})
        </Button>
      )
    }
    if (moduleType === "output" && mockConfig && simulationConfig && onMockConfigChange && onSimulationConfigChange) {
      return (
        <>
          <div className="flex items-center gap-1.5 px-2">
            <Database className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Mock</span>
            <Switch
              checked={mockConfig.enabled}
              onCheckedChange={(enabled) => {
                onMockConfigChange({ ...mockConfig, enabled })
                if (enabled && setShowMockDialog) setShowMockDialog(true)
              }}
              className="scale-75"
            />
          </div>
          <div className="flex items-center gap-1.5 px-2">
            <Wand2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Sim</span>
            <Switch
              checked={simulationConfig.enabled}
              onCheckedChange={(enabled) => {
                onSimulationConfigChange({ ...simulationConfig, enabled })
                if (enabled && setShowSimulationDialog) setShowSimulationDialog(true)
              }}
              className="scale-75"
            />
          </div>
        </>
      )
    }
    return null
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden" style={{ height: contentHeight }}>
      {/* Top panel - first module in order */}
      <div
        data-module-cell
        data-module-index={0}
        className={cn(
          "flex flex-col overflow-hidden transition-all",
          dropTarget?.index === 0 && "ring-2 ring-primary ring-inset",
          draggingModule?.index === 0 && "opacity-50"
        )}
        style={{ height: `${codePaneHeight}%` }}
      >
        <ModuleHeader
          type={topModule}
          index={0}
          onModuleDragStart={onModuleDragStart}
          actions={getModuleActions(topModule)}
        />
        <ModuleContent
          type={topModule}
          node={node}
          onNodeUpdate={onNodeUpdate}
          codeTab={codeTab}
          setCodeTab={setCodeTab}
          isNodeRunning={isNodeRunning}
          mockConfig={mockConfig}
          simulationConfig={simulationConfig}
          onMockConfigChange={onMockConfigChange}
          onSimulationConfigChange={onSimulationConfigChange}
          availableRuns={availableRuns}
          onShowRunHistory={onShowRunHistory}
          runResult={runResult}
          getDummyInputData={getDummyInputData}
        />
      </div>

      <div className="h-1 cursor-ns-resize bg-border hover:bg-primary/50 active:bg-primary" onMouseDown={onResizeStart} />

      {/* Bottom panel - second and third modules side by side */}
      <div data-io-pane className="flex flex-1 overflow-hidden">
        <div
          data-module-cell
          data-module-index={1}
          className={cn(
            "flex flex-1 flex-col transition-all",
            dropTarget?.index === 1 && "ring-2 ring-primary ring-inset",
            draggingModule?.index === 1 && "opacity-50"
          )}
          style={{ width: `${inputOutputSplit}%` }}
        >
          <ModuleHeader
            type={bottomLeftModule}
            index={1}
            onModuleDragStart={onModuleDragStart}
            actions={getModuleActions(bottomLeftModule)}
          />
          <ModuleContent
            type={bottomLeftModule}
            node={node}
            onNodeUpdate={onNodeUpdate}
            codeTab={codeTab}
            setCodeTab={setCodeTab}
            isNodeRunning={isNodeRunning}
            mockConfig={mockConfig}
            simulationConfig={simulationConfig}
            onMockConfigChange={onMockConfigChange}
            onSimulationConfigChange={onSimulationConfigChange}
            availableRuns={availableRuns}
            onShowRunHistory={onShowRunHistory}
            runResult={runResult}
            getDummyInputData={getDummyInputData}
          />
        </div>

        <div
          className="w-1 cursor-ew-resize bg-border hover:bg-primary/50 active:bg-primary shrink-0"
          onMouseDown={onInputOutputResizeStart}
        />

        <div
          data-module-cell
          data-module-index={2}
          className={cn(
            "flex flex-1 flex-col overflow-hidden transition-all",
            dropTarget?.index === 2 && "ring-2 ring-primary ring-inset",
            draggingModule?.index === 2 && "opacity-50"
          )}
        >
          <ModuleHeader
            type={bottomRightModule}
            index={2}
            onModuleDragStart={onModuleDragStart}
            actions={getModuleActions(bottomRightModule)}
          />
          <ModuleContent
            type={bottomRightModule}
            node={node}
            onNodeUpdate={onNodeUpdate}
            codeTab={codeTab}
            setCodeTab={setCodeTab}
            isNodeRunning={isNodeRunning}
            mockConfig={mockConfig}
            simulationConfig={simulationConfig}
            onMockConfigChange={onMockConfigChange}
            onSimulationConfigChange={onSimulationConfigChange}
            availableRuns={availableRuns}
            onShowRunHistory={onShowRunHistory}
            runResult={runResult}
            getDummyInputData={getDummyInputData}
          />
        </div>
      </div>

      {/* Mock Data Dialog */}
      {showMockDialog && setShowMockDialog && mockConfig && onMockConfigChange && (
        <Dialog open={showMockDialog} onOpenChange={setShowMockDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Mock Data Configuration
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto">
              <MockSimulationConfig
                mockConfig={mockConfig}
                simulationConfig={{ enabled: false, prompt: "" }}
                onMockConfigChange={onMockConfigChange}
                onSimulationConfigChange={() => {}}
                availableRuns={availableRuns || []}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Simulation Dialog */}
      {showSimulationDialog && setShowSimulationDialog && simulationConfig && onSimulationConfigChange && (
        <Dialog open={showSimulationDialog} onOpenChange={setShowSimulationDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Simulation Configuration
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto">
              <MockSimulationConfig
                mockConfig={{ enabled: false, source: "custom" }}
                simulationConfig={simulationConfig}
                onMockConfigChange={() => {}}
                onSimulationConfigChange={onSimulationConfigChange}
                availableRuns={availableRuns || []}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
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
  const [newVarName, setNewVarName] = useState("")
  const [newVarValue, setNewVarValue] = useState("")
  const [newVarType, setNewVarType] = useState<VariableType["type"]>("string")
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const variables = node.variables || []

  const handleAddVariable = () => {
    if (!newVarName.trim()) return
    const newVar: VariableType = {
      id: `var_${Date.now()}`,
      name: newVarName.trim(),
      value: newVarValue,
      type: newVarType,
    }
    onNodeUpdate({
      ...node,
      variables: [...variables, newVar],
    })
    setNewVarName("")
    setNewVarValue("")
    setNewVarType("string")
  }

  const handleDeleteVariable = (varId: string) => {
    onNodeUpdate({
      ...node,
      variables: variables.filter((v) => v.id !== varId),
    })
  }

  const handleUpdateVariable = (varId: string, updates: Partial<VariableType>) => {
    onNodeUpdate({
      ...node,
      variables: variables.map((v) => (v.id === varId ? { ...v, ...updates } : v)),
    })
  }

  const toggleShowSecret = (varId: string) => {
    setShowSecrets((prev) => ({ ...prev, [varId]: !prev[varId] }))
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Add Variable</h4>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  placeholder="VARIABLE_NAME"
                  className="mt-1 h-8 bg-background"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <select
                  value={newVarType}
                  onChange={(e) => setNewVarType(e.target.value as VariableType["type"])}
                  className="mt-1 w-full h-8 rounded-md border border-border bg-background px-2 text-sm"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="secret">Secret</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Value</Label>
              <Input
                value={newVarValue}
                onChange={(e) => setNewVarValue(e.target.value)}
                placeholder="Enter value"
                type={newVarType === "secret" ? "password" : "text"}
                className="mt-1 h-8 bg-background"
              />
            </div>
            <Button size="sm" onClick={handleAddVariable} className="w-full gap-2">
              <Plus className="h-3.5 w-3.5" />
              Add Variable
            </Button>
          </div>
        </div>

        {variables.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Variables ({variables.length})</h4>
            {variables.map((variable) => (
              <div
                key={variable.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <Input
                    value={variable.name}
                    onChange={(e) => handleUpdateVariable(variable.id, { name: e.target.value })}
                    className="h-7 text-xs bg-secondary/50"
                  />
                  <div className="relative">
                    <Input
                      value={variable.value}
                      onChange={(e) => handleUpdateVariable(variable.id, { value: e.target.value })}
                      type={variable.type === "secret" && !showSecrets[variable.id] ? "password" : "text"}
                      className="h-7 text-xs bg-secondary/50 pr-8"
                    />
                    {variable.type === "secret" && (
                      <button
                        onClick={() => toggleShowSecret(variable.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSecrets[variable.id] ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
                        variable.type === "string" && "bg-blue-500/10 text-blue-500",
                        variable.type === "number" && "bg-purple-500/10 text-purple-500",
                        variable.type === "boolean" && "bg-orange-500/10 text-orange-500",
                        variable.type === "secret" && "bg-red-500/10 text-red-500",
                      )}
                    >
                      {variable.type}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive ml-auto"
                      onClick={() => handleDeleteVariable(variable.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {variables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Variable className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No variables defined</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Add variables to store configuration values for this node
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
