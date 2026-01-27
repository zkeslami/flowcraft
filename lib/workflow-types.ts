export interface WorkflowNode {
  id: string
  type: "trigger" | "function" | "condition" | "action" | "agent"
  label: string
  position: { x: number; y: number }
  data?: {
    method?: string
    path?: string
    runtime?: string
    condition?: string
    service?: string
    code?: string
    input?: string
    output?: string
    agentHealth?: number
    evaluationsRun?: number
    currentLLM?: string
    context?: string[]
    tools?: string[]
  }
  variables?: Variable[]
}

export interface Variable {
  id: string
  name: string
  value: string
  type: "string" | "number" | "boolean" | "secret"
}

export interface Connection {
  id: string
  from: string
  to: string
  fromPort: string
  toPort: string
}

export interface WorkflowMetadata {
  id: string
  name: string
  description: string
  version: string
  createdAt: string
  updatedAt: string
  author: string
  tags: string[]
}

export interface WorkflowExecution {
  id: string
  status: "success" | "failed" | "running" | "pending"
  startedAt: string
  completedAt?: string
  duration?: number
  triggeredBy: string
  nodesExecuted: number
  totalNodes: number
  error?: string
}

export type NodeExecutionStatus = "idle" | "running" | "completed" | "failed"

export interface WorkflowStats {
  totalExecutions: number
  successRate: number
  avgDuration: number
  lastExecuted?: string
}
