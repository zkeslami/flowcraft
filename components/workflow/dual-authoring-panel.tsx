"use client"

import * as React from "react"
import { useState, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import {
  Code,
  LayoutGrid,
  SplitSquareVertical,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  Upload,
  FileJson,
  Braces,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  ArrowLeftRight,
  Undo2,
  Redo2
} from "lucide-react"
import type { WorkflowNode, Connection, WorkflowMetadata } from "@/lib/workflow-types"

// Types for dual authoring
export type AuthoringMode = 'visual' | 'code' | 'split'

export interface DiffMarker {
  line: number
  type: 'added' | 'removed' | 'modified'
  nodeId?: string
  field?: string
}

export interface ValidationError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface DualAuthoringState {
  mode: AuthoringMode
  codeContent: string
  lastSyncedContent: string
  isDirty: boolean
  validationErrors: ValidationError[]
  diffMarkers: DiffMarker[]
  cursorPosition: { line: number; column: number }
}

interface DualAuthoringPanelProps {
  nodes: WorkflowNode[]
  connections: Connection[]
  metadata: WorkflowMetadata
  onNodesChange: (nodes: WorkflowNode[]) => void
  onConnectionsChange: (connections: Connection[]) => void
  onMetadataChange: (metadata: WorkflowMetadata) => void
  mode: AuthoringMode
  onModeChange: (mode: AuthoringMode) => void
  className?: string
}

// Convert workflow to YAML-like DSL
function workflowToCode(
  nodes: WorkflowNode[],
  connections: Connection[],
  metadata: WorkflowMetadata
): string {
  const lines: string[] = []

  // Metadata section
  lines.push('# Flow Definition')
  lines.push(`name: "${metadata.name}"`)
  lines.push(`version: "${metadata.version}"`)
  if (metadata.description) {
    lines.push(`description: "${metadata.description}"`)
  }
  lines.push(`tags: [${metadata.tags.map(t => `"${t}"`).join(', ')}]`)
  lines.push('')

  // Nodes section
  lines.push('# Nodes')
  lines.push('nodes:')

  nodes.forEach((node) => {
    lines.push(`  - id: "${node.id}"`)
    lines.push(`    type: ${node.type}`)
    lines.push(`    label: "${node.label}"`)
    lines.push(`    position: { x: ${node.position.x}, y: ${node.position.y} }`)

    if (node.data) {
      lines.push('    data:')
      Object.entries(node.data).forEach(([key, value]) => {
        if (typeof value === 'string') {
          if (value.includes('\n')) {
            lines.push(`      ${key}: |`)
            value.split('\n').forEach(line => {
              lines.push(`        ${line}`)
            })
          } else {
            lines.push(`      ${key}: "${value}"`)
          }
        } else if (Array.isArray(value)) {
          lines.push(`      ${key}: [${value.map(v => `"${v}"`).join(', ')}]`)
        } else if (typeof value === 'object' && value !== null) {
          lines.push(`      ${key}: ${JSON.stringify(value)}`)
        } else {
          lines.push(`      ${key}: ${value}`)
        }
      })
    }
    lines.push('')
  })

  // Connections section
  lines.push('# Connections')
  lines.push('connections:')
  connections.forEach((conn) => {
    lines.push(`  - from: "${conn.from}" -> to: "${conn.to}"`)
    if (conn.fromPort !== 'output' || conn.toPort !== 'input') {
      lines.push(`    ports: ${conn.fromPort} -> ${conn.toPort}`)
    }
  })

  return lines.join('\n')
}

// Parse code back to workflow (simplified parser)
function codeToWorkflow(code: string): {
  nodes: WorkflowNode[]
  connections: Connection[]
  metadata: Partial<WorkflowMetadata>
  errors: ValidationError[]
} {
  const errors: ValidationError[] = []
  const nodes: WorkflowNode[] = []
  const connections: Connection[] = []
  const metadata: Partial<WorkflowMetadata> = {}

  const lines = code.split('\n')
  let currentSection: 'root' | 'nodes' | 'connections' = 'root'
  let currentNode: Partial<WorkflowNode> | null = null
  let currentData: Record<string, unknown> = {}
  let inDataSection = false
  let multilineKey = ''
  let multilineValue: string[] = []

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim()

    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '') {
      return
    }

    // Section detection
    if (trimmed === 'nodes:') {
      currentSection = 'nodes'
      return
    }
    if (trimmed === 'connections:') {
      // Save any pending node
      if (currentNode && currentNode.id) {
        currentNode.data = currentData
        nodes.push(currentNode as WorkflowNode)
        currentNode = null
        currentData = {}
      }
      currentSection = 'connections'
      return
    }

    // Root metadata
    if (currentSection === 'root') {
      const nameMatch = trimmed.match(/^name:\s*"(.+)"$/)
      if (nameMatch) {
        metadata.name = nameMatch[1]
      }
      const versionMatch = trimmed.match(/^version:\s*"(.+)"$/)
      if (versionMatch) {
        metadata.version = versionMatch[1]
      }
      const descMatch = trimmed.match(/^description:\s*"(.+)"$/)
      if (descMatch) {
        metadata.description = descMatch[1]
      }
      const tagsMatch = trimmed.match(/^tags:\s*\[(.+)\]$/)
      if (tagsMatch) {
        metadata.tags = tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''))
      }
    }

    // Nodes section
    if (currentSection === 'nodes') {
      // Check for multiline continuation
      if (multilineKey && line.startsWith('        ')) {
        multilineValue.push(line.substring(8))
        return
      } else if (multilineKey) {
        currentData[multilineKey] = multilineValue.join('\n')
        multilineKey = ''
        multilineValue = []
      }

      // New node
      if (trimmed.startsWith('- id:')) {
        // Save previous node
        if (currentNode && currentNode.id) {
          currentNode.data = currentData
          nodes.push(currentNode as WorkflowNode)
        }
        currentNode = { variables: [] }
        currentData = {}
        inDataSection = false

        const idMatch = trimmed.match(/- id:\s*"(.+)"$/)
        if (idMatch) {
          currentNode.id = idMatch[1]
        }
        return
      }

      if (currentNode) {
        if (trimmed.startsWith('type:')) {
          currentNode.type = trimmed.replace('type:', '').trim() as WorkflowNode['type']
        } else if (trimmed.startsWith('label:')) {
          const labelMatch = trimmed.match(/label:\s*"(.+)"$/)
          if (labelMatch) {
            currentNode.label = labelMatch[1]
          }
        } else if (trimmed.startsWith('position:')) {
          const posMatch = trimmed.match(/position:\s*\{\s*x:\s*(\d+),\s*y:\s*(\d+)\s*\}/)
          if (posMatch) {
            currentNode.position = { x: parseInt(posMatch[1]), y: parseInt(posMatch[2]) }
          }
        } else if (trimmed === 'data:') {
          inDataSection = true
        } else if (inDataSection && trimmed.match(/^\w+:/)) {
          const keyMatch = trimmed.match(/^(\w+):\s*(.*)$/)
          if (keyMatch) {
            const [, key, value] = keyMatch
            if (value === '|') {
              multilineKey = key
              multilineValue = []
            } else if (value.startsWith('"') && value.endsWith('"')) {
              currentData[key] = value.slice(1, -1)
            } else if (value.startsWith('[') && value.endsWith(']')) {
              try {
                currentData[key] = JSON.parse(value.replace(/"/g, '"'))
              } catch {
                currentData[key] = value
              }
            } else if (!isNaN(Number(value))) {
              currentData[key] = Number(value)
            } else if (value === 'true' || value === 'false') {
              currentData[key] = value === 'true'
            } else {
              currentData[key] = value
            }
          }
        }
      }
    }

    // Connections section
    if (currentSection === 'connections') {
      const connMatch = trimmed.match(/- from:\s*"(.+)"\s*->\s*to:\s*"(.+)"$/)
      if (connMatch) {
        connections.push({
          id: `c${connections.length + 1}`,
          from: connMatch[1],
          to: connMatch[2],
          fromPort: 'output',
          toPort: 'input'
        })
      }
    }
  })

  // Save last node
  if (currentNode && currentNode.id) {
    currentNode.data = currentData
    nodes.push(currentNode as WorkflowNode)
  }

  return { nodes, connections, metadata, errors }
}

