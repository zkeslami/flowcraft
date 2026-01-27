"use client"

import { useState, useCallback, useEffect } from "react"
import { EnhancedWorkflowCanvasV8 } from "./workflow/enhanced-workflow-canvas-v8"
import { PropertiesPanelV7 } from "./workflow/properties-panel-v7"
import { WorkflowPropertiesPanel } from "./workflow/workflow-properties-panel"
import { CollapsedPanelBar } from "./workflow/collapsed-panel-bar"
import { AISidebarV5 } from "./workflow/ai-sidebar-v5"
import { WorkflowTabs } from "./workflow/workflow-tabs"
import { CanvasToolbar } from "./workflow/canvas-toolbar"
import { RunHistoryPanel } from "./workflow/run-history-panel"
import { SpansList } from "./workflow/spans-list"
import { SpanDetails } from "./workflow/span-details"
import type { WorkflowNode, Connection, WorkflowMetadata, Variable, NodeExecutionStatus } from "@/lib/workflow-types"
import { cn } from "@/lib/utils"
import { Circle, GitBranch, AlertTriangle, CheckCircle2, Clock, Zap, History } from "lucide-react"
import { mockExecutionHistory, executionMap, currentExecution } from "@/lib/mock-execution-data"

interface WorkflowDesignerV8Props {
  onBack: () => void
}

interface WorkflowTabData {
  id: string
  name: string
  isDirty?: boolean
}

interface MinimizedNodesState {
  [key: string]: boolean
}

const initialNodes: WorkflowNode[] = [
  {
    id: "1",
    type: "trigger",
    label: "Invoice Received",
    position: { x: 100, y: 150 },
    data: {
      method: "POST",
      path: "/api/invoices/incoming",
      code: `// Triggered when new invoice arrives
// Supports PDF, image, or structured data
// Auto-extracts metadata on receipt`,
      input: `{
  "source": "email",
  "attachments": ["invoice.pdf"]
}`,
      output: `{
  "invoiceId": "INV-2024-001",
  "rawData": "..."
}`,
    },
    variables: [],
  },
  {
    id: "2",
    type: "function",
    label: "Extract Invoice Data",
    position: { x: 420, y: 100 },
    data: {
      runtime: "Node.js",
      code: `// OCR and data extraction
const extracted = await ocr.extract(invoice.pdf)
const fields = parseInvoiceFields(extracted)

return {
  vendor: fields.vendor,
  amount: fields.total,
  dueDate: fields.dueDate,
  lineItems: fields.items
}`,
      input: `{
  "invoiceId": "INV-2024-001"
}`,
      output: `{
  "vendor": "Acme Corp",
  "amount": 1250.00
}`,
    },
    variables: [],
  },
  {
    id: "3",
    type: "agent",
    label: "Validate Invoice",
    position: { x: 750, y: 100 },
    data: {
      agentHealth: 94,
      evaluationsRun: 1247,
      currentLLM: "GPT-4o",
      context: ["Invoice Schema", "Vendor Database", "Payment Terms", "Historical Data"],
      tools: ["OCR Extract", "Amount Validator", "Date Parser", "Vendor Lookup", "Duplicate Check"],
      code: `// AI Agent validates invoice data
// Checks for anomalies and fraud patterns
// Cross-references vendor database`,
      input: `{
  "extracted": {...}
}`,
      output: `{
  "isValid": true,
  "confidence": 0.96
}`,
    },
    variables: [],
  },
  {
    id: "4",
    type: "condition",
    label: "Validation Check",
    position: { x: 1100, y: 100 },
    data: {
      condition: "validation.isValid && validation.confidence > 0.9",
      code: `if (validation.isValid && confidence > 0.9) {
  // Route to approval
} else {
  // Flag for manual review
}`,
      input: `{
  "isValid": true,
  "confidence": 0.96
}`,
      output: `{
  "route": "approved"
}`,
    },
    variables: [],
  },
  {
    id: "5",
    type: "action",
    label: "Auto Approve",
    position: { x: 1400, y: 50 },
    data: {
      service: "Accounting System",
      code: `// Send to accounting for payment
await accounting.createPayable({
  vendor: invoice.vendor,
  amount: invoice.amount,
  dueDate: invoice.dueDate
})`,
      input: `{}`,
      output: `{}`,
    },
    variables: [],
  },
  {
    id: "6",
    type: "action",
    label: "Manual Review",
    position: { x: 1400, y: 200 },
    data: {
      service: "Review Queue",
      code: `// Flag for human review
await reviewQueue.add({
  invoiceId: invoice.id,
  reason: validation.issues,
  priority: "high"
})`,
      input: `{}`,
      output: `{}`,
    },
    variables: [],
  },
]

