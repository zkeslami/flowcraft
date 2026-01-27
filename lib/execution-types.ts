export type ExecutionStatus = 'pending' | 'running' | 'success' | 'error';

export interface AgentConfig {
  systemPrompt?: string;
  userPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface ExecutionSpan {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  logs: ExecutionLog[];
  metrics?: SpanMetrics;
  parentSpanId?: string;
  agentConfig?: AgentConfig;
  children?: ExecutionSpan[];
}

export interface ExecutionLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface SpanMetrics {
  memoryUsage?: number;
  cpuTime?: number;
  retryCount?: number;
  itemsProcessed?: number;
}

export interface FlowExecution {
  id: string;
  flowId: string;
  flowName: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  triggeredBy: string;
  spans: ExecutionSpan[];
  summary: ExecutionSummary;
}

export interface ExecutionSummary {
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  pendingNodes: number;
  runningNodes: number;
}

export interface ExecutionHistoryItem {
  id: string;
  flowId: string;
  status: ExecutionStatus;
  startTime: Date;
  duration?: number;
  triggeredBy: string;
  stepsCount?: number;
}
