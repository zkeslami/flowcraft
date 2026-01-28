# FlowCraft Theme Implementation Guide

This document describes the implementation of the 6 major concept themes from the "Concepts for Flow" documents into the FlowCraft visual workflow designer.

## Overview

All themes have been implemented as modular, reusable components that integrate with the existing FlowCraft architecture. The implementation follows React/Next.js patterns with TypeScript for type safety.

---

## Theme 1: Pattern-Specific Node Experiences

**Location:** `components/workflow/pattern-nodes/`

### Implemented Components

| Component | File | Purpose |
|-----------|------|---------|
| DeepRAG Editor | `deep-rag-editor.tsx` | Research pattern with source selection, citations, and research timeline |
| Batch Transform Editor | `batch-transform-editor.tsx` | Tabular data transformation with column mappings and AI prompts |
| HITL Checkpoint Editor | `hitl-checkpoint-editor.tsx` | Human-in-the-loop approval gates with queue management |
| Classification Editor | `classification-editor.tsx` | Multi-label classification with training examples |
| Extraction Editor | `extraction-editor.tsx` | Schema-based data extraction with validation |

### Usage

```tsx
import { DeepRAGEditor, BatchTransformEditor } from '@/components/workflow/pattern-nodes'

// Use in properties panel when node.type === 'pattern' and node.patternType === 'deep-rag'
<DeepRAGEditor
  config={nodeConfig}
  onConfigChange={handleConfigChange}
/>
```

---

## Theme 2: Dual Authoring (Visual ↔ Code)

**Location:** `components/workflow/dual-authoring-panel.tsx`

### Features

- **Three view modes**: Visual, Code, Split
- **Bidirectional sync**: Changes in code update visual, and vice versa
- **YAML-like DSL**: Human-readable flow definition language
- **Validation**: Real-time syntax checking with error highlighting
- **Undo/Redo**: Full history support
- **Import/Export**: Load and save flow definitions as YAML files

### Usage

```tsx
import { DualAuthoringPanel, AuthoringMode } from '@/components/workflow/dual-authoring-panel'

const [mode, setMode] = useState<AuthoringMode>('visual')

<DualAuthoringPanel
  nodes={nodes}
  connections={connections}
  metadata={metadata}
  onNodesChange={setNodes}
  onConnectionsChange={setConnections}
  onMetadataChange={setMetadata}
  mode={mode}
  onModeChange={setMode}
/>
```

### Code Format Example

```yaml
# Flow Definition
name: "Invoice Processing"
version: "2.1.0"
tags: ["invoices", "finance"]

# Nodes
nodes:
  - id: "1"
    type: trigger
    label: "Invoice Received"
    position: { x: 100, y: 150 }
    data:
      method: "POST"
      path: "/api/invoices/incoming"

# Connections
connections:
  - from: "1" -> to: "2"
```

---

## Theme 3: Episodic Memory System

**Location:** `components/workflow/episodic-memory-panel.tsx`

### Hierarchy

```
Case (e.g., "Invoice INV-2024-1247")
└── Process Instance (e.g., "Invoice Processing")
    └── Agent Run (e.g., "Validate Invoice")
        ├── Tool Calls (OCR Extract, Vendor Lookup, etc.)
        ├── Reasoning Trace (thought → action → observation)
        └── Feedback Items (user ratings, corrections)
```

### Features

- **Case Browser**: Hierarchical tree view of cases → processes → agents
- **Agent Run Details**: Token usage, tool calls, reasoning trace
- **Feedback Collection**: Thumbs up/down, comments, corrections
- **Insights Panel**: Learned patterns and improvement suggestions
- **Analytics**: Token usage, success rates, processing times

### Usage

```tsx
import { EpisodicMemoryPanel, Case } from '@/components/workflow/episodic-memory-panel'

<EpisodicMemoryPanel
  cases={cases}
  selectedCaseId={selectedCaseId}
  onSelectCase={handleSelectCase}
  onSelectProcess={handleSelectProcess}
  onSelectAgent={handleSelectAgent}
  onAddFeedback={handleAddFeedback}
  onArchiveCase={handleArchiveCase}
/>
```

---

## Theme 4: Integrated Evaluations (Design-Time)

**Location:** `components/workflow/evaluation-builder-panel.tsx`

### Features

- **Datapoint Management**: Add, edit, import datapoints with tags
- **Evaluator Configuration**: Exact match, fuzzy match, LLM judge, semantic similarity
- **Test Execution**: Run evaluations with progress tracking
- **Results Dashboard**: Pass/fail rates, scores by evaluator, failed case analysis
- **History Tracking**: Compare runs across versions

### Evaluator Types

| Type | Description |
|------|-------------|
| `exact_match` | Exact equality comparison |
| `fuzzy_match` | Threshold-based numerical comparison |
| `llm_judge` | LLM-based quality assessment |
| `semantic_similarity` | Embedding-based similarity |
| `regex` | Pattern matching |
| `custom` | User-defined evaluator |

### Usage

```tsx
import { EvaluationBuilderPanel, EvaluationSet } from '@/components/workflow/evaluation-builder-panel'

<EvaluationBuilderPanel
  evaluationSet={evaluationSet}
  onSave={handleSave}
  onRun={handleRun}
/>
```

