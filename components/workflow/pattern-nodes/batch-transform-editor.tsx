"use client"

import * as React from "react"
import { useState } from "react"
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
import {
  Table,
  Database,
  Play,
  Pause,
  RotateCcw,
  Upload,
  Download,
  FileSpreadsheet,
  Columns,
  Rows,
  Filter,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Settings2,
  Eye,
  Code,
  Sparkles
} from "lucide-react"

interface ColumnMapping {
  sourceColumn: string
  targetColumn: string
  transformation: string
  prompt?: string
  validation?: string
}

interface BatchTransformConfig {
  id: string
  name: string
  description: string
  sourceType: 'csv' | 'json' | 'database' | 'api'
  sourceConfig: Record<string, unknown>
  columnMappings: ColumnMapping[]
  batchSize: number
  parallelism: number
  errorHandling: 'skip' | 'retry' | 'fail'
  retryAttempts: number
  outputFormat: 'csv' | 'json' | 'database'
}

interface BatchProgress {
  totalRows: number
  processedRows: number
  successfulRows: number
  failedRows: number
  currentBatch: number
  totalBatches: number
  estimatedTimeRemaining: string
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed'
}

interface PreviewRow {
  input: Record<string, string>
  output: Record<string, string>
  status: 'pending' | 'success' | 'error'
  error?: string
}

interface BatchTransformEditorProps {
  config: BatchTransformConfig
  onConfigChange: (config: BatchTransformConfig) => void
  onRun?: () => void
  onPause?: () => void
  onCancel?: () => void
}

