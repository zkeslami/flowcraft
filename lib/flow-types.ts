// Enhanced Flow Types - Supporting all concept themes
// Theme 1: Pattern-Specific Nodes
// Theme 2: Dual Authoring
// Theme 3: Episodic Memory
// Theme 4: Integrated Evaluations
// Theme 5: Online/Runtime Evaluations
// Theme 6: Data Transformation Pipeline

// =============================================================================
// THEME 1: Pattern-Specific Node Types
// =============================================================================

export type PatternNodeType =
  | 'deep-rag'           // Research & retrieval with citations
  | 'batch-transform'    // Tabular data transformation
  | 'text-summarization' // Text summarization with sources
  | 'classification'     // Document/data classification
  | 'extraction'         // Schema-based extraction
  | 'validation'         // Data validation with rules
  | 'planner-executor'   // Multi-step reasoning
  | 'tool-calling'       // External API/tool execution
  | 'memory-retrieval'   // Memory and personalization
  | 'hitl-checkpoint'    // Human-in-the-loop approval

export interface PatternNodeConfig {
  patternType: PatternNodeType
  // DeepRAG specific
  groundingSources?: GroundingSource[]
  citationMode?: 'inline' | 'footnote' | 'none'
  researchDepth?: 'shallow' | 'medium' | 'deep'
  // BatchTransform specific
  inputSchema?: DataSchema
  outputSchema?: DataSchema
  groundingMode?: 'web' | 'index' | 'none'
  batchSize?: number
  // Classification specific
  categories?: string[]
  confidenceThreshold?: number
  // Extraction specific
  extractionSchema?: DataSchema
  // Validation specific
  validationRules?: ValidationRule[]
  // HITL specific
  approvalRoles?: string[]
  escalationSLA?: number // minutes
  autoApproveThreshold?: number
}

export interface GroundingSource {
  id: string
  type: 'index' | 'connector' | 'web' | 'document'
  name: string
  config?: Record<string, unknown>
}

export interface DataSchema {
  fields: SchemaField[]
}

export interface SchemaField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date'
  required?: boolean
  description?: string
  nested?: SchemaField[]
}

export interface ValidationRule {
  id: string
  field: string
  rule: 'required' | 'regex' | 'range' | 'enum' | 'custom'
  value: string | number | string[]
  message: string
}

// =============================================================================
// THEME 2: Dual Authoring (Visual ↔ Code)
// =============================================================================

export type AuthoringMode = 'visual' | 'code' | 'split'

export interface CodeRepresentation {
  language: 'typescript' | 'python' | 'json'
  source: string
  ast?: ASTNode
  lastSyncedAt: Date
  syncStatus: 'synced' | 'visual-ahead' | 'code-ahead' | 'conflict'
  codeOnlyRegions?: CodeOnlyRegion[]
}

export interface ASTNode {
  type: string
  children?: ASTNode[]
  properties?: Record<string, unknown>
  location?: { start: number; end: number }
}

export interface CodeOnlyRegion {
  id: string
  startLine: number
  endLine: number
  reason: 'dynamic-value' | 'complex-control-flow' | 'external-reference' | 'metaprogramming' | 'middleware'
  description: string
}

export interface CompilationResult {
  success: boolean
  errors?: CompilationError[]
  warnings?: CompilationWarning[]
  canRoundTrip: boolean
  codeOnlyBlocks?: CodeOnlyRegion[]
}

export interface CompilationError {
  line: number
  column: number
  message: string
  severity: 'error'
}

export interface CompilationWarning {
  line: number
  column: number
  message: string
  severity: 'warning'
  suggestion?: string
}

// =============================================================================
// THEME 3: Episodic Memory System
// =============================================================================

export interface EpisodicMemoryStore {
  caseId: string
  processInstances: ProcessEpisode[]
  agentRuns: AgentEpisode[]
  artifacts: MemoryArtifact[]
  feedbackItems: FeedbackItem[]
}

export interface ProcessEpisode {
  id: string
  caseId: string
  processId: string
  processName: string
  status: 'running' | 'completed' | 'failed' | 'suspended'
  startTime: Date
  endTime?: Date
  triggerInput: Record<string, unknown>
  stateTransitions: StateTransition[]
  outputs: Record<string, unknown>[]
  agentRunIds: string[]
  hitlTaskIds: string[]
}

export interface AgentEpisode {
  id: string
  caseId: string
  processInstanceId?: string
  agentId: string
  agentName: string
  status: 'running' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  input: Record<string, unknown>
  trajectory: TrajectoryStep[]
  output: Record<string, unknown>
  toolCalls: ToolCall[]
  evaluations: EvaluationResult[]
  feedbackIds: string[]
}

export interface StateTransition {
  id: string
  fromState: string
  toState: string
  timestamp: Date
  trigger: string
  metadata?: Record<string, unknown>
}

export interface TrajectoryStep {
  id: string
  stepIndex: number
  type: 'thought' | 'action' | 'observation' | 'tool-call' | 'checkpoint'
  content: string
  timestamp: Date
  metadata?: Record<string, unknown>
  dataReferences?: DataReference[]
}