---

## Theme 5: Online/Runtime Evaluations

**Location:** `components/workflow/runtime-evaluation-panel.tsx`

### Features

- **Real-Time Monitoring**: Live metric dashboards with sparklines
- **Drift Detection**: Automatic detection of metric drift from baselines
- **Alert Management**: Severity-based alerts with acknowledgment workflow
- **Scheduled Evaluations**: Interval, cron, or trigger-based schedules
- **Notification Routing**: Slack, email, webhook, PagerDuty integration

### Metrics Tracked

- Accuracy / Pass Rate
- Throughput
- P95 Latency
- Error Rate
- Token Usage
- Cost

### Usage

```tsx
import { RuntimeEvaluationPanel } from '@/components/workflow/runtime-evaluation-panel'

<RuntimeEvaluationPanel
  flowId="flow-001"
  scheduledEvaluations={schedules}
  driftAlerts={alerts}
  metricTrends={trends}
  notificationChannels={channels}
  onUpdateSchedule={handleUpdateSchedule}
  onAcknowledgeAlert={handleAcknowledge}
  onUpdateNotifications={handleUpdateNotifications}
/>
```

---

## Theme 6: Data Transformation Pipeline

**Location:** `components/workflow/data-pipeline-nodes.tsx`

### Node Types

| Node | Purpose |
|------|---------|
| `DataIngestionNode` | Import data from files, databases, APIs, streams |
| `DataTransformNode` | Transform with map, filter, aggregate, join, split, enrich |
| `DataOutputNode` | Write to files, databases, APIs with partitioning |

### Pipeline Stages (from flow-types.ts)

1. **Ingestion** → Data normalization
2. **Aggregation** → Context assembly
3. **Querying** → Deep RAG, document processing
4. **Classification** → Categorization, extraction
5. **Rules/Routing** → Confidence-based routing
6. **Reasoning** → Planner-executor patterns
7. **Content Creation** → Summarization, generation
8. **Diagnosis** → Error analysis, self-healing
9. **Feedback** → Memory updates, learning loops

### Usage

```tsx
import { DataIngestionNode, DataTransformNode, DataOutputNode } from '@/components/workflow/data-pipeline-nodes'

// Use in properties panel based on node.pipelineStage
<DataIngestionNode config={config} onConfigChange={handleChange} />
<DataTransformNode config={config} onConfigChange={handleChange} />
<DataOutputNode config={config} onConfigChange={handleChange} />
```

---

## Type System

**Location:** `lib/flow-types.ts`

All types for the 6 themes are defined in a comprehensive type system including:

- `PatternNodeType` - Pattern node variants
- `AuthoringMode` - Visual/code/split modes
- `EpisodicMemoryStore` - Memory hierarchy types
- `EvaluationSet` - Evaluation configuration
- `OnlineEvaluationConfig` - Runtime evaluation settings
- `PipelineStage` - Data transformation stages
- `EnhancedWorkflowNode` - Combined node type with all features

---

## Integration Points

### Sidebar Integration

Use `EnhancedSidebarContent` to add Memory, Evaluations, and Monitoring tabs:

```tsx
import { EnhancedSidebarContent } from '@/components/workflow/enhanced-sidebar-content'

// Replace the "evaluations" tab content in ai-sidebar-v5.tsx
{activeTab === "evaluations" && (
  <EnhancedSidebarContent
    cases={cases}
    evaluationSets={evaluationSets}
    driftAlerts={driftAlerts}
    // ... other props
  />
)}
```

### Properties Panel Integration

Pattern nodes should render their specialized editors:

```tsx
if (selectedNode.type === 'pattern') {
  switch (selectedNode.patternType) {
    case 'deep-rag':
      return <DeepRAGEditor config={...} onChange={...} />
    case 'batch-transform':
      return <BatchTransformEditor config={...} onChange={...} />
    // ... other patterns
  }
}
```

### Dual Authoring Toggle

Add mode toggle to the toolbar:

```tsx
<CanvasToolbar>
  <DualAuthoringToggle mode={mode} onModeChange={setMode} />
</CanvasToolbar>
```

---

## File Structure

```
components/workflow/
├── pattern-nodes/
│   ├── index.ts
│   ├── deep-rag-editor.tsx
│   ├── batch-transform-editor.tsx
│   ├── hitl-checkpoint-editor.tsx
│   ├── classification-editor.tsx
│   └── extraction-editor.tsx
├── dual-authoring-panel.tsx
├── episodic-memory-panel.tsx
├── evaluation-builder-panel.tsx
├── runtime-evaluation-panel.tsx
├── data-pipeline-nodes.tsx
├── enhanced-sidebar-content.tsx
└── index.ts

lib/
└── flow-types.ts
```

---

## Next Steps

1. **Connect to Backend**: Wire up API calls for evaluations, memory storage
2. **Add More Patterns**: Implement remaining pattern nodes (planner-executor, tool-calling, etc.)
3. **Real-time Updates**: Add WebSocket support for live monitoring
4. **Persistence**: Save evaluation sets and memory to database
5. **Export/Import**: Full workflow export including evaluations and memory