export function BatchTransformEditor({
  config,
  onConfigChange,
  onRun,
  onPause,
  onCancel
}: BatchTransformEditorProps) {
  const [activeTab, setActiveTab] = useState("source")
  const [progress, setProgress] = useState<BatchProgress>({
    totalRows: 1500,
    processedRows: 0,
    successfulRows: 0,
    failedRows: 0,
    currentBatch: 0,
    totalBatches: 15,
    estimatedTimeRemaining: "--:--",
    status: 'idle'
  })

  // Mock source columns for demo
  const sourceColumns = [
    "customer_id",
    "raw_feedback",
    "submission_date",
    "product_category",
    "rating"
  ]

  // Mock preview data
  const [previewRows] = useState<PreviewRow[]>([
    {
      input: { customer_id: "C001", raw_feedback: "The product quality is excellent but shipping was slow", rating: "4" },
      output: { sentiment: "mixed", themes: "quality, shipping", priority: "medium" },
      status: 'success'
    },
    {
      input: { customer_id: "C002", raw_feedback: "Terrible experience, product arrived damaged", rating: "1" },
      output: { sentiment: "negative", themes: "damage, quality", priority: "high" },
      status: 'success'
    },
    {
      input: { customer_id: "C003", raw_feedback: "Love it! Will buy again", rating: "5" },
      output: { sentiment: "positive", themes: "satisfaction", priority: "low" },
      status: 'success'
    }
  ])

  const updateMapping = (index: number, field: keyof ColumnMapping, value: string) => {
    const newMappings = [...config.columnMappings]
    newMappings[index] = { ...newMappings[index], [field]: value }
    onConfigChange({ ...config, columnMappings: newMappings })
  }

  const addMapping = () => {
    onConfigChange({
      ...config,
      columnMappings: [
        ...config.columnMappings,
        { sourceColumn: "", targetColumn: "", transformation: "passthrough" }
      ]
    })
  }

  const removeMapping = (index: number) => {
    const newMappings = config.columnMappings.filter((_, i) => i !== index)
    onConfigChange({ ...config, columnMappings: newMappings })
  }

  const progressPercent = progress.totalRows > 0
    ? Math.round((progress.processedRows / progress.totalRows) * 100)
    : 0

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Table className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{config.name || "Batch Transform"}</h2>
            <p className="text-sm text-muted-foreground">
              Process tabular data with AI-powered transformations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {progress.status === 'running' ? (
            <>
              <Button variant="outline" size="sm" onClick={onPause}>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
              <Button variant="destructive" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={onRun}>
              <Play className="h-4 w-4 mr-1" />
              Run Transform
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar (when running) */}
      {progress.status !== 'idle' && (
        <div className="px-4 py-3 bg-muted/30 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <Badge variant={
                progress.status === 'running' ? 'default' :
                progress.status === 'completed' ? 'secondary' :
                progress.status === 'paused' ? 'outline' : 'destructive'
              }>
                {progress.status === 'running' && <Zap className="h-3 w-3 mr-1 animate-pulse" />}
                {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Batch {progress.currentBatch} of {progress.totalBatches}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {progress.successfulRows}
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-4 w-4" />
                {progress.failedRows}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {progress.estimatedTimeRemaining}
              </span>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {progress.processedRows.toLocaleString()} / {progress.totalRows.toLocaleString()} rows ({progressPercent}%)
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-10">
            <TabsTrigger value="source" className="gap-2">
              <Database className="h-4 w-4" />
              Source
            </TabsTrigger>
            <TabsTrigger value="mappings" className="gap-2">
              <Columns className="h-4 w-4" />
              Mappings
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Source Tab */}
          <TabsContent value="source" className="p-4 space-y-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Source</CardTitle>
                <CardDescription>Configure where to read input data from</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Source Type</Label>
                  <Select
                    value={config.sourceType}
                    onValueChange={(value: 'csv' | 'json' | 'database' | 'api') =>
                      onConfigChange({ ...config, sourceType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV File</SelectItem>
                      <SelectItem value="json">JSON File</SelectItem>
                      <SelectItem value="database">Database Query</SelectItem>
                      <SelectItem value="api">REST API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.sourceType === 'csv' && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">Supports files up to 100MB</p>
                      <Button variant="outline" size="sm" className="mt-3">
                        Select File
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch id="has-header" defaultChecked />
                        <Label htmlFor="has-header" className="text-sm">Has header row</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Delimiter:</Label>
                        <Select defaultValue="comma">
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="comma">Comma</SelectItem>
                            <SelectItem value="tab">Tab</SelectItem>
                            <SelectItem value="semicolon">Semicolon</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {config.sourceType === 'database' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Connection String</Label>
                      <Input placeholder="postgresql://user:pass@host:5432/db" />
                    </div>
                    <div className="space-y-2">
                      <Label>SQL Query</Label>
                      <Textarea
                        placeholder="SELECT * FROM customers WHERE created_at > '2024-01-01'"
                        className="font-mono text-sm min-h-[100px]"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detected Schema */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detected Schema</CardTitle>
                <CardDescription>Columns found in your data source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {sourceColumns.map((col) => (
                    <Badge key={col} variant="outline" className="font-mono">
                      {col}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  <Rows className="h-4 w-4 inline mr-1" />
                  1,500 rows detected
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mappings Tab */}
          <TabsContent value="mappings" className="p-4 space-y-4 m-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Column Transformations</h3>
                <p className="text-sm text-muted-foreground">
                  Define how each column should be transformed
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addMapping}>
                Add Mapping
              </Button>
            </div>

            <div className="space-y-3">
              {config.columnMappings.map((mapping, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-[1fr_auto_1fr_1fr_auto] gap-3 items-start">
                      {/* Source Column */}
                      <div className="space-y-1">
                        <Label className="text-xs">Source Column</Label>
                        <Select
                          value={mapping.sourceColumn}
                          onValueChange={(v) => updateMapping(index, 'sourceColumn', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {sourceColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <ArrowRight className="h-4 w-4 mt-7 text-muted-foreground" />

                      {/* Transformation */}
                      <div className="space-y-1">
                        <Label className="text-xs">Transformation</Label>
                        <Select
                          value={mapping.transformation}
                          onValueChange={(v) => updateMapping(index, 'transformation', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="passthrough">Passthrough</SelectItem>
                            <SelectItem value="ai_classify">AI Classify</SelectItem>
                            <SelectItem value="ai_extract">AI Extract</SelectItem>
                            <SelectItem value="ai_summarize">AI Summarize</SelectItem>
                            <SelectItem value="ai_sentiment">AI Sentiment</SelectItem>
                            <SelectItem value="regex">Regex Extract</SelectItem>
                            <SelectItem value="lookup">Lookup Table</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Target Column */}
                      <div className="space-y-1">
                        <Label className="text-xs">Output Column</Label>
                        <Input
                          value={mapping.targetColumn}
                          onChange={(e) => updateMapping(index, 'targetColumn', e.target.value)}
                          placeholder="output_column"
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-6"
                        onClick={() => removeMapping(index)}
                      >
                        ×
                      </Button>
                    </div>

                    {/* AI Prompt (for AI transformations) */}
                    {mapping.transformation.startsWith('ai_') && (
                      <div className="mt-3 pt-3 border-t">
                        <Label className="text-xs">AI Prompt</Label>
                        <Textarea
                          value={mapping.prompt || ""}
                          onChange={(e) => updateMapping(index, 'prompt', e.target.value)}
                          placeholder={
                            mapping.transformation === 'ai_classify'
                              ? "Classify this text into one of: positive, negative, neutral"
                              : mapping.transformation === 'ai_extract'
                              ? "Extract the main topics from this feedback as a comma-separated list"
                              : "Describe what to do with this text..."
                          }
                          className="mt-1 text-sm min-h-[60px]"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {config.columnMappings.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">No mappings defined</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add column mappings to define transformations
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={addMapping}>
                    Add First Mapping
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="p-4 space-y-4 m-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Transform Preview</h3>
                <p className="text-sm text-muted-foreground">
                  Test transformations on sample rows before running
                </p>
              </div>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-1" />
                Refresh Preview
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Input</th>
                    <th className="text-left p-3 font-medium">Output</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">
                        {row.status === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : row.status === 'error' ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {Object.entries(row.input).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-muted-foreground">{key}:</span>{" "}
                              <span className="font-mono">{String(value).substring(0, 50)}...</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {Object.entries(row.output).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-muted-foreground">{key}:</span>{" "}
                              <Badge variant="secondary" className="font-mono text-xs">
                                {String(value)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="p-4 space-y-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Batch Settings</CardTitle>
                <CardDescription>Configure processing behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Batch Size</Label>
                    <span className="text-sm font-mono">{config.batchSize} rows</span>
                  </div>
                  <Slider
                    value={[config.batchSize]}
                    onValueChange={([v]) => onConfigChange({ ...config, batchSize: v })}
                    min={10}
                    max={500}
                    step={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of rows to process in each batch
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Parallelism</Label>
                    <span className="text-sm font-mono">{config.parallelism} concurrent</span>
                  </div>
                  <Slider
                    value={[config.parallelism]}
                    onValueChange={([v]) => onConfigChange({ ...config, parallelism: v })}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of batches to process simultaneously
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Error Handling</Label>
                  <Select
                    value={config.errorHandling}
                    onValueChange={(v: 'skip' | 'retry' | 'fail') =>
                      onConfigChange({ ...config, errorHandling: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Skip failed rows</SelectItem>
                      <SelectItem value="retry">Retry with backoff</SelectItem>
                      <SelectItem value="fail">Fail entire job</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.errorHandling === 'retry' && (
                  <div className="space-y-2">
                    <Label>Max Retry Attempts</Label>
                    <Input
                      type="number"
                      value={config.retryAttempts}
                      onChange={(e) => onConfigChange({
                        ...config,
                        retryAttempts: parseInt(e.target.value) || 3
                      })}
                      min={1}
                      max={10}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Output Configuration</CardTitle>
                <CardDescription>Where to save transformed data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select
                    value={config.outputFormat}
                    onValueChange={(v: 'csv' | 'json' | 'database') =>
                      onConfigChange({ ...config, outputFormat: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV File</SelectItem>
                      <SelectItem value="json">JSON File</SelectItem>
                      <SelectItem value="database">Database Table</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="p-4 space-y-4 m-0">
            {progress.status === 'completed' ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Transform Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{progress.totalRows.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Total Rows</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {progress.successfulRows.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Successful</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {progress.failedRows.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Results
                  </Button>
                  <Button variant="outline">
                    <Code className="h-4 w-4 mr-2" />
                    View Logs
                  </Button>
                </div>
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">No results yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Run a transform to see results here
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

export default BatchTransformEditor
