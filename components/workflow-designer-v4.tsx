"use client"

import { useState, useCallback } from "react"
import { WorkflowCanvas } from "./workflow/workflow-canvas"
import { PropertiesPanel } from "./workflow/properties-panel"
import { WorkflowPropertiesPanel } from "./workflow/workflow-properties-panel"
import { InlineNodePopover } from "./workflow/inline-node-popover"
import { WorkflowHeaderV4 } from "./workflow/workflow-header-v4"
import { CollapsedPanelBar } from "./workflow/collapsed-panel-bar"
import { AISidebar } from "./workflow/ai-sidebar"
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
  name: "User Onboarding Flow",
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

interface WorkflowDesignerV4Props {
  onBack: () => void
}

export function WorkflowDesignerV4({ onBack }: WorkflowDesignerV4Props) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes)
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [panelWidth, setPanelWidth] = useState(50)
  const [metadata, setMetadata] = useState<WorkflowMetadata>(initialMetadata)
  const [workflowVariables, setWorkflowVariables] = useState<Variable[]>(initialWorkflowVariables)
  const [nodeExecutionStatuses, setNodeExecutionStatuses] = useState<Record<string, NodeExecutionStatus>>({})
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false)
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 })

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

  const handleExpandToPanel = useCallback(() => {
    setIsPanelOpen(true)
    setIsPanelCollapsed(false)
  }, [])

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false)
    setIsPanelCollapsed(false)
    setSelectedNode(null)
  }, [])

  const handleCollapsePanel = useCallback(() => {
    setIsPanelCollapsed(true)
  }, [])

  const handleExpandFromCollapsed = useCallback(() => {
    setIsPanelCollapsed(false)
    setIsPanelOpen(true)
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

  // AI sidebar handlers
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

  const canvasWidth = isPanelOpen && !isPanelCollapsed ? `${100 - panelWidth}%` : "100%"

  const currentSelectionTitle = selectedNode ? selectedNode.label : metadata.name
  const currentSelectionSubtitle = selectedNode ? `${selectedNode.type} Node` : "Workflow"

  const showInlinePopover = selectedNode && (!isPanelOpen || isPanelCollapsed)
  const showCollapsedBar = (isPanelCollapsed || !isPanelOpen) && !selectedNode

  return (
    <div className="flex h-screen flex-col bg-background">
      <WorkflowHeaderV4 onBack={onBack} />

      <div className="relative flex flex-1 overflow-hidden">
        {/* AI Sidebar */}
        <AISidebar
          nodes={nodes}
          connections={connections}
          selectedNode={selectedNode}
          onNodeSelect={handleNodeSelect}
          onAddNode={handleAddNode}
          onConnectNodes={handleConnectNodes}
          onUpdateNodeCode={handleUpdateNodeCode}
        />

        {/* Main canvas area with V1 side panel layout */}
        <div className="relative flex flex-1 overflow-hidden">
          <div className="transition-all duration-300 ease-in-out" style={{ width: canvasWidth }}>
            <WorkflowCanvas
              nodes={nodes}
              connections={connections}
              selectedNode={selectedNode}
              onNodeSelect={handleNodeSelect}
              isPanelOpen={isPanelOpen && !isPanelCollapsed}
              onCanvasClick={handleCanvasClick}
              nodeExecutionStatuses={nodeExecutionStatuses}
              onTransformChange={setCanvasTransform}
            />

            {showInlinePopover && selectedNode && (
              <InlineNodePopover
                node={selectedNode}
                position={selectedNode.position}
                canvasTransform={canvasTransform}
                onExpand={handleExpandFromCollapsed}
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
                title={currentSelectionTitle}
                subtitle={currentSelectionSubtitle}
                nodeType={selectedNode?.type}
                onExpand={handleExpandFromCollapsed}
                onClose={handleClosePanel}
              />
            )}
          </div>

          {isPanelOpen && !isPanelCollapsed && selectedNode && (
            <PropertiesPanel
              node={selectedNode}
              onClose={handleClosePanel}
              onCollapse={handleCollapsePanel}
              onNodeUpdate={handleNodeUpdate}
              width={panelWidth}
              onWidthChange={setPanelWidth}
              onRunNode={runSelectedNode}
              isRunning={isWorkflowRunning}
              nodeExecutionStatus={nodeExecutionStatuses[selectedNode.id]}
            />
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
  )
}
