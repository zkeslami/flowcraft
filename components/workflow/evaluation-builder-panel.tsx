"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FlaskConical,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  RefreshCw,
  Settings2,
  Eye,
  Edit3,
  Copy,
  History,
  GitCompare,
  Zap,
  Clock,
  Filter
} from "lucide-react"

// Types for Evaluation System
export interface EvaluationDatapoint {
  id: string
  input: Record<string, unknown>
  expectedOutput: Record<string, unknown>
  metadata?: Record<string, unknown>
  tags?: string[]
  source?: 'manual' | 'production' | 'synthetic'
}

export interface EvaluatorConfig {
  id: string
  name: string
  type: 'exact_match' | 'fuzzy_match' | 'llm_judge' | 'custom' | 'semantic_similarity' | 'regex'
  field: string
  threshold?: number
  weight: number
  config?: Record<string, unknown>
}

export interface EvaluationResult {
  datapointId: string
  evaluatorId: string
  passed: boolean
  score: number
  actual: unknown
  expected: unknown
  feedback?: string
  latencyMs?: number
}

export interface EvaluationRun {
  id: string
  evaluationSetId: string
  startedAt: string
  completedAt?: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  results: EvaluationResult[]
  summary: {
    totalDatapoints: number
    passedDatapoints: number
    failedDatapoints: number
    avgScore: number
    avgLatency: number
  }
  version: string
}

export interface EvaluationSet {
  id: string
  name: string
  description?: string
  flowId: string
  nodeId?: string
  datapoints: EvaluationDatapoint[]
  evaluators: EvaluatorConfig[]
  createdAt: string
  updatedAt: string
  lastRunAt?: string
  runs: EvaluationRun[]
}

interface EvaluationBuilderPanelProps {
  evaluationSet?: EvaluationSet
  onSave: (set: EvaluationSet) => void
  onRun: (setId: string) => void
  className?: string
}

// Mock data
const mockEvaluationSet: EvaluationSet = {
  id: "eval-001",
  name: "Invoice Validation Accuracy",
  description: "Measures the accuracy of invoice validation agent",
  flowId: "flow-001",
  nodeId: "3",
  createdAt: "2024-01-10T10:00:00Z",
  updatedAt: "2024-01-15T14:30:00Z",
  lastRunAt: "2024-01-15T14:30:00Z",
  datapoints: [
    {
      id: "dp-001",
      input: { invoiceId: "INV-001", vendor: "Acme Corp", amount: 15000 },
      expectedOutput: { isValid: true, confidence: 0.95 },
      tags: ["high-value", "known-vendor"],
      source: 'production'
    },
    {
      id: "dp-002",
      input: { invoiceId: "INV-002", vendor: "Unknown LLC", amount: 500 },
      expectedOutput: { isValid: false, requiresReview: true },
      tags: ["new-vendor"],
      source: 'production'
    },
    {
      id: "dp-003",
      input: { invoiceId: "INV-003", vendor: "Acme Corp", amount: 250000 },
      expectedOutput: { isValid: false, flagged: true, reason: "amount_exceeds_threshold" },
      tags: ["high-value", "edge-case"],
      source: 'manual'
    }
  ],
  evaluators: [
    { id: "ev-001", name: "Validity Match", type: 'exact_match', field: "isValid", weight: 1.0 },
    { id: "ev-002", name: "Confidence Score", type: 'fuzzy_match', field: "confidence", threshold: 0.1, weight: 0.5 },
    { id: "ev-003", name: "Overall Quality", type: 'llm_judge', field: "*", weight: 0.8, config: { model: "gpt-4" } }
  ],
  runs: [
    {
      id: "run-001",
      evaluationSetId: "eval-001",
      startedAt: "2024-01-15T14:30:00Z",
      completedAt: "2024-01-15T14:32:00Z",
      status: 'completed',
      version: "2.1.0",
      results: [
        { datapointId: "dp-001", evaluatorId: "ev-001", passed: true, score: 1.0, actual: true, expected: true },
        { datapointId: "dp-001", evaluatorId: "ev-002", passed: true, score: 0.96, actual: 0.96, expected: 0.95 },
        { datapointId: "dp-002", evaluatorId: "ev-001", passed: true, score: 1.0, actual: false, expected: false },
        { datapointId: "dp-003", evaluatorId: "ev-001", passed: false, score: 0, actual: true, expected: false }
      ],
      summary: {
        totalDatapoints: 3,
        passedDatapoints: 2,
        failedDatapoints: 1,
        avgScore: 0.87,
        avgLatency: 1250
      }
    }
  ]
}

