"use client"

import { useState, useCallback } from "react"
import { EnhancedWorkflowCanvasV7 } from "./workflow/enhanced-workflow-canvas-v7"
import { PropertiesPanelV7 } from "./workflow/properties-panel-v7"
import { WorkflowPropertiesPanel } from "./workflow/workflow-properties-panel"
import { CollapsedPanelBar } from "./workflow/collapsed-panel-bar"
import { AISidebarV5 } from "./workflow/ai-sidebar-v5"
import { WorkflowTabs } from "./workflow/workflow-tabs"
import { CanvasToolbar } from "./workflow/canvas-toolbar"
import type { WorkflowNode, Connection, WorkflowMetadata, Variable, NodeExecutionStatus } from "@/lib/workflow-types"
import { cn } from "@/lib/utils"

interface WorkflowDesignerV7Props {
  onBack: () => void
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

interface WorkflowTabData {
  id: string
  name: string
  isDirty?: boolean
}

const initialTabs: WorkflowTabData[] = [
  { id: "tab1", name: "Invoice Processing.flow", isDirty: true },
  { id: "tab2", name: "Vendor Onboarding.flow", isDirty: false },
  { id: "tab3", name: "Payment Reconciliation.flow", isDirty: false },
]

export function WorkflowDesignerV7({ onBack }: WorkflowDesignerV7Props) {
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
  const [minimizedNodes, setMinimizedNodes] = useState<Set<string>>(new Set())
  const [isPaused, setIsPaused] = useState(false)
  const [workflowPanelTab, setWorkflowPanelTab] = useState<"properties" | "variables">("properties")

  const [tabs, setTabs] = useState<WorkflowTabData[]>(initialTabs)
  const [activeTabId, setActiveTabId] = useState("tab1")

  const allMinimized = minimizedNodes.size === nodes.length && nodes.length > 0

  const handleNodeSelect = useCallback((node: WorkflowNode | null) => {
    setSelectedNode(node)
  }, [])

  const handleNodeDoubleClick = useCallback((node: WorkflowNode) => {
    setSelectedNode(node)
    setIsPanelOpen(true)
    setIsPanelCollapsed(false)
  }, [])

  const handleToggleNodeMinimize = useCallback((nodeId: string) => {
    setMinimizedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const handleMinimizeAll = useCallback(() => {
    setMinimizedNodes(new Set(nodes.map((n) => n.id)))
  }, [nodes])

  const handleMaximizeAll = useCallback(() => {
    setMinimizedNodes(new Set())
  }, [])

  const handleNodePositionChange = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, position } : node)))
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, position } : prev))
  }, [])

  const handleTidyUp = useCallback(() => {
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

    const xGap = 336  // node width (300) + 36px gap
    const yGap = 100
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
  }, [runWorkflow])

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
              <div className="h-full transition-all duration-300 ease-in-out" style={{ width: canvasWidth }}>
                <EnhancedWorkflowCanvasV7
                  nodes={nodes}
                  connections={connections}
                  selectedNode={selectedNode}
                  minimizedNodes={minimizedNodes}
                  onNodeSelect={handleNodeSelect}
                  onNodeDoubleClick={handleNodeDoubleClick}
                  onToggleNodeMinimize={handleToggleNodeMinimize}
                  onMinimizeAll={handleMinimizeAll}
                  onMaximizeAll={handleMaximizeAll}
                  allMinimized={allMinimized}
                  onTidyUp={handleTidyUp}
                  isPanelOpen={isPanelOpen && !isPanelCollapsed}
                  onCanvasClick={handleCanvasClick}
                  nodeExecutionStatuses={nodeExecutionStatuses}
                  onTransformChange={setCanvasTransform}
                  onRunNode={handleRunNode}
                  onAddNodeAfter={handleAddNodeAfter}
                  onDeleteNode={handleDeleteNode}
                  onNodePositionChange={handleNodePositionChange}
                  isRunning={isWorkflowRunning}
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
                  nodeExecutionStatus={nodeExecutionStatuses[selectedNode.id]}
                  isMaximized={isPanelMaximized}
                  onToggleMaximize={handleTogglePanelMaximize}
                  nodes={nodes}
                  connections={connections}
                  onNodeSelect={handleNodeSelect}
                  nodeExecutionStatuses={nodeExecutionStatuses}
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
          </div>
        </div>
      </div>
    </div>
  )
}