const initialConnections: Connection[] = [
  { id: "c1", from: "1", to: "2", fromPort: "output", toPort: "input" },
  { id: "c2", from: "2", to: "3", fromPort: "output", toPort: "input" },
  { id: "c3", from: "3", to: "4", fromPort: "output", toPort: "input" },
  { id: "c4", from: "4", to: "5", fromPort: "true", toPort: "input" },
  { id: "c5", from: "4", to: "6", fromPort: "false", toPort: "input" },
]

const initialMetadata: WorkflowMetadata = {
  id: "wf_invoice_001",
  name: "Invoice Processing",
  description: "Automated invoice processing with AI validation agent for fraud detection and approval routing.",
  version: "2.1.0",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
  author: "finance-team@example.com",
  tags: ["invoices", "finance", "ai-agent", "automation"],
}

const initialWorkflowVariables: Variable[] = [
  { id: "wv1", name: "CONFIDENCE_THRESHOLD", value: "0.9", type: "number" },
  { id: "wv2", name: "AUTO_APPROVE_LIMIT", value: "5000", type: "number" },
  { id: "wv3", name: "ACCOUNTING_API_KEY", value: "sk-****", type: "secret" },
]

const initialTabs: WorkflowTabData[] = [
  { id: "tab1", name: "Invoice Processing.flow", isDirty: true },
  { id: "tab2", name: "Vendor Onboarding.flow", isDirty: false },
  { id: "tab3", name: "Payment Reconciliation.flow", isDirty: false },
]

const initialMinimizedNodes: MinimizedNodesState = {
  "1": false,
  "2": false,
  "3": false,
  "4": false,
  "5": false,
  "6": false,
}

