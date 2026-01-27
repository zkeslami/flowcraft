"use client"

import { useState, useCallback } from "react"
import { WorkflowCanvas } from "./workflow/workflow-canvas"
import { InlineNodePopover } from "./workflow/inline-node-popover"
import { CollapsedPanelBar } from "./workflow/collapsed-panel-bar"
import { QuadrantEditor } from "./workflow/quadrant-editor"
import { WorkflowPanelV2 } from "./workflow/workflow-panel-v2"
import { AISidebarV5 } from "./workflow/ai-sidebar-v5"
import { WorkflowTabs } from "./workflow/workflow-tabs"
import { CanvasToolbar } from "./workflow/canvas-toolbar"
import type { WorkflowNode, Connection, WorkflowMetadata, Variable, NodeExecutionStatus } from "@/lib/workflow-types"

const initialNodes: WorkflowNode[] = [
  {
    id: "1",
    type: "trigger",
    label: "HTTP Trigger",
    position: { x: 100, y: 150 },
    data: {
      method: "POST",
      path: "/api/webhook",
      code: `// HTTP Trigger Configuration
export const config = {
  method: "POST",
  path: "/api/webhook",
  headers: {
    "Content-Type": "application/json"
  }
}`,
      input: `{
  "event": "user.created",
  "data": {
    "id": "usr_123",
    "email": "user@example.com"
  }
}`,
      output: `{
  "status": "received",
  "timestamp": "2024-01-15T10:30:00Z"
}`,
    },
    variables: [
      { id: "v1", name: "WEBHOOK_SECRET", value: "whsec_abc123", type: "secret" },
      { id: "v2", name: "RATE_LIMIT", value: "100", type: "number" },
    ],
  },
  {
    id: "2",
    type: "function",
    label: "Transform Data",
    position: { x: 350, y: 100 },
    data: {
      runtime: "Node.js",
      code: `async function transform(input) {
  const { event, data } = input;
  
  return {
    userId: data.id,
    email: data.email,
    eventType: event,
    processedAt: new Date().toISOString()
  };
}

export default transform;`,
      input: `{
  "event": "user.created",
  "data": {
    "id": "usr_123",
    "email": "user@example.com"
  }
}`,
      output: `{
  "userId": "usr_123",
  "email": "user@example.com",
  "eventType": "user.created",
  "processedAt": "2024-01-15T10:30:01Z"
}`,
    },
    variables: [{ id: "v3", name: "TRANSFORM_MODE", value: "strict", type: "string" }],
  },
  {
    id: "3",
    type: "condition",
    label: "Check User Type",
    position: { x: 600, y: 150 },
    data: {
      condition: "data.email.includes('@company.com')",
      code: `function evaluate(input) {
  const { email } = input;
  
  // Check if internal user
  if (email.includes('@company.com')) {
    return { branch: 'internal' };
  }
  
  return { branch: 'external' };
}`,
      input: `{
  "userId": "usr_123",
  "email": "user@example.com",
  "eventType": "user.created"
}`,
      output: `{
  "branch": "external",
  "matched": false
}`,
    },
    variables: [{ id: "v4", name: "INTERNAL_DOMAIN", value: "@company.com", type: "string" }],
  },
  {
    id: "4",
    type: "action",
    label: "Send Welcome Email",
    position: { x: 850, y: 80 },
    data: {
      service: "Email",
      code: `import { sendEmail } from '@/lib/email';

async function sendWelcome(input) {
  const { email, userId } = input;
  
  await sendEmail({
    to: email,
    template: 'welcome',
    variables: { userId }
  });
  
  return { sent: true };
}`,
      input: `{
  "userId": "usr_123",
  "email": "user@example.com"
}`,
      output: `{
  "sent": true,
  "messageId": "msg_abc123"
}`,
    },
    variables: [
      { id: "v5", name: "SMTP_HOST", value: "smtp.example.com", type: "string" },
      { id: "v6", name: "SMTP_API_KEY", value: "sk_live_xxx", type: "secret" },
    ],
  },
  {
    id: "5",
    type: "action",
    label: "Log to Database",
    position: { x: 850, y: 220 },
    data: {
      service: "Database",
      code: `import { db } from '@/lib/database';

async function logEvent(input) {
  const record = await db.events.create({
    data: {
      ...input,
      createdAt: new Date()
    }
  });
  
  return { recordId: record.id };
}`,
      input: `{
  "userId": "usr_123",
  "eventType": "user.created"
}`,
      output: `{
  "recordId": "evt_xyz789",
  "success": true
}`,
    },
    variables: [{ id: "v7", name: "DB_TABLE", value: "events", type: "string" }],
  },
]

