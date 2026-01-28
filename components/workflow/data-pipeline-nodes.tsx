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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Database,
  FileInput,
  Filter,
  Layers,
  Merge,
  Split,
  ArrowRightLeft,
  Workflow,
  Zap,
  CheckCircle2,
  AlertCircle,
  Play,
  Settings2,
  Code,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  FileJson,
  Table,
  FileText,
  Globe,
  Cloud
} from "lucide-react"

// ============================================
// DATA INGESTION NODE
// ============================================

export interface DataIngestionConfig {
  id: string
  name: string
  sourceType: 'file' | 'database' | 'api' | 'stream' | 'queue'
  sourceConfig: Record<string, unknown>
  schema?: SchemaField[]
  validation: {
    enabled: boolean
    rules: ValidationRule[]
  }
  sampling: {
    enabled: boolean
    rate: number
    method: 'random' | 'systematic' | 'stratified'
  }
}

export interface SchemaField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  required: boolean
  description?: string
}

export interface ValidationRule {
  field: string
  rule: 'required' | 'type' | 'range' | 'regex' | 'custom'
  config: Record<string, unknown>
}

interface DataIngestionNodeProps {
  config: DataIngestionConfig
  onConfigChange: (config: DataIngestionConfig) => void
}

export function DataIngestionNode({ config, onConfigChange }: DataIngestionNodeProps) {
  const [activeTab, setActiveTab] = useState("source")

  const sourceTypeIcons = {
    file: <FileInput className="h-4 w-4" />,
    database: <Database className="h-4 w-4" />,
    api: <Globe className="h-4 w-4" />,
    stream: <Zap className="h-4 w-4" />,
    queue: <Cloud className="h-4 w-4" />
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 p-4 border-b">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <FileInput className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold">{config.name || "Data Ingestion"}</h3>
          <p className="text-xs text-muted-foreground">Import and validate source data</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-9">
            <TabsTrigger value="source" className="text-xs">Source</TabsTrigger>
            <TabsTrigger value="schema" className="text-xs">Schema</TabsTrigger>
            <TabsTrigger value="validation" className="text-xs">Validation</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="source" className="m-0 space-y-4">
            <div className="space-y-2">
              <Label>Source Type</Label>
              <div className="grid grid-cols-5 gap-2">
                {(['file', 'database', 'api', 'stream', 'queue'] as const).map(type => (
                  <Button
                    key={type}
                    variant={config.sourceType === type ? "default" : "outline"}
                    size="sm"
                    className="flex-col h-16 gap-1"
                    onClick={() => onConfigChange({ ...config, sourceType: type })}
                  >
                    {sourceTypeIcons[type]}
                    <span className="text-[10px] capitalize">{type}</span>
                  </Button>
                ))}
              </div>
            </div>

            {config.sourceType === 'file' && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <Label>File Format</Label>
                    <Select defaultValue="csv">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="parquet">Parquet</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>File Path / URL</Label>
                    <Input placeholder="s3://bucket/data.csv" />
                  </div>
                </CardContent>
              </Card>
            )}

            {config.sourceType === 'database' && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Database Type</Label>
                    <Select defaultValue="postgres">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postgres">PostgreSQL</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="mongodb">MongoDB</SelectItem>
                        <SelectItem value="snowflake">Snowflake</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Connection String</Label>
                    <Input type="password" placeholder="postgresql://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Query</Label>
                    <Textarea placeholder="SELECT * FROM ..." className="font-mono text-xs" />
                  </div>
                </CardContent>
              </Card>
            )}

            {config.sourceType === 'api' && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Endpoint URL</Label>
                    <Input placeholder="https://api.example.com/data" />
                  </div>
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select defaultValue="GET">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Headers (JSON)</Label>
                    <Textarea placeholder='{"Authorization": "Bearer ..."}' className="font-mono text-xs" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Sampling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Enable Sampling</Label>
                  <Switch
                    checked={config.sampling.enabled}
                    onCheckedChange={(enabled) =>
                      onConfigChange({ ...config, sampling: { ...config.sampling, enabled } })
                    }
                  />
                </div>
                {config.sampling.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Sample Rate (%)</Label>
                      <Input
                        type="number"
                        value={config.sampling.rate}
                        onChange={(e) =>
                          onConfigChange({
                            ...config,
                            sampling: { ...config.sampling, rate: parseInt(e.target.value) }
                          })
                        }
                        min={1}
                        max={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <Select
                        value={config.sampling.method}
                        onValueChange={(method: 'random' | 'systematic' | 'stratified') =>
                          onConfigChange({ ...config, sampling: { ...config.sampling, method } })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">Random</SelectItem>
                          <SelectItem value="systematic">Systematic</SelectItem>
                          <SelectItem value="stratified">Stratified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schema" className="m-0 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Schema Definition</Label>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-3 w-3 mr-1" />
                Auto-detect
              </Button>
            </div>
            <div className="space-y-2">
              {config.schema?.map((field, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <Input value={field.name} placeholder="field_name" className="flex-1 h-8" />
                  <Select value={field.type}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Switch checked={field.required} />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-3 w-3 mr-1" />
                Add Field
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="validation" className="m-0 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Data Validation</Label>
              <Switch
                checked={config.validation.enabled}
                onCheckedChange={(enabled) =>
                  onConfigChange({ ...config, validation: { ...config.validation, enabled } })
                }
              />
            </div>
            {config.validation.enabled && (
              <div className="space-y-2">
                <Card>
                  <CardContent className="p-3 flex items-center justify-between">
                    <span className="text-sm">Check required fields</span>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center justify-between">
                    <span className="text-sm">Validate data types</span>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center justify-between">
                    <span className="text-sm">Check for duplicates</span>
                    <Switch defaultChecked />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

// ============================================
// DATA TRANSFORMATION NODE
// ============================================

export interface TransformationStep {
  id: string
  type: 'map' | 'filter' | 'aggregate' | 'join' | 'split' | 'enrich'
  config: Record<string, unknown>
  enabled: boolean
}

export interface DataTransformConfig {
  id: string
  name: string
  steps: TransformationStep[]
  parallelism: number
  errorHandling: 'skip' | 'fail' | 'quarantine'
}

interface DataTransformNodeProps {
  config: DataTransformConfig
  onConfigChange: (config: DataTransformConfig) => void
}

export function DataTransformNode({ config, onConfigChange }: DataTransformNodeProps) {
  const [activeTab, setActiveTab] = useState("pipeline")

  const stepIcons = {
    map: <ArrowRightLeft className="h-4 w-4" />,
    filter: <Filter className="h-4 w-4" />,
    aggregate: <Layers className="h-4 w-4" />,
    join: <Merge className="h-4 w-4" />,
    split: <Split className="h-4 w-4" />,
    enrich: <Zap className="h-4 w-4" />
  }

  const addStep = (type: TransformationStep['type']) => {
    const newStep: TransformationStep = {
      id: `step-${Date.now()}`,
      type,
      config: {},
      enabled: true
    }
    onConfigChange({ ...config, steps: [...config.steps, newStep] })
  }

  const removeStep = (id: string) => {
    onConfigChange({ ...config, steps: config.steps.filter(s => s.id !== id) })
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 p-4 border-b">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <Workflow className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h3 className="font-semibold">{config.name || "Data Transform"}</h3>
          <p className="text-xs text-muted-foreground">Transform and enrich data</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-9">
            <TabsTrigger value="pipeline" className="text-xs">Pipeline</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="pipeline" className="m-0 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Transformation Steps</Label>
              <Select onValueChange={(type: TransformationStep['type']) => addStep(type)}>
                <SelectTrigger className="w-32 h-8">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Step
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="map">Map</SelectItem>
                  <SelectItem value="filter">Filter</SelectItem>
                  <SelectItem value="aggregate">Aggregate</SelectItem>
                  <SelectItem value="join">Join</SelectItem>
                  <SelectItem value="split">Split</SelectItem>
                  <SelectItem value="enrich">Enrich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {config.steps.map((step, index) => (
                <Card key={step.id} className={!step.enabled ? 'opacity-50' : ''}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="p-1.5 rounded bg-muted">
                        {stepIcons[step.type]}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium capitalize">{step.type}</span>
                        <p className="text-xs text-muted-foreground">
                          {step.type === 'map' && 'Transform field values'}
                          {step.type === 'filter' && 'Filter rows by condition'}
                          {step.type === 'aggregate' && 'Group and aggregate data'}
                          {step.type === 'join' && 'Join with another dataset'}
                          {step.type === 'split' && 'Split into multiple streams'}
                          {step.type === 'enrich' && 'Enrich with external data'}
                        </p>
                      </div>
                      <Switch
                        checked={step.enabled}
                        onCheckedChange={(enabled) => {
                          const newSteps = config.steps.map(s =>
                            s.id === step.id ? { ...s, enabled } : s
                          )
                          onConfigChange({ ...config, steps: newSteps })
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => removeStep(step.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Step-specific configuration */}
                    {step.type === 'map' && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="flex items-center gap-2">
                          <Input placeholder="source_field" className="flex-1 h-7 text-xs" />
                          <span className="text-muted-foreground">→</span>
                          <Input placeholder="target_field" className="flex-1 h-7 text-xs" />
                        </div>
                        <Textarea
                          placeholder="Transformation expression..."
                          className="font-mono text-xs min-h-[60px]"
                        />
                      </div>
                    )}

                    {step.type === 'filter' && (
                      <div className="mt-3 pt-3 border-t">
                        <Textarea
                          placeholder="Filter condition: row.amount > 1000 && row.status === 'active'"
                          className="font-mono text-xs min-h-[60px]"
                        />
                      </div>
                    )}

                    {step.type === 'aggregate' && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Group By</Label>
                          <Input placeholder="category, region" className="h-7 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Aggregations</Label>
                          <Input placeholder="SUM(amount), COUNT(*), AVG(price)" className="h-7 text-xs font-mono" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {config.steps.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <Workflow className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">No transformation steps</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add steps to build your pipeline
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="m-0 space-y-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Processing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Parallelism</Label>
                  <Input
                    type="number"
                    value={config.parallelism}
                    onChange={(e) =>
                      onConfigChange({ ...config, parallelism: parseInt(e.target.value) })
                    }
                    min={1}
                    max={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of parallel workers for processing
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Error Handling</Label>
                  <Select
                    value={config.errorHandling}
                    onValueChange={(v: 'skip' | 'fail' | 'quarantine') =>
                      onConfigChange({ ...config, errorHandling: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Skip failed rows</SelectItem>
                      <SelectItem value="fail">Fail on first error</SelectItem>
                      <SelectItem value="quarantine">Quarantine failed rows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="m-0 space-y-4">
            <Card>
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Data Preview</CardTitle>
                <Button variant="outline" size="sm">
                  <Play className="h-3 w-3 mr-1" />
                  Run Preview
                </Button>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 text-center text-muted-foreground text-sm">
                  Run preview to see transformed data
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

// ============================================
// DATA OUTPUT NODE
// ============================================

export interface DataOutputConfig {
  id: string
  name: string
  destinationType: 'file' | 'database' | 'api' | 'queue'
  destinationConfig: Record<string, unknown>
  format: 'json' | 'csv' | 'parquet'
  writeMode: 'append' | 'overwrite' | 'upsert'
  partitioning?: {
    enabled: boolean
    keys: string[]
  }
}

interface DataOutputNodeProps {
  config: DataOutputConfig
  onConfigChange: (config: DataOutputConfig) => void
}

export function DataOutputNode({ config, onConfigChange }: DataOutputNodeProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 p-4 border-b">
        <div className="p-2 rounded-lg bg-green-500/10">
          <Database className="h-5 w-5 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold">{config.name || "Data Output"}</h3>
          <p className="text-xs text-muted-foreground">Write data to destination</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 space-y-4">
        <div className="space-y-2">
          <Label>Destination Type</Label>
          <div className="grid grid-cols-4 gap-2">
            {(['file', 'database', 'api', 'queue'] as const).map(type => (
              <Button
                key={type}
                variant={config.destinationType === type ? "default" : "outline"}
                size="sm"
                className="capitalize"
                onClick={() => onConfigChange({ ...config, destinationType: type })}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Output Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select
                value={config.format}
                onValueChange={(v: 'json' | 'csv' | 'parquet') =>
                  onConfigChange({ ...config, format: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="parquet">Parquet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Write Mode</Label>
              <Select
                value={config.writeMode}
                onValueChange={(v: 'append' | 'overwrite' | 'upsert') =>
                  onConfigChange({ ...config, writeMode: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="append">Append</SelectItem>
                  <SelectItem value="overwrite">Overwrite</SelectItem>
                  <SelectItem value="upsert">Upsert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.destinationType === 'file' && (
              <div className="space-y-2">
                <Label>Output Path</Label>
                <Input placeholder="s3://bucket/output/" />
              </div>
            )}

            {config.destinationType === 'database' && (
              <>
                <div className="space-y-2">
                  <Label>Connection</Label>
                  <Select defaultValue="default">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Production DB</SelectItem>
                      <SelectItem value="warehouse">Data Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Table Name</Label>
                  <Input placeholder="schema.table_name" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Partitioning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Enable Partitioning</Label>
              <Switch
                checked={config.partitioning?.enabled}
                onCheckedChange={(enabled) =>
                  onConfigChange({
                    ...config,
                    partitioning: { ...config.partitioning, enabled, keys: config.partitioning?.keys || [] }
                  })
                }
              />
            </div>
            {config.partitioning?.enabled && (
              <div className="space-y-2">
                <Label>Partition Keys</Label>
                <Input
                  placeholder="date, region"
                  value={config.partitioning.keys.join(', ')}
                  onChange={(e) =>
                    onConfigChange({
                      ...config,
                      partitioning: {
                        ...config.partitioning!,
                        keys: e.target.value.split(',').map(k => k.trim())
                      }
                    })
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollArea>
    </div>
  )
}

// Export all components
export default {
  DataIngestionNode,
  DataTransformNode,
  DataOutputNode
}