export function WorkflowDesignerV8({ onBack }: WorkflowDesignerV8Props) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes)
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [isPanelMaximized, setIsPanelMaximized] = useState(false)
  const [panelWidth, setPanelWidth] = useState(50)
  const [metadata, setMetadata] = useState<WorkflowMetadata>(initialMetadata)
  const [workflowVariables, setWorkflowVariables] = useState<Variable[]>(initialWorkflowVariables)
  const [nodeExecutionStatuses, setNodeExecutionStatuses] = useState<Record<string, NodeExecutionStatus>>({})
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false)
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPaused, setIsPaused] = useState(false)
  const [workflowPanelTab, setWorkflowPanelTab] = useState<"properties" | "variables">("properties")
  const [canvasViewMode, setCanvasViewMode] = useState<"collapsed" | "expanded" | "visual">("expanded")

  const [tabs, setTabs] = useState<WorkflowTabData[]>(initialTabs)
  const [activeTabId, setActiveTabId] = useState("tab1")
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>("")
  const [tracePanelHeight, setTracePanelHeight] = useState(320)
  const [isResizingTracePanel, setIsResizingTracePanel] = useState(false)

  // Trace panel is open if and only if runs tab is active
  const isTracePanelOpen = activeSidebarTab === "runs"

  // Execution tracking state
  const initialRunId = mockExecutionHistory[0]?.id
  const initialExecution = initialRunId ? executionMap[initialRunId] : null
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(initialRunId)
  const [selectedSpanId, setSelectedSpanId] = useState<string | undefined>(
    initialExecution && initialExecution.spans.length > 0 ? initialExecution.spans[0].id : undefined
  )
  const [traceViewMode, setTraceViewMode] = useState<'list' | 'timeline'>('list')
  const [traceSplitPosition, setTraceSplitPosition] = useState(33) // percentage
  const [isResizingTraceSplit, setIsResizingTraceSplit] = useState(false)

  const handleNodeSelect = useCallback((node: WorkflowNode | null) => {
    setSelectedNode(node)
  }, [])

  const handleNodeDoubleClick = useCallback((node: WorkflowNode) => {
    setSelectedNode(node)
    setIsPanelOpen(true)
    setIsPanelCollapsed(false)
  }, [])

  const handleNodePositionChange = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, position } : node)))
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, position } : prev))
  }, [])

  const handleTidyUp = useCallback((currentViewMode: "collapsed" | "expanded" | "visual" = "expanded") => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const levels: string[][] = []
    const visited = new Set<string>()

    const incomingCount = new Map<string, number>()
    nodes.forEach((n) => incomingCount.set(n.id, 0))
    connections.forEach((c) => {
      incomingCount.set(c.to, (incomingCount.get(c.to) || 0) + 1)
    })

    const roots = nodes.filter((n) => incomingCount.get(n.id) === 0 || n.type === "trigger")

    const queue = roots.map((r) => ({ id: r.id, level: 0 }))
    while (queue.length > 0) {
      const { id, level } = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)

      if (!levels[level]) levels[level] = []
      levels[level].push(id)

      const outgoing = connections.filter((c) => c.from === id)
      outgoing.forEach((c) => {
        if (!visited.has(c.to)) {
          queue.push({ id: c.to, level: level + 1 })
        }
      })
    }

    // Adjust gap based on view mode - visual mode uses tighter spacing (80px between nodes)
    const xGap = currentViewMode === "visual" ? 170 : 336  // visual: 90 width + 80px gap, expanded: 300 + 36px gap
    const yGap = currentViewMode === "visual" ? 100 : 100
    const startX = 100
    const startY = 100

    setNodes((prev) =>
      prev.map((node) => {
        let levelIndex = -1
        let posInLevel = -1
        levels.forEach((level, li) => {
          const pi = level.indexOf(node.id)
          if (pi !== -1) {
            levelIndex = li
            posInLevel = pi
          }
        })

        if (levelIndex !== -1) {
          return {
            ...node,
            position: {
              x: startX + levelIndex * xGap,
              y: startY + posInLevel * yGap,
            },
          }
        }
        return node
      }),
    )
  }, [nodes, connections])

  const handleNodeUpdate = useCallback((updatedNode: WorkflowNode) => {
    setNodes((prev) => prev.map((n) => (n.id === updatedNode.id ? updatedNode : n)))
    setSelectedNode(updatedNode)
  }, [])

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false)
    setIsPanelCollapsed(false)
    setIsPanelMaximized(false)
    setSelectedNode(null)
  }, [])

  const handleCollapsePanel = useCallback(() => {
    setIsPanelCollapsed(true)
  }, [])

  const handleExpandFromCollapsed = useCallback(() => {
    setIsPanelCollapsed(false)
    setIsPanelOpen(true)
  }, [])

  const handleTogglePanelMaximize = useCallback(() => {
    setIsPanelMaximized((prev) => !prev)
  }, [])

  const handleCanvasClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const runSingleNode = useCallback(async (nodeId: string) => {
    setNodeExecutionStatuses((prev) => ({ ...prev, [nodeId]: "running" }))
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700))
    const success = Math.random() > 0.1
    setNodeExecutionStatuses((prev) => ({ ...prev, [nodeId]: success ? "completed" : "failed" }))
    return success
  }, [])

  const runWorkflow = useCallback(async () => {
    if (isWorkflowRunning) return
    setIsWorkflowRunning(true)
    setNodeExecutionStatuses({})
    const executionOrder = nodes.map((n) => n.id)
    for (const nodeId of executionOrder) {
      const success = await runSingleNode(nodeId)
      if (!success) break
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
    setIsWorkflowRunning(false)
    setTimeout(() => setNodeExecutionStatuses({}), 3000)
  }, [isWorkflowRunning, runSingleNode, nodes])

  const runSelectedNode = useCallback(async () => {
    if (!selectedNode || isWorkflowRunning) return
    setIsWorkflowRunning(true)
    setNodeExecutionStatuses({})
    await runSingleNode(selectedNode.id)
    setIsWorkflowRunning(false)
    setTimeout(() => setNodeExecutionStatuses({}), 3000)
  }, [selectedNode, isWorkflowRunning, runSingleNode])

  const handleRunNode = useCallback(
    async (nodeId: string) => {
      if (isWorkflowRunning) return
      setIsWorkflowRunning(true)
      setNodeExecutionStatuses({})
      await runSingleNode(nodeId)
      setIsWorkflowRunning(false)
      setTimeout(() => setNodeExecutionStatuses({}), 3000)
    },
    [isWorkflowRunning, runSingleNode],
  )

  const handleAddNode = useCallback((type: WorkflowNode["type"], label: string) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type,
      label,
      position: { x: 200 + Math.random() * 200, y: 150 + Math.random() * 100 },
      data: {
        code: `// ${label} code here`,
        input: "{}",
        output: "{}",
      },
      variables: [],
    }
    setNodes((prev) => [...prev, newNode])
    setSelectedNode(newNode)
  }, [])

  const handleAddNodeAfter = useCallback(
    (nodeId: string) => {
      const sourceNode = nodes.find((n) => n.id === nodeId)
      if (!sourceNode) return

      const newNode: WorkflowNode = {
        id: `node_${Date.now()}`,
        type: "function",
        label: "New Node",
        position: {
          x: sourceNode.position.x + 320,
          y: sourceNode.position.y,
        },
        data: {
          code: `// New node code here`,
          input: "{}",
          output: "{}",
        },
        variables: [],
      }
      setNodes((prev) => [...prev, newNode])
      const newConnection: Connection = {
        id: `conn_${Date.now()}`,
        from: nodeId,
        to: newNode.id,
        fromPort: "output",
        toPort: "input",
      }
      setConnections((prev) => [...prev, newConnection])
      setSelectedNode(newNode)
    },
    [nodes],
  )

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId))
      setConnections((prev) => prev.filter((c) => c.from !== nodeId && c.to !== nodeId))
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null)
      }
    },
    [selectedNode],
  )

  const handleConnectNodes = useCallback((fromId: string, toId: string) => {
    const newConnection: Connection = {
      id: `conn_${Date.now()}`,
      from: fromId,
      to: toId,
      fromPort: "output",
      toPort: "input",
    }
    setConnections((prev) => [...prev, newConnection])
  }, [])

  const handleUpdateNodeCode = useCallback(
    (nodeId: string, code: string) => {
      setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, code } } : n)))
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, code } } : null))
      }
    },
    [selectedNode],
  )

  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const handleTabClose = useCallback(
    (tabId: string) => {
      if (tabs.length === 1) return
      setTabs((prev) => prev.filter((t) => t.id !== tabId))
      if (activeTabId === tabId) {
        const remainingTabs = tabs.filter((t) => t.id !== tabId)
        setActiveTabId(remainingTabs[0]?.id || "")
      }
    },
    [tabs, activeTabId],
  )

  const handleTabAdd = useCallback(() => {
    const newTab: WorkflowTabData = {
      id: `tab_${Date.now()}`,
      name: `New Workflow.flow`,
      isDirty: false,
    }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [])

  const handleStop = useCallback(() => {
    setIsWorkflowRunning(false)
    setIsPaused(false)
    setNodeExecutionStatuses({})
  }, [])

  const handlePause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const handleStepForward = useCallback(async () => {
    if (!isPaused) return
    const pendingNodes = nodes.filter((n) => !nodeExecutionStatuses[n.id] || nodeExecutionStatuses[n.id] === "pending")
    if (pendingNodes.length > 0) {
      await runSingleNode(pendingNodes[0].id)
    }
  }, [isPaused, nodes, nodeExecutionStatuses, runSingleNode])

  const handleReset = useCallback(() => {
    setNodeExecutionStatuses({})
    setIsWorkflowRunning(false)
    setIsPaused(false)
  }, [])

  const handleTest = useCallback(() => {
    setIsPaused(true)
    runWorkflow()
    // Switch to runs tab (this automatically opens trace panel)
    setActiveSidebarTab("runs")
    // Select the current running execution and its first span
    setSelectedRunId("exec-current")
    const currentExec = executionMap["exec-current"]
    if (currentExec && currentExec.spans.length > 0) {
      setSelectedSpanId(currentExec.spans[0].id)
    } else {
      setSelectedSpanId(undefined)
    }
  }, [runWorkflow])

  const handleSidebarTabChange = useCallback((tab: string) => {
    // Toggle behavior: if clicking the same tab, deactivate it
    if (activeSidebarTab === tab) {
      setActiveSidebarTab("")
      return
    }

    setActiveSidebarTab(tab)

    // When switching to runs tab, ensure first span is selected if a run is selected
    if (tab === "runs" && selectedRunId) {
      const execution = executionMap[selectedRunId]
      if (execution && execution.spans.length > 0 && !selectedSpanId) {
        setSelectedSpanId(execution.spans[0].id)
      }
    }
  }, [activeSidebarTab, selectedRunId, selectedSpanId])

  const handleSelectRun = useCallback((runId: string) => {
    setSelectedRunId(runId)
    // Auto-select the first span when a run is selected
    const execution = executionMap[runId]
    if (execution && execution.spans.length > 0) {
      setSelectedSpanId(execution.spans[0].id)
    } else {
      setSelectedSpanId(undefined)
    }
  }, [])

  const handleSelectSpan = useCallback((spanId: string) => {
    setSelectedSpanId(spanId)
  }, [])

  // Get the selected execution data
  const selectedExecution = selectedRunId ? executionMap[selectedRunId] || null : null

  // Find span recursively (including children)
  const findSpan = (spans: typeof selectedExecution extends null ? never : typeof selectedExecution['spans'], spanId: string): typeof spans[0] | null => {
    if (!spans) return null
    for (const span of spans) {
      if (span.id === spanId) return span
      if (span.children) {
        const found = findSpan(span.children, spanId)
        if (found) return found
      }
    }
    return null
  }

  const selectedSpan = selectedSpanId && selectedExecution
    ? findSpan(selectedExecution.spans, selectedSpanId)
    : null

  // Map ExecutionStatus to NodeExecutionStatus
  const mapExecutionStatusToNodeStatus = (status: string): NodeExecutionStatus => {
    switch (status) {
      case 'success':
        return 'completed'
      case 'error':
        return 'failed'
      case 'pending':
        return 'idle'
      case 'running':
        return 'running'
      default:
        return 'idle'
    }
  }

  // Compute node execution statuses from selected execution
  const computedNodeStatuses: Record<string, NodeExecutionStatus> = {}
  if (selectedExecution && activeSidebarTab === "runs" && isTracePanelOpen) {
    // Map execution spans to node statuses
    selectedExecution.spans.forEach((span) => {
      computedNodeStatuses[span.nodeId] = mapExecutionStatusToNodeStatus(span.status)
    })
  }

  // Use computed statuses when viewing runs (and trace panel is open), otherwise use the runtime statuses
  const displayedNodeStatuses = (activeSidebarTab === "runs" && isTracePanelOpen) ? computedNodeStatuses : nodeExecutionStatuses

  // Trace panel vertical resize handlers
  const handleTracePanelResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingTracePanel(true)
  }, [])

  // Trace split horizontal resize handlers
  const handleTraceSplitResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingTraceSplit(true)
  }, [])

  useEffect(() => {
    if (!isResizingTracePanel) return

    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight
      const newHeight = windowHeight - e.clientY - 28 // 28px for status bar
      const clampedHeight = Math.max(100, Math.min(600, newHeight))
      setTracePanelHeight(clampedHeight)
    }

    const handleMouseUp = () => {
      setIsResizingTracePanel(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizingTracePanel])

  // Trace split resize effect
  useEffect(() => {
    if (!isResizingTraceSplit) return

    const handleMouseMove = (e: MouseEvent) => {
      const tracePanelElement = document.getElementById('trace-panel-content')
      if (!tracePanelElement) return

      const rect = tracePanelElement.getBoundingClientRect()
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100
      const clampedPosition = Math.max(20, Math.min(80, newPosition))
      setTraceSplitPosition(clampedPosition)
    }

    const handleMouseUp = () => {
      setIsResizingTraceSplit(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizingTraceSplit])

  // When maximized, panel takes full width
  const canvasWidth = isPanelMaximized ? "0%" : isPanelOpen && !isPanelCollapsed ? `${100 - panelWidth}%` : "100%"
  const showCollapsedBar = !isPanelOpen || isPanelCollapsed
  const showCanvas = !isPanelMaximized

  const tabsWithActive = tabs.map((t) => ({ ...t, isActive: t.id === activeTabId }))

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="relative flex flex-1 overflow-hidden">
        <AISidebarV5
          nodes={nodes}
          connections={connections}
          selectedNode={selectedNode}
          onNodeSelect={handleNodeSelect}
          onAddNode={handleAddNode}
          onConnectNodes={handleConnectNodes}
          onUpdateNodeCode={handleUpdateNodeCode}
          onBack={onBack}
          onTabChange={handleSidebarTabChange}
          executionHistory={mockExecutionHistory}
          selectedRunId={selectedRunId}
          onSelectRun={handleSelectRun}
        />

        {/* Main content area with tabs */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* Remove the onBack prop from WorkflowTabs - use logo in sidebar instead */}
          <WorkflowTabs
            tabs={tabsWithActive}
            onTabSelect={handleTabSelect}
            onTabClose={handleTabClose}
            onTabAdd={handleTabAdd}
          />

          <div className="relative flex flex-1 overflow-hidden">
            {showCanvas && (
              <div className="relative h-full transition-all duration-300 ease-in-out" style={{ width: canvasWidth }}>
                <EnhancedWorkflowCanvasV8
                  nodes={nodes}
                  connections={connections}
                  selectedNode={selectedNode}
                  onNodeSelect={handleNodeSelect}
                  onNodeDoubleClick={handleNodeDoubleClick}
                  onTidyUp={handleTidyUp}
                  isPanelOpen={isPanelOpen && !isPanelCollapsed}
                  onCanvasClick={handleCanvasClick}
                  nodeExecutionStatuses={displayedNodeStatuses}
                  onTransformChange={setCanvasTransform}
                  onViewModeChange={setCanvasViewMode}
                  onRunNode={handleRunNode}
                  onAddNodeAfter={handleAddNodeAfter}
                  onDeleteNode={handleDeleteNode}
                  onNodePositionChange={handleNodePositionChange}
                  isRunning={isWorkflowRunning}
                  showExecutionIndicators={activeSidebarTab === "runs" && isTracePanelOpen}
                  startNodeId="1"
                  finishNodeId="5"
                />

                {showCollapsedBar && (
                  <CollapsedPanelBar
                    title={metadata.name}
                    subtitle="Workflow"
                    nodeType={undefined}
                    onExpand={handleExpandFromCollapsed}
                    onClose={handleClosePanel}
                    showTabControl={true}
                    activeTab={workflowPanelTab}
                    onTabChange={(tab) => {
                      setWorkflowPanelTab(tab)
                      setSelectedNode(null)
                      setIsPanelOpen(true)
                      setIsPanelCollapsed(false)
                    }}
                  />
                )}
              </div>
            )}

            {isPanelOpen && !isPanelCollapsed && selectedNode && (
              <div
                className={cn("h-full flex-shrink-0", isPanelMaximized && "flex-1")}
                style={{ width: isPanelMaximized ? "100%" : `${panelWidth}%` }}
              >
                <PropertiesPanelV7
                  node={selectedNode}
                  onClose={handleClosePanel}
                  onNodeUpdate={handleNodeUpdate}
                  width={panelWidth}
                  onWidthChange={setPanelWidth}
                  onRunNode={runSelectedNode}
                  isRunning={isWorkflowRunning}
                  nodeExecutionStatus={displayedNodeStatuses[selectedNode.id]}
                  isMaximized={isPanelMaximized}
                  onToggleMaximize={handleTogglePanelMaximize}
                  nodes={nodes}
                  connections={connections}
                  onNodeSelect={handleNodeSelect}
                  nodeExecutionStatuses={displayedNodeStatuses}
                  canvasViewMode={canvasViewMode}
                />
              </div>
            )}

            {isPanelOpen && !isPanelCollapsed && !selectedNode && (
              <WorkflowPropertiesPanel
                nodes={nodes}
                connections={connections}
                metadata={metadata}
                onMetadataUpdate={setMetadata}
                workflowVariables={workflowVariables}
                onWorkflowVariablesUpdate={setWorkflowVariables}
                onClose={handleClosePanel}
                onCollapse={handleCollapsePanel}
                width={panelWidth}
                onWidthChange={setPanelWidth}
                onRunWorkflow={runWorkflow}
                isRunning={isWorkflowRunning}
              />
            )}

            {/* Centered Canvas Toolbar */}
            {showCanvas && (
              <div className="absolute bottom-6 left-0 z-30 flex justify-center pointer-events-none" style={{ width: canvasWidth }}>
                <div className="pointer-events-auto">
                  <CanvasToolbar
                    isRunning={isWorkflowRunning}
                    isPaused={isPaused}
                    onRun={selectedNode ? runSelectedNode : runWorkflow}
                    onStop={handleStop}
                    onPause={handlePause}
                    onStepForward={handleStepForward}
                    onReset={handleReset}
                    onTest={handleTest}
                    hasSelectedNode={!!selectedNode}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Trace Panel - shown when runs tab is active */}
          {isTracePanelOpen && (
            <div className="relative flex-shrink-0 border-t border-zinc-800 bg-[#0a0a0b]" style={{ height: `${tracePanelHeight}px` }}>
              {/* Resize Handle */}
              <div
                className={cn(
                  "absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-primary/50 transition-colors z-40",
                  isResizingTracePanel && "bg-primary"
                )}
                onMouseDown={handleTracePanelResizeStart}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-800" />
              </div>

              {selectedExecution ? (
                <div id="trace-panel-content" className="flex h-full pt-1">
                  {/* Spans List - Left Side */}
                  <div className="border-r border-zinc-800" style={{ width: `${traceSplitPosition}%` }}>
                    <SpansList
                      spans={selectedExecution.spans}
                      selectedSpanId={selectedSpanId}
                      onSelectSpan={handleSelectSpan}
                      viewMode={traceViewMode}
                      onViewModeChange={setTraceViewMode}
                    />
                  </div>

                  {/* Resize Handle */}
                  <div
                    className={cn(
                      "relative w-1 cursor-col-resize hover:bg-primary/50 transition-colors flex-shrink-0",
                      isResizingTraceSplit && "bg-primary"
                    )}
                    onMouseDown={handleTraceSplitResizeStart}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-1 bg-zinc-700" />
                  </div>

                  {/* Span Details - Right Side */}
                  <div className="flex-1 overflow-hidden">
                    <SpanDetails
                      span={selectedSpan}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-500 pt-2">
                  <div className="text-center">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Select a run to view trace</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Strip */}
          <div className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-[#0f1114] px-3 text-xs">
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-1.5">
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                <span className="text-muted-foreground">Connected</span>
              </div>
              
              {/* Workflow Stats */}
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {nodes.length} nodes
                </span>
                <span className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {connections.length} connections
                </span>
              </div>
              
              {/* Execution Status */}
              {activeSidebarTab === "runs" && isTracePanelOpen && selectedExecution ? (
                selectedExecution.status === "running" ? (
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <Clock className="h-3 w-3 animate-pulse" />
                    <span>Running: {selectedExecution.summary.completedNodes} / {selectedExecution.summary.totalNodes} nodes</span>
                  </div>
                ) : selectedExecution.status === "error" ? (
                  <div className="flex items-center gap-1.5 text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Failed: {selectedExecution.summary.failedNodes} errors</span>
                  </div>
                ) : selectedExecution.status === "success" ? (
                  <div className="flex items-center gap-1.5 text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Completed: {selectedExecution.summary.completedNodes} nodes</span>
                  </div>
                ) : null
              ) : isWorkflowRunning ? (
                <div className="flex items-center gap-1.5 text-primary">
                  <Clock className="h-3 w-3 animate-pulse" />
                  <span>Running...</span>
                </div>
              ) : Object.values(nodeExecutionStatuses).some(s => s === "failed") ? (
                <div className="flex items-center gap-1.5 text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Errors detected</span>
                </div>
              ) : Object.values(nodeExecutionStatuses).some(s => s === "completed") ? (
                <div className="flex items-center gap-1.5 text-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Last run completed</span>
                </div>
              ) : null}
            </div>
            
            <div className="flex items-center gap-4 text-muted-foreground">
              {/* Zoom Level */}
              <span>{Math.round(canvasTransform.scale * 100)}%</span>
              
              {/* View Mode */}
              <span className="capitalize">{canvasViewMode} view</span>
              
              {/* Version/Branch */}
              <span>main</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