const initialConnections: Connection[] = [
  { id: "c1", from: "1", to: "2", fromPort: "output", toPort: "input" },
  { id: "c2", from: "2", to: "3", fromPort: "output", toPort: "input" },
  { id: "c3", from: "3", to: "4", fromPort: "true", toPort: "input" },
  { id: "c4", from: "3", to: "5", fromPort: "false", toPort: "input" },
]

const initialMetadata: WorkflowMetadata = {
  id: "wf_abc123xyz",
  name: "Invoice Processing",
  description:
    "Handles new user registration events, transforms data, and routes to appropriate actions based on user type.",
  version: "1.2.0",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
  author: "dev@example.com",
  tags: ["onboarding", "automation", "webhook"],
}

const initialWorkflowVariables: Variable[] = [
  { id: "wv1", name: "ENVIRONMENT", value: "production", type: "string" },
  { id: "wv2", name: "API_BASE_URL", value: "https://api.example.com", type: "string" },
  { id: "wv3", name: "GLOBAL_API_KEY", value: "gk_live_xxxxx", type: "secret" },
  { id: "wv4", name: "DEBUG_MODE", value: "false", type: "boolean" },
  { id: "wv5", name: "MAX_RETRIES", value: "3", type: "number" },
]

interface WorkflowTabData {
  id: string
  name: string
  isDirty?: boolean
}

const initialTabs: WorkflowTabData[] = [
  { id: "tab1", name: "Invoice Processing.flow", isDirty: true },
  { id: "tab2", name: "User Onboarding.flow", isDirty: false },
  { id: "tab3", name: "Data Sync.flow", isDirty: false },
]

interface WorkflowDesignerV5Props {
  onBack: () => void
}