export interface ToolCall {
  id: string
  toolName: string
  input: Record<string, unknown>
  output?: Record<string, unknown>
  status: 'pending' | 'success' | 'failed'
  duration?: number
  error?: string
}

export interface DataReference {
  id: string
  type: 'structured-query' | 'document' | 'passage' | 'entity'
  source: string
  content?: string
  citation?: Citation
}

export interface Citation {
  source: string
  document?: string
  page?: number
  excerpt: string
  confidence: number
}

export interface MemoryArtifact {
  id: string
  type: 'input' | 'output' | 'trajectory' | 'tool-result' | 'document' | 'query-result'
  caseId: string
  agentRunId?: string
  processInstanceId?: string
  content: unknown
  createdAt: Date
  metadata?: Record<string, unknown>
}

export interface FeedbackItem {
  id: string
  caseId: string
  targetType: 'agent-run' | 'process-instance' | 'trajectory' | 'output'
  targetId: string
  feedbackType: 'approval' | 'rejection' | 'edit' | 'annotation' | 'rating'
  content: string | number | Record<string, unknown>
  providedBy: string
  providedAt: Date
  lifecycleState: FeedbackLifecycleState
  promotedAt?: Date
  promotedBy?: string
}

export type FeedbackLifecycleState =
  | 'captured'
  | 'triaged'
  | 'reviewed'
  | 'approved-for-learning'
  | 'promoted'
  | 'deprecated'
  | 'archived'

// =============================================================================
// THEME 4: Integrated Evaluations (Design-time)
// =============================================================================

export interface EvaluationSet {
  id: string
  name: string
  description?: string
  flowId: string
  datapoints: EvaluationDatapoint[]
  evaluators: EvaluatorConfig[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface EvaluationDatapoint {
  id: string
  input: Record<string, unknown>
  expectedOutput?: Record<string, unknown>
  expectedTrajectory?: string[]
  tags?: string[]
  source: 'manual' | 'import' | 'autopilot' | 'debug-run' | 'production'
}

export interface EvaluatorConfig {
  id: string
  type: EvaluatorType
  name: string
  config: Record<string, unknown>
  weight?: number
  threshold?: number
}

export type EvaluatorType =
  | 'exact-match'
  | 'keyword-contains'
  | 'json-similarity'
  | 'json-structure'
  | 'trajectory-comparator'
  | 'llm-as-judge'
  | 'faithfulness'
  | 'citation-coverage'
  | 'custom'

export interface EvaluationRun {
  id: string
  evaluationSetId: string
  flowId: string
  flowVersion: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  results: EvaluationResult[]
  summary: EvaluationSummary
  triggeredBy: string
}

export interface EvaluationResult {
  id: string
  datapointId: string
  evaluatorId: string
  passed: boolean
  score: number
  actualOutput?: Record<string, unknown>
  actualTrajectory?: string[]
  details?: Record<string, unknown>
  diff?: OutputDiff
}

export interface OutputDiff {
  expected: string
  actual: string
  changes: DiffChange[]
}

export interface DiffChange {
  type: 'add' | 'remove' | 'modify'
  path: string
  oldValue?: unknown
  newValue?: unknown
}

export interface EvaluationSummary {
  totalDatapoints: number
  passedDatapoints: number
  failedDatapoints: number
  averageScore: number
  scoresByEvaluator: Record<string, number>
  passRateByEvaluator: Record<string, number>
  trajectoryDeviation?: number
}

// =============================================================================
// THEME 5: Online/Runtime Evaluations
// =============================================================================

export interface OnlineEvaluationConfig {
  id: string
  flowId: string
  name: string
  enabled: boolean
  triggerType: 'every-run' | 'specific-events' | 'scheduled' | 'autopilot'
  schedule?: EvaluationSchedule
  eventFilters?: EventFilter[]
  datasetId?: string // For scheduled dataset-based evals
  evaluators: EvaluatorConfig[]
  baselineId?: string
  alertConfig?: AlertConfig
  createdAt: Date
  updatedAt: Date
}

export interface EvaluationSchedule {
  type: 'one-time' | 'recurring'
  startDate: Date
  endDate?: Date
  interval?: 'hourly' | 'daily' | 'weekly' | 'monthly'
  time?: string // HH:MM
}

export interface EventFilter {
  field: 'trigger' | 'use-case' | 'tool-call' | 'execution-id'
  operator: 'equals' | 'contains' | 'matches'
  value: string
}

export interface AlertConfig {
  channels: ('in-app' | 'email' | 'slack')[]
  thresholds: AlertThreshold[]
  cooldownMinutes?: number
}

export interface AlertThreshold {
  metric: 'score' | 'pass-rate' | 'latency' | 'drift' | 'cost'
  operator: 'lt' | 'gt' | 'change-by'
  value: number
  severity: 'info' | 'warning' | 'critical'
}

export interface DriftDetection {
  id: string
  flowId: string
  baselineRunId: string
  comparisonRunId: string
  detectedAt: Date
  metrics: DriftMetric[]
  overallDriftScore: number
  recommendation?: string
}

export interface DriftMetric {
  name: string
  baselineValue: number
  currentValue: number
  changePercent: number
  significance: 'low' | 'medium' | 'high'
}

// =============================================================================
// THEME 6: Data Transformation Pipeline Stages
// =============================================================================

export type PipelineStage =
  | 'ingestion'
  | 'aggregation'
  | 'querying'
  | 'classification'
  | 'rules-routing'
  | 'reasoning'
  | 'content-creation'
  | 'diagnosis'
  | 'feedback'

export interface PipelineStageConfig {
  stage: PipelineStage
  nodeTypes: string[]
  platformComponents: string[]
  patterns: string[]
}

export const PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    stage: 'ingestion',
    nodeTypes: ['trigger', 'function'],
    platformComponents: ['Data Fabric', 'RPA/API'],
    patterns: ['data-normalization']
  },
  {
    stage: 'aggregation',
    nodeTypes: ['function', 'agent'],
    platformComponents: ['Data Fabric', 'Context Grounding'],
    patterns: ['context-assembly', 'knowledge-graph']
  },
  {
    stage: 'querying',
    nodeTypes: ['agent', 'function'],
    platformComponents: ['Simple Agents', 'IXP'],
    patterns: ['deep-rag', 'agentic-document-processing']
  },
  {
    stage: 'classification',
    nodeTypes: ['agent', 'function'],
    platformComponents: ['Agent Builder'],
    patterns: ['classification', 'extraction', 'validation']
  },
  {
    stage: 'rules-routing',
    nodeTypes: ['condition', 'agent'],
    platformComponents: ['Conditionals', 'Action Center', 'HITL'],
    patterns: ['rules-engine', 'confidence-routing']
  },
  {
    stage: 'reasoning',
    nodeTypes: ['agent'],
    platformComponents: ['Agent Builder', 'Tool Agents', 'Deep Agents'],
    patterns: ['planner-executor', 'react', 'reflexion']
  },
  {
    stage: 'content-creation',
    nodeTypes: ['agent', 'action'],
    platformComponents: ['Workflow', 'RPA/API'],
    patterns: ['text-summarization', 'content-generation']
  },
  {
    stage: 'diagnosis',
    nodeTypes: ['agent', 'function'],
    platformComponents: ['Instance Management', 'Diagnostic Agents'],
    patterns: ['self-healing', 'error-analysis']
  },
  {
    stage: 'feedback',
    nodeTypes: ['function', 'agent'],
    platformComponents: ['Episodic Memory', 'Feedback APIs'],
    patterns: ['memory-update', 'learning-loop']
  }
]

