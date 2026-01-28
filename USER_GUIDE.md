# FlowCraft User Guide

This guide will help you get started with FlowCraft and learn how to create, configure, and run visual workflows.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Working with Nodes](#working-with-nodes)
4. [Creating Connections](#creating-connections)
5. [Configuring Nodes](#configuring-nodes)
6. [AI Agent Nodes](#ai-agent-nodes)
7. [Running Workflows](#running-workflows)
8. [Execution Tracing](#execution-tracing)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Tips and Best Practices](#tips-and-best-practices)

---

## Getting Started

### First Launch

When you first open FlowCraft, you'll see a sample invoice processing workflow. This demonstrates the different node types and how they connect together.

### Creating a New Workflow

1. Click the **+** button in the tab bar to create a new workflow
2. The canvas will be empty, ready for your first node
3. Use the sidebar to add nodes to your workflow

---

## Interface Overview

FlowCraft's interface consists of several key areas:

### Left Sidebar

The left sidebar contains:

- **Logo/Home** - Return to the main view
- **Nodes Panel** - Browse and add available node types
- **Search** - Search for nodes and workflows
- **Runs** - View execution history and traces

### Canvas Area

The main canvas where you design your workflow:

- **Drag** to pan around the canvas
- **Scroll** to zoom in/out
- **Click** nodes to select them
- **Double-click** nodes to open the properties panel

### Properties Panel

Opens on the right side when a node is selected:

- **Code Tab** - Edit node code/logic
- **Input/Output Tab** - Define data schemas
- **Variables Tab** - Configure node-specific variables
- **Settings Tab** - Node configuration options

### Bottom Toolbar

Contains workflow execution controls:

- **Play** - Run the entire workflow or selected node
- **Stop** - Stop execution
- **Pause** - Pause at current step
- **Step** - Execute one node at a time
- **Test** - Run in test mode with tracing

### Status Bar

Shows real-time information:

- Connection status
- Node/connection count
- Execution status
- Zoom level
- Current view mode

---

## Working with Nodes

### Node Types

#### Trigger Nodes
Entry points for your workflow. Configure:
- HTTP method (GET, POST, etc.)
- Endpoint path
- Initial data transformation

#### Function Nodes
Execute custom code:
- Node.js runtime
- Access to input data
- Transform and return output

#### Condition Nodes
Branching logic:
- Define conditional expressions
- Routes to different paths based on results
- Supports complex boolean logic

#### Action Nodes
External integrations:
- Connect to external services
- Send notifications
- Update databases

#### Agent Nodes
AI-powered processing:
- Configure LLM models
- Define tools and context
- Set up evaluation criteria

### Adding Nodes

**Method 1: From Sidebar**
1. Click on the node type in the sidebar
2. Node appears on the canvas
3. Drag to position

**Method 2: From Existing Node**
1. Hover over a node
2. Click the **+** button that appears
3. New node is created and connected automatically

### Moving Nodes

- Click and drag any node to reposition
- Use **Tidy Up** to auto-arrange nodes

### Deleting Nodes

1. Select the node
2. Press **Delete** or use the context menu
3. Confirm deletion (connected edges will also be removed)

---

## Creating Connections

### Manual Connection

1. Hover over a node's output port (right side)
2. Click and drag to another node's input port (left side)
3. Release to create the connection

### Condition Node Connections

Condition nodes have two output ports:
- **True** - Route when condition is met
- **False** - Route when condition fails

### Removing Connections

1. Click on a connection line
2. Press **Delete** or right-click and select "Delete"

---

## Configuring Nodes

### Opening the Properties Panel

- **Double-click** a node, or
- **Select** a node and press **Enter**

### Code Editor

Write custom logic for your nodes:

```javascript
// Example function node
const result = await processData(input)
return {
  processed: true,
  data: result
}
```

### Input/Output Configuration

Define the data schema for your nodes:

```json
{
  "input": {
    "userId": "string",
    "action": "string"
  },
  "output": {
    "success": "boolean",
    "message": "string"
  }
}
```

### Variables

Add node-specific variables:

| Type | Description |
|------|-------------|
| String | Text values |
| Number | Numeric values |
| Boolean | True/false flags |
| Secret | Sensitive data (masked) |

---

## AI Agent Nodes

Agent nodes are special nodes powered by large language models (LLMs).

### Configuration Options

- **LLM Model** - Select the AI model (e.g., GPT-4o)
- **Context** - Add context documents and data sources
- **Tools** - Enable capabilities like OCR, validation, lookup
- **Health Score** - Monitor agent performance

### Setting Up Context

1. Select the Agent node
2. Open Properties Panel
3. Add context items:
   - Schema definitions
   - Reference documents
   - Historical data

### Configuring Tools

Available tools include:
- OCR Extract
- Amount Validator
- Date Parser
- Vendor Lookup
- Duplicate Check
- Custom tools

### Monitoring Agent Health

The agent health score (0-100%) indicates:
- Evaluation success rate
- Response quality
- Tool usage effectiveness

---

## Running Workflows

### Run Entire Workflow

1. Ensure no node is selected
2. Click **Play** in the bottom toolbar
3. Watch execution progress through nodes

### Run Selected Node

1. Select a specific node
2. Click **Play**
3. Only that node will execute

### Test Mode

1. Click **Test** button
2. Workflow runs with tracing enabled
3. Execution details appear in the trace panel

### Execution States

Nodes display their status visually:

| State | Indicator |
|-------|-----------|
| Idle | Default appearance |
| Running | Pulsing blue border |
| Completed | Green checkmark |
| Failed | Red X indicator |

---

## Execution Tracing

The trace panel provides detailed execution insights.

### Opening the Trace Panel

1. Click **Runs** in the left sidebar
2. Select an execution from the history
3. Trace panel opens at the bottom

### Trace Panel Sections

#### Spans List (Left)

Shows the execution timeline:
- Node execution order
- Duration for each span
- Status indicators
- Nested child spans

#### Span Details (Right)

Detailed information about selected span:
- Input data received
- Output data produced
- Execution duration
- Error messages (if any)
- Logs and traces

### View Modes

- **List View** - Hierarchical span list
- **Timeline View** - Gantt-style timeline

### Resizing the Trace Panel

- Drag the top border to resize vertically
- Drag the center divider to adjust split position

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Delete` | Delete selected node |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + S` | Save workflow |
| `Space` | Pan canvas (hold and drag) |
| `Enter` | Open properties for selected node |
| `Escape` | Close panel / Deselect |

---

## Tips and Best Practices

### Workflow Design

1. **Start with a trigger** - Every workflow needs an entry point
2. **Name nodes descriptively** - Makes debugging easier
3. **Use conditions wisely** - Keep branching logic simple
4. **Group related logic** - Use function nodes to encapsulate complexity

### Performance

1. **Minimize node count** - Combine operations where possible
2. **Use appropriate timeouts** - Prevent long-running operations from blocking
3. **Handle errors gracefully** - Add condition nodes for error cases

### Debugging

1. **Use test mode** - Always test with tracing enabled
2. **Check span details** - Review input/output at each step
3. **Monitor agent health** - Keep AI agents above 90% health

### Organization

1. **Use tidy up** - Keep your canvas organized
2. **Leverage tabs** - Separate complex workflows into multiple files
3. **Add comments** - Document complex node logic in code

---

## Troubleshooting

### Node Won't Connect

- Ensure you're dragging from output (right) to input (left)
- Check that the connection doesn't create a cycle
- Verify both nodes are on the same workflow

### Execution Fails

1. Check the trace panel for error details
2. Verify input data matches expected schema
3. Review code for syntax errors
4. Ensure external services are accessible

### Canvas Performance

- Reduce zoom level for large workflows
- Use "Visual" view mode for simplified display
- Close unused tabs

### Agent Node Issues

- Verify LLM API keys are configured
- Check context documents are accessible
- Review tool configurations

---

## Getting Help

- Check the [README](README.md) for setup information
- Review the [Contributing Guide](CONTRIBUTING.md) to report issues
- Search existing issues on GitHub

---

Happy workflow building!