export function EvaluationBuilderPanel({
  evaluationSet = mockEvaluationSet,
  onSave,
  onRun,
  className
}: EvaluationBuilderPanelProps) {
  const [activeTab, setActiveTab] = useState("datapoints")
  const [selectedDatapoints, setSelectedDatapoints] = useState<Set<string>>(new Set())
  const [isRunning, setIsRunning] = useState(false)
  const [runProgress, setRunProgress] = useState(0)
  const [editingSet, setEditingSet] = useState<EvaluationSet>(evaluationSet)

  const latestRun = useMemo(() => {
    if (editingSet.runs.length === 0) return null
    return editingSet.runs[editingSet.runs.length - 1]
  }, [editingSet.runs])

  const handleRunEvaluation = () => {
    setIsRunning(true)
    setRunProgress(0)

    // Simulate evaluation progress
    const interval = setInterval(() => {
      setRunProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsRunning(false)
          return 100
        }
        return prev + 10
      })
    }, 300)

    onRun(editingSet.id)
  }

  const handleAddDatapoint = () => {
    const newDatapoint: EvaluationDatapoint = {
      id: `dp-${Date.now()}`,
      input: {},
      expectedOutput: {},
      source: 'manual'
    }
    setEditingSet({
      ...editingSet,
      datapoints: [...editingSet.datapoints, newDatapoint]
    })
  }

  const handleDeleteDatapoints = () => {
    setEditingSet({
      ...editingSet,
      datapoints: editingSet.datapoints.filter(dp => !selectedDatapoints.has(dp.id))
    })
    setSelectedDatapoints(new Set())
  }

  const handleAddEvaluator = () => {
    const newEvaluator: EvaluatorConfig = {
      id: `ev-${Date.now()}`,
      name: "New Evaluator",
      type: 'exact_match',
      field: "",
      weight: 1.0
    }
    setEditingSet({
      ...editingSet,
      evaluators: [...editingSet.evaluators, newEvaluator]
    })
  }

  const handleUpdateEvaluator = (id: string, updates: Partial<EvaluatorConfig>) => {
    setEditingSet({
      ...editingSet,
      evaluators: editingSet.evaluators.map(ev =>
        ev.id === id ? { ...ev, ...updates } : ev
      )
    })
  }

  const handleRemoveEvaluator = (id: string) => {
    setEditingSet({
      ...editingSet,
      evaluators: editingSet.evaluators.filter(ev => ev.id !== id)
    })
  }

  const toggleSelectDatapoint = (id: string) => {
    setSelectedDatapoints(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedDatapoints.size === editingSet.datapoints.length) {
      setSelectedDatapoints(new Set())
    } else {
      setSelectedDatapoints(new Set(editingSet.datapoints.map(dp => dp.id)))
    }
  }

  const getResultForDatapoint = (datapointId: string, evaluatorId: string) => {
    return latestRun?.results.find(
      r => r.datapointId === datapointId && r.evaluatorId === evaluatorId
    )
  }

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <FlaskConical className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{editingSet.name}</h2>
            <p className="text-sm text-muted-foreground">
              {editingSet.datapoints.length} datapoints • {editingSet.evaluators.length} evaluators
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button variant="destructive" size="sm" onClick={() => setIsRunning(false)}>
              <Square className="h-4 w-4 mr-1" />
              Stop
            </Button>
          ) : (
            <Button size="sm" onClick={handleRunEvaluation}>
              <Play className="h-4 w-4 mr-1" />
              Run Evaluation
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onSave(editingSet)}>
            Save
          </Button>
        </div>
      </div>

      {/* Progress Bar (when running) */}
      {isRunning && (
        <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/20 border-b">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Running evaluation...</span>
            <span className="text-sm text-muted-foreground">{runProgress}%</span>
          </div>
          <Progress value={runProgress} className="h-2" />
        </div>
      )}

      {/* Summary Cards */}
      {latestRun && (
        <div className="grid grid-cols-4 gap-3 p-4 border-b">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pass Rate</p>
                  <p className="text-2xl font-bold">
                    {Math.round((latestRun.summary.passedDatapoints / latestRun.summary.totalDatapoints) * 100)}%
                  </p>
                </div>
                {(latestRun.summary.passedDatapoints / latestRun.summary.totalDatapoints) >= 0.9 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Avg Score</p>
              <p className="text-2xl font-bold">{latestRun.summary.avgScore.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Passed</p>
              <p className="text-2xl font-bold text-green-600">{latestRun.summary.passedDatapoints}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-600">{latestRun.summary.failedDatapoints}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-10">
            <TabsTrigger value="datapoints" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Datapoints
            </TabsTrigger>
            <TabsTrigger value="evaluators" className="gap-2">
              <Target className="h-4 w-4" />
              Evaluators
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Datapoints Tab */}
          <TabsContent value="datapoints" className="p-4 m-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleAddDatapoint}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Datapoint
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Import CSV
                </Button>
                {selectedDatapoints.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={handleDeleteDatapoints}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete ({selectedDatapoints.size})
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="synthetic">Synthetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedDatapoints.size === editingSet.datapoints.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Input</TableHead>
                    <TableHead>Expected Output</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="w-20">Result</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editingSet.datapoints.map(dp => {
                    const results = editingSet.evaluators.map(ev => getResultForDatapoint(dp.id, ev.id))
                    const passed = results.every(r => r?.passed ?? true)

                    return (
                      <TableRow key={dp.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedDatapoints.has(dp.id)}
                            onCheckedChange={() => toggleSelectDatapoint(dp.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[200px] truncate">
                          {JSON.stringify(dp.input)}
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[200px] truncate">
                          {JSON.stringify(dp.expectedOutput)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {dp.tags?.map(tag => (
                              <Badge key={tag} variant="outline" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {dp.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {latestRun && (
                            passed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Evaluators Tab */}
          <TabsContent value="evaluators" className="p-4 m-0 space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleAddEvaluator}>
                <Plus className="h-4 w-4 mr-1" />
                Add Evaluator
              </Button>
            </div>

            <div className="space-y-3">
              {editingSet.evaluators.map(evaluator => (
                <Card key={evaluator.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Input
                            value={evaluator.name}
                            onChange={(e) => handleUpdateEvaluator(evaluator.id, { name: e.target.value })}
                            className="font-medium h-8 w-48"
                          />
                          <Select
                            value={evaluator.type}
                            onValueChange={(v: EvaluatorConfig['type']) =>
                              handleUpdateEvaluator(evaluator.id, { type: v })
                            }
                          >
                            <SelectTrigger className="w-40 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="exact_match">Exact Match</SelectItem>
                              <SelectItem value="fuzzy_match">Fuzzy Match</SelectItem>
                              <SelectItem value="llm_judge">LLM Judge</SelectItem>
                              <SelectItem value="semantic_similarity">Semantic Similarity</SelectItem>
                              <SelectItem value="regex">Regex Pattern</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Field to evaluate</Label>
                            <Input
                              value={evaluator.field}
                              onChange={(e) => handleUpdateEvaluator(evaluator.id, { field: e.target.value })}
                              placeholder="output.isValid"
                              className="h-8 font-mono text-xs"
                            />
                          </div>

                          {evaluator.type === 'fuzzy_match' && (
                            <div className="space-y-1">
                              <Label className="text-xs">Threshold</Label>
                              <Input
                                type="number"
                                value={evaluator.threshold || 0.1}
                                onChange={(e) => handleUpdateEvaluator(evaluator.id, {
                                  threshold: parseFloat(e.target.value)
                                })}
                                step={0.1}
                                min={0}
                                max={1}
                                className="h-8"
                              />
                            </div>
                          )}

                          <div className="space-y-1">
                            <Label className="text-xs">Weight</Label>
                            <Input
                              type="number"
                              value={evaluator.weight}
                              onChange={(e) => handleUpdateEvaluator(evaluator.id, {
                                weight: parseFloat(e.target.value)
                              })}
                              step={0.1}
                              min={0}
                              max={1}
                              className="h-8"
                            />
                          </div>
                        </div>

                        {evaluator.type === 'llm_judge' && (
                          <div className="space-y-1">
                            <Label className="text-xs">Judge Prompt</Label>
                            <Textarea
                              placeholder="Evaluate if the output correctly validates the invoice..."
                              className="text-xs min-h-[60px]"
                            />
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleRemoveEvaluator(evaluator.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="p-4 m-0 space-y-4">
            {latestRun ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Latest Run Results</h3>
                    <p className="text-sm text-muted-foreground">
                      Version {latestRun.version} • {new Date(latestRun.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      <GitCompare className="h-4 w-4 mr-1" />
                      Compare
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datapoint</TableHead>
                        {editingSet.evaluators.map(ev => (
                          <TableHead key={ev.id} className="text-center">
                            {ev.name}
                          </TableHead>
                        ))}
                        <TableHead className="text-center">Overall</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editingSet.datapoints.map(dp => {
                        const results = editingSet.evaluators.map(ev => getResultForDatapoint(dp.id, ev.id))
                        const allPassed = results.every(r => r?.passed ?? true)
                        const avgScore = results.reduce((sum, r) => sum + (r?.score ?? 0), 0) / results.length

                        return (
                          <TableRow key={dp.id}>
                            <TableCell className="font-mono text-xs">
                              {dp.id}
                            </TableCell>
                            {editingSet.evaluators.map(ev => {
                              const result = getResultForDatapoint(dp.id, ev.id)
                              return (
                                <TableCell key={ev.id} className="text-center">
                                  {result ? (
                                    <div className="flex flex-col items-center gap-1">
                                      {result.passed ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                      )}
                                      <span className="text-[10px] text-muted-foreground">
                                        {result.score.toFixed(2)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-center">
                              <Badge
                                variant={allPassed ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {avgScore.toFixed(2)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Failed Cases */}
                {latestRun.summary.failedDatapoints > 0 && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        Failed Cases ({latestRun.summary.failedDatapoints})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {latestRun.results.filter(r => !r.passed).map(result => (
                        <div
                          key={`${result.datapointId}-${result.evaluatorId}`}
                          className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs">{result.datapointId}</span>
                            <Badge variant="outline" className="text-xs">
                              {editingSet.evaluators.find(e => e.id === result.evaluatorId)?.name}
                            </Badge>
                          </div>
                          <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Expected:</span>{" "}
                              <code>{JSON.stringify(result.expected)}</code>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Actual:</span>{" "}
                              <code>{JSON.stringify(result.actual)}</code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <FlaskConical className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">No evaluation results yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Run an evaluation to see results here
                  </p>
                  <Button size="sm" className="mt-3" onClick={handleRunEvaluation}>
                    <Play className="h-4 w-4 mr-1" />
                    Run First Evaluation
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="p-4 m-0 space-y-3">
            {editingSet.runs.length > 0 ? (
              editingSet.runs.map(run => (
                <Card key={run.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          run.status === 'completed' ? 'bg-green-100 dark:bg-green-950/30' :
                          run.status === 'failed' ? 'bg-red-100 dark:bg-red-950/30' :
                          'bg-muted'
                        }`}>
                          {run.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : run.status === 'failed' ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Version {run.version}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(run.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {Math.round((run.summary.passedDatapoints / run.summary.totalDatapoints) * 100)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Pass Rate</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{run.summary.avgScore.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Avg Score</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">No run history</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Past evaluation runs will appear here
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

export default EvaluationBuilderPanel