// =============================================================================
// Enhanced Workflow Node (combining all themes)
// =============================================================================

export interface EnhancedWorkflowNode {
  id: string
  type: 'trigger' | 'function' | 'condition' | 'action' | 'agent' | 'pattern'
  patternType?: PatternNodeType
  label: string
  position: { x: number; y: number }
  data?: {
    // Basic node data
    method?: string
    path?: string
    runtime?: string
    condition?: string
    service?: string
    code?: string
    input?: string
    output?: string
    // Agent-specific
    agentHealth?: number
    evaluationsRun?: number
    currentLLM?: string
    context?: string[]
    tools?: string[]
    // Pattern-specific config
    patternConfig?: PatternNodeConfig
  }
  variables?: Variable[]
  // Dual authoring
  codeRepresentation?: CodeRepresentation
  // Memory references
  memoryScope?: 'case' | 'process' | 'agent' | 'global'
  // Evaluation config
  evaluationConfig?: {
    enabled: boolean
    evaluators: string[]
    thresholds?: Record<string, number>
  }
  // Pipeline stage
  pipelineStage?: PipelineStage
}

export interface Variable {
  id: string
  name: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'secret'
}

// =============================================================================
// Simulation & Testing Types
// =============================================================================

export interface SimulationConfig {
  id: string
  name: string
  nodeSimulations: NodeSimulation[]
  toolMocks: ToolMock[]
  hybridMode: boolean // Mix real and simulated
}

export interface NodeSimulation {
  nodeId: string
  simulationType: 'mock-output' | 'delay' | 'error' | 'skip'
  mockOutput?: Record<string, unknown>
  delayMs?: number
  errorMessage?: string
}

export interface ToolMock {
  toolName: string
  mockResponse: Record<string, unknown>
  shouldFail?: boolean
  latencyMs?: number
}

// =============================================================================
// Governance & Publishing Types
// =============================================================================

export interface PublishReadinessCheck {
  id: string
  name: string
  status: 'passed' | 'warning' | 'failed'
  message: string
  details?: Record<string, unknown>
}

export interface FlowVersion {
  id: string
  flowId: string
  version: string
  createdAt: Date
  createdBy: string
  changeLog?: string
  evaluationRunId?: string
  publishedAt?: Date
  publishedBy?: string
  status: 'draft' | 'testing' | 'published' | 'deprecated'
  flowSnapshot: string // JSON of flow state
  codeSnapshot?: string // Code representation
}