// Validate code syntax
function validateCode(code: string): ValidationError[] {
  const errors: ValidationError[] = []
  const lines = code.split('\n')

  lines.forEach((line, index) => {
    // Check for basic syntax issues
    if (line.includes('::')) {
      errors.push({
        line: index + 1,
        column: line.indexOf('::'),
        message: 'Invalid syntax: double colon',
        severity: 'error'
      })
    }

    // Check for unmatched quotes
    const quoteCount = (line.match(/"/g) || []).length
    if (quoteCount % 2 !== 0) {
      errors.push({
        line: index + 1,
        column: line.lastIndexOf('"'),
        message: 'Unmatched quote',
        severity: 'error'
      })
    }
  })

  return errors
}

export function DualAuthoringPanel({
  nodes,
  connections,
  metadata,
  onNodesChange,
  onConnectionsChange,
  onMetadataChange,
  mode,
  onModeChange,
  className
}: DualAuthoringPanelProps) {
  const [codeContent, setCodeContent] = useState('')
  const [lastSyncedContent, setLastSyncedContent] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [showMinimap, setShowMinimap] = useState(false)
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error'>('synced')

  // Generate code from visual when switching to code mode
  useEffect(() => {
    if (mode === 'code' || mode === 'split') {
      const generatedCode = workflowToCode(nodes, connections, metadata)
      setCodeContent(generatedCode)
      setLastSyncedContent(generatedCode)
    }
  }, [mode]) // Only regenerate when mode changes

  // Validate code on change
  useEffect(() => {
    const errors = validateCode(codeContent)
    setValidationErrors(errors)
    setSyncStatus(codeContent === lastSyncedContent ? 'synced' : 'pending')
  }, [codeContent, lastSyncedContent])

  const isDirty = useMemo(() => {
    return codeContent !== lastSyncedContent
  }, [codeContent, lastSyncedContent])

  const handleCodeChange = useCallback((newCode: string) => {
    setUndoStack(prev => [...prev.slice(-50), codeContent])
    setRedoStack([])
    setCodeContent(newCode)
  }, [codeContent])

  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousContent = undoStack[undoStack.length - 1]
      setRedoStack(prev => [...prev, codeContent])
      setUndoStack(prev => prev.slice(0, -1))
      setCodeContent(previousContent)
    }
  }, [undoStack, codeContent])

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[redoStack.length - 1]
      setUndoStack(prev => [...prev, codeContent])
      setRedoStack(prev => prev.slice(0, -1))
      setCodeContent(nextContent)
    }
  }, [redoStack, codeContent])

  const handleSyncToVisual = useCallback(() => {
    if (validationErrors.filter(e => e.severity === 'error').length > 0) {
      setSyncStatus('error')
      return
    }

    const { nodes: parsedNodes, connections: parsedConnections, metadata: parsedMetadata, errors } = codeToWorkflow(codeContent)

    if (errors.length > 0) {
      setValidationErrors(prev => [...prev, ...errors])
      setSyncStatus('error')
      return
    }

    onNodesChange(parsedNodes)
    onConnectionsChange(parsedConnections)
    if (parsedMetadata.name) {
      onMetadataChange({ ...metadata, ...parsedMetadata })
    }

    setLastSyncedContent(codeContent)
    setSyncStatus('synced')
  }, [codeContent, validationErrors, onNodesChange, onConnectionsChange, onMetadataChange, metadata])

  const handleSyncFromVisual = useCallback(() => {
    const generatedCode = workflowToCode(nodes, connections, metadata)
    setCodeContent(generatedCode)
    setLastSyncedContent(generatedCode)
    setSyncStatus('synced')
  }, [nodes, connections, metadata])

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(codeContent)
  }, [codeContent])

  const handleExportCode = useCallback(() => {
    const blob = new Blob([codeContent], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${metadata.name.replace(/\s+/g, '-').toLowerCase()}.flow.yaml`
    a.click()
    URL.revokeObjectURL(url)
  }, [codeContent, metadata.name])

  const handleImportCode = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.yaml,.yml,.flow'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const content = event.target?.result as string
          setCodeContent(content)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }, [])

  const lineCount = useMemo(() => codeContent.split('\n').length, [codeContent])

  return (
    <TooltipProvider>
      <div className={`flex flex-col h-full bg-background ${className}`}>
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 border-b bg-muted/30">
          <div className="flex items-center gap-1">
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-md p-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={mode === 'visual' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => onModeChange('visual')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Visual Mode</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={mode === 'split' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => onModeChange('split')}
                  >
                    <SplitSquareVertical className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Split View</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={mode === 'code' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => onModeChange('code')}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Code Mode</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6 mx-2" />

            {/* Sync Controls */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={handleSyncToVisual}
                    disabled={!isDirty || validationErrors.filter(e => e.severity === 'error').length > 0}
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-1" />
                    Apply
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Apply code changes to visual</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={handleSyncFromVisual}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerate from visual</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6 mx-2" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync Status */}
            <div className="flex items-center gap-1.5">
              {syncStatus === 'synced' && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Synced
                </Badge>
              )}
              {syncStatus === 'pending' && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <RefreshCw className="h-3 w-3 text-yellow-500" />
                  Pending
                </Badge>
              )}
              {syncStatus === 'error' && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  Error
                </Badge>
              )}
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCopyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy Code</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleExportCode}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export YAML</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleImportCode}>
                    <Upload className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import YAML</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* View Options */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showLineNumbers ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setShowLineNumbers(!showLineNumbers)}
                  >
                    <Braces className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Line Numbers</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        {(mode === 'code' || mode === 'split') && (
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full">
              {/* Line Numbers */}
              {showLineNumbers && (
                <div className="w-12 bg-muted/30 border-r text-right pr-2 py-2 font-mono text-xs text-muted-foreground select-none">
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div
                      key={i}
                      className={`leading-5 ${
                        validationErrors.some(e => e.line === i + 1)
                          ? 'text-destructive font-bold'
                          : ''
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              )}

              {/* Code Editor */}
              <ScrollArea className="flex-1">
                <textarea
                  value={codeContent}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full h-full min-h-[400px] p-2 font-mono text-sm bg-transparent resize-none focus:outline-none leading-5"
                  spellCheck={false}
                  style={{
                    tabSize: 2
                  }}
                />
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="border-t bg-destructive/5 p-2 max-h-32 overflow-auto">
            <div className="text-xs font-medium text-destructive mb-1">
              {validationErrors.length} issue{validationErrors.length > 1 ? 's' : ''}
            </div>
            {validationErrors.map((error, i) => (
              <div
                key={i}
                className={`text-xs py-0.5 flex items-center gap-2 ${
                  error.severity === 'error'
                    ? 'text-destructive'
                    : error.severity === 'warning'
                    ? 'text-yellow-600'
                    : 'text-muted-foreground'
                }`}
              >
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span>Line {error.line}: {error.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 py-1 border-t bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{lineCount} lines</span>
            <span>{codeContent.length} chars</span>
            <span>{nodes.length} nodes</span>
            <span>{connections.length} connections</span>
          </div>
          <div className="flex items-center gap-2">
            <FileJson className="h-3 w-3" />
            <span>FlowCraft YAML</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default DualAuthoringPanel