export function WorkflowDesignerV5({ onBack }: WorkflowDesignerV5Props) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes)
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [isPanelExpanded, setIsPanelExpanded] = useState(false)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [metadata, setMetadata] = useState<WorkflowMetadata>(initialMetadata)
  const [workflowVariables, setWorkflowVariables] = useState<Variable[]>(initialWorkflowVariables)
  const [nodeExecutionStatuses, setNodeExecutionStatuses] = useState<Record<string, NodeExecutionStatus>>({})
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false)
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPaused, setIsPaused] = useState(false)

  const [tabs, setTabs] = useState<WorkflowTabData[]>(initialTabs)
  const [activeTabId, setActiveTabId] = useState("tab1")

  const [workflowPanelTab, setWorkflowPanelTab] = useState<"properties" | "variables">("properties")

  const handleNodeSelect = useCallback((node: WorkflowNode | null) => {
    if (node) {
      setSelectedNode(node)
    } else {
      setSelectedNode(null)
    }
  }, [])

  const handleNodeUpdate = useCallback((updatedNode: WorkflowNode) => {
    setNodes((prev) => prev.map((n) => (n.id === updatedNode.id ? updatedNode : n)))
    setSelectedNode(updatedNode)
  }, [])

  const handleExpandPanel = useCallback(() => {
    setIsPanelExpanded(true)
    setIsPanelCollapsed(false)
  }, [])

  const handleCollapsePanel = useCallback(() => {
    setIsPanelCollapsed(true)
    setIsPanelExpanded(false)
  }, [])

  const handleClosePanel = useCallback(() => {
    setIsPanelExpanded(false)
    setIsPanelCollapsed(false)
    setSelectedNode(null)
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
    const executionOrder = ["1", "2", "3", "5"]
    for (const nodeId of executionOrder) {
      const success = await runSingleNode(nodeId)
      if (!success) break
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
    setIsWorkflowRunning(false)
    setTimeout(() => setNodeExecutionStatuses({}), 3000)
  }, [isWorkflowRunning, runSingleNode])

  const runSelectedNode = useCallback(async () => {
    if (!selectedNode || isWorkflowRunning) return
    setIsWorkflowRunning(true)
    setNodeExecutionStatuses({})
    await runSingleNode(selectedNode.id)
    setIsWorkflowRunning(false)
    setTimeout(() => setNodeExecutionStatuses({}), 3000)
  }, [selectedNode, isWorkflowRunning, runSingleNode])

  const handleCloseInlinePopover = useCallback(() => {
    setSelectedNode(null)
  }, [])

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

  const handleAddNodeAfterSelected = useCallback(() => {
    if (!selectedNode) return
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: "function",
      label: "New Node",
      position: {
        x: selectedNode.position.x + 250,
        y: selectedNode.position.y,
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
      from: selectedNode.id,
      to: newNode.id,
      fromPort: "output",
      toPort: "input",
    }
    setConnections((prev) => [...prev, newConnection])
    setSelectedNode(newNode)
  }, [selectedNode])

  const handleDeleteNode = useCallback(() => {
    if (!selectedNode) return
    setNodes((prev) => prev.filter((n) => n.id !== selectedNode.id))
    setConnections((prev) => prev.filter((c) => c.from !== selectedNode.id && c.to !== selectedNode.id))
    setSelectedNode(null)
  }, [selectedNode])

  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const handleTabClose = useCallback(
    (tabId: string) => {
      if (tabs.length === 1) return // Don't close the last tab
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
    // Step through one node at a time
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
    // Enter debug mode - run with pauses between each node
    setIsPaused(true)
    runWorkflow()
  }, [runWorkflow])

  const currentSelectionTitle = selectedNode ? selectedNode.label : metadata.name
  const currentSelectionSubtitle = selectedNode ? `${selectedNode.type} Node` : "Workflow"

  const showInlinePopover = selectedNode && !isPanelExpanded && !isPanelCollapsed
  const showCollapsedBar = !isPanelExpanded

  const tabsWithActive = tabs.map((t) => ({ ...t, isActive: t.id === activeTabId }))

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="relative flex flex-1 overflow-hidden">
        {/* AI Sidebar with logo and profile */}
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

        {/* Main canvas area with tabs */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <WorkflowTabs
            tabs={tabsWithActive}
            onTabSelect={handleTabSelect}
            onTabClose={handleTabClose}
            onTabAdd={handleTabAdd}
            onBack={onBack}
          />

          {/* Canvas content */}
          <div className="relative flex-1 overflow-hidden">
            {isPanelExpanded && selectedNode ? (
              <QuadrantEditor
                node={selectedNode}
                nodes={nodes}
                connections={connections}
                onClose={handleClosePanel}
                onNodeUpdate={handleNodeUpdate}
                onRunNode={runSelectedNode}
                isRunning={isWorkflowRunning}
                nodeExecutionStatus={nodeExecutionStatuses[selectedNode.id]}
                nodeExecutionStatuses={nodeExecutionStatuses}
                onNodeSelect={handleNodeSelect}
              />
            ) : isPanelExpanded && !selectedNode ? (
              <WorkflowPanelV2
                nodes={nodes}
                connections={connections}
                metadata={metadata}
                workflowVariables={workflowVariables}
                onClose={handleClosePanel}
                onMetadataUpdate={setMetadata}
                onVariablesUpdate={setWorkflowVariables}
                onRunWorkflow={runWorkflow}
                isRunning={isWorkflowRunning}
                nodeExecutionStatuses={nodeExecutionStatuses}
                onNodeSelect={handleNodeSelect}
                isPaused={isPaused}
                onStop={handleStop}
                onPause={handlePause}
                onStepForward={handleStepForward}
                onReset={handleReset}
                onTest={handleTest}
                initialTab={workflowPanelTab}
              />
            ) : (
              <>
                <WorkflowCanvas
                  nodes={nodes}
                  connections={connections}
                  selectedNode={selectedNode}
                  onNodeSelect={handleNodeSelect}
                  isPanelOpen={false}
                  onCanvasClick={handleCanvasClick}
                  nodeExecutionStatuses={nodeExecutionStatuses}
                  onTransformChange={setCanvasTransform}
                />

                {showInlinePopover && selectedNode && (
                  <InlineNodePopover
                    node={selectedNode}
                    position={selectedNode.position}
                    canvasTransform={canvasTransform}
                    onExpand={handleExpandPanel}
                    onClose={handleCloseInlinePopover}
                    onNodeUpdate={handleNodeUpdate}
                    onRunNode={runSelectedNode}
                    onAddNode={handleAddNodeAfterSelected}
                    onDeleteNode={handleDeleteNode}
                    isRunning={isWorkflowRunning}
                  />
                )}

                {showCollapsedBar && (
                  <CollapsedPanelBar
                    title={metadata.name}
                    subtitle="Workflow"
                    nodeType={undefined}
                    onExpand={handleExpandPanel}
                    onClose={handleClosePanel}
                    showTabControl={true}
                    activeTab={workflowPanelTab}
                    onTabChange={(tab) => {
                      setWorkflowPanelTab(tab)
                      setSelectedNode(null)
                      setIsPanelExpanded(true)
                      setIsPanelCollapsed(false)
                    }}
                  />
                )}

                {/* Canvas toolbar at bottom center */}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
