// Pattern Node Editors
// Specialized UI components for different agentic patterns

export { DeepRAGEditor } from './deep-rag-editor'
export { BatchTransformEditor } from './batch-transform-editor'
export { HITLCheckpointEditor } from './hitl-checkpoint-editor'
export { ClassificationEditor } from './classification-editor'
export { ExtractionEditor } from './extraction-editor'

// Re-export types for convenience
export type {
  DeepRAGConfig,
  ResearchSource,
  Citation,
  ResearchResult
} from './deep-rag-editor'

// Pattern node type mapping
export const PATTERN_NODE_EDITORS = {
  'deep-rag': 'DeepRAGEditor',
  'batch-transform': 'BatchTransformEditor',
  'hitl-checkpoint': 'HITLCheckpointEditor',
  'classification': 'ClassificationEditor',
  'extraction': 'ExtractionEditor',
  'text-summarization': 'TextSummarizationEditor', // To be implemented
  'validation': 'ValidationEditor', // To be implemented
  'planner-executor': 'PlannerExecutorEditor', // To be implemented
  'tool-calling': 'ToolCallingEditor', // To be implemented
  'memory-retrieval': 'MemoryRetrievalEditor', // To be implemented
} as const

export type PatternNodeEditorType = keyof typeof PATTERN_NODE_EDITORS
