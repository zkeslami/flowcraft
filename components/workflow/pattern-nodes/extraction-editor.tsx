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
import { Checkbox } from "@/components/ui/checkbox"
import {
  FileSearch,
  Plus,
  Trash2,
  Play,
  Sparkles,
  CheckCircle2,
  Settings2,
  TestTube,
  Code,
  GripVertical,
  Braces,
  Type,
  Hash,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Link2,
  AlertCircle,
  Copy
} from "lucide-react"

interface ExtractionField {
  id: string
  name: string
  type: 'string' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'address' | 'array' | 'object'
  description: string
  required: boolean
  validation?: string
  examples?: string[]
  nestedFields?: ExtractionField[]
}

interface ExtractionConfig {
  id: string
  name: string
  description: string
  fields: ExtractionField[]
  inputField: string
  extractionMode: 'strict' | 'flexible' | 'best_effort'
  outputFormat: 'flat' | 'nested' | 'json_schema'
  includeConfidence: boolean
  includeSourceSpans: boolean
  systemPrompt: string
}

interface TestResult {
  input: string
  extracted: Record<string, unknown>
  confidence: Record<string, number>
  sourceSpans: Record<string, { start: number; end: number; text: string }>
  missingFields: string[]
}

interface ExtractionEditorProps {
  config: ExtractionConfig
  onConfigChange: (config: ExtractionConfig) => void
  onTest?: (input: string) => Promise<TestResult>
}

const TYPE_ICONS: Record<ExtractionField['type'], React.ReactNode> = {
  string: <Type className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  url: <Link2 className="h-4 w-4" />,
  address: <MapPin className="h-4 w-4" />,
  array: <Braces className="h-4 w-4" />,
  object: <Braces className="h-4 w-4" />
}

export function ExtractionEditor({
  config,
  onConfigChange
}: ExtractionEditorProps) {
  const [activeTab, setActiveTab] = useState("schema")
  const [testInput, setTestInput] = useState("")
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isTestLoading, setIsTestLoading] = useState(false)

  const addField = () => {
    const newField: ExtractionField = {
      id: `field-${Date.now()}`,
      name: "",
      type: 'string',
      description: "",
      required: false
    }
    onConfigChange({ ...config, fields: [...config.fields, newField] })
  }

  const updateField = (id: string, updates: Partial<ExtractionField>) => {
    const newFields = config.fields.map(field =>
      field.id === id ? { ...field, ...updates } : field
    )
    onConfigChange({ ...config, fields: newFields })
  }

  const removeField = (id: string) => {
    onConfigChange({
      ...config,
      fields: config.fields.filter(f => f.id !== id)
    })
  }

  // Mock test result
  const runMockTest = () => {
    setIsTestLoading(true)
    setTimeout(() => {
      setTestResult({
        input: testInput,
        extracted: {
          customer_name: "John Smith",
          email: "john.smith@example.com",
          phone: "+1 (555) 123-4567",
          order_number: "ORD-2024-001234",
          issue_description: "Product arrived damaged, requesting replacement",
          priority: "high"
        },
        confidence: {
          customer_name: 0.95,
          email: 0.99,
          phone: 0.92,
          order_number: 0.88,
          issue_description: 0.87,
          priority: 0.76
        },
        sourceSpans: {
          customer_name: { start: 12, end: 22, text: "John Smith" },
          email: { start: 45, end: 67, text: "john.smith@example.com" }
        },
        missingFields: []
      })
      setIsTestLoading(false)
    }, 1000)
  }

  const generateJsonSchema = () => {
    const schema: Record<string, unknown> = {
      type: "object",
      properties: {},
      required: config.fields.filter(f => f.required).map(f => f.name)
    }

    config.fields.forEach(field => {
      let propType: string
      switch (field.type) {
        case 'number':
          propType = 'number'
          break
        case 'array':
          propType = 'array'
          break
        case 'object':
          propType = 'object'
          break
        default:
          propType = 'string'
      }

      (schema.properties as Record<string, unknown>)[field.name] = {
        type: propType,
        description: field.description
      }
    })

    return JSON.stringify(schema, null, 2)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            <FileSearch className="h-5 w-5 text-cyan-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{config.name || "Data Extraction"}</h2>
            <p className="text-sm text-muted-foreground">
              Extract structured data from unstructured content
            </p>
          </div>
        </div>
        <Badge variant="secondary">
          {config.fields.length} fields
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-10">
            <TabsTrigger value="schema" className="gap-2">
              <Braces className="h-4 w-4" />
              Schema
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="test" className="gap-2">
              <TestTube className="h-4 w-4" />
              Test
            </TabsTrigger>
            <TabsTrigger value="prompt" className="gap-2">
              <Code className="h-4 w-4" />
              Prompt
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Schema Tab */}
          <TabsContent value="schema" className="p-4 space-y-4 m-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Extraction Schema</h3>
                <p className="text-sm text-muted-foreground">
                  Define the fields to extract from content
                </p>
              </div>
              <Button size="sm" onClick={addField}>
                <Plus className="h-4 w-4 mr-1" />
                Add Field
              </Button>
            </div>

            <div className="space-y-3">
              {config.fields.map((field) => (
                <Card key={field.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded bg-muted">
                            {TYPE_ICONS[field.type]}
                          </div>
                          <Input
                            value={field.name}
                            onChange={(e) => updateField(field.id, { name: e.target.value })}
                            placeholder="field_name"
                            className="flex-1 font-mono"
                          />
                          <Select
                            value={field.type}
                            onValueChange={(v: ExtractionField['type']) =>
                              updateField(field.id, { type: v })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">String</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="url">URL</SelectItem>
                              <SelectItem value="address">Address</SelectItem>
                              <SelectItem value="array">Array</SelectItem>
                              <SelectItem value="object">Object</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(field.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={field.description}
                              onChange={(e) => updateField(field.id, { description: e.target.value })}
                              placeholder="What to extract..."
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Validation (optional)</Label>
                            <Input
                              value={field.validation || ""}
                              onChange={(e) => updateField(field.id, { validation: e.target.value })}
                              placeholder="Regex or rule..."
                              className="text-sm font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`required-${field.id}`}
                              checked={field.required}
                              onCheckedChange={(checked) =>
                                updateField(field.id, { required: !!checked })
                              }
                            />
                            <Label htmlFor={`required-${field.id}`} className="text-xs">
                              Required field
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {config.fields.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <FileSearch className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">No fields defined</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add fields to define your extraction schema
                    </p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={addField}>
                      Add First Field
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Templates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quick Templates</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {[
                  { name: "Contact Info", fields: ["name", "email", "phone", "company"] },
                  { name: "Invoice", fields: ["invoice_number", "date", "amount", "vendor"] },
                  { name: "Support Ticket", fields: ["customer", "issue", "priority", "category"] },
                  { name: "Resume", fields: ["name", "email", "skills", "experience"] }
                ].map((template) => (
                  <Button
                    key={template.name}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const newFields = template.fields.map((name, i) => ({
                        id: `field-${Date.now()}-${i}`,
                        name,
                        type: 'string' as const,
                        description: `Extract the ${name}`,
                        required: i === 0
                      }))
                      onConfigChange({ ...config, fields: newFields })
                    }}
                  >
                    {template.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="p-4 space-y-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Extraction Mode</CardTitle>
                <CardDescription>How to handle missing or uncertain data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={config.extractionMode}
                  onValueChange={(v: 'strict' | 'flexible' | 'best_effort') =>
                    onConfigChange({ ...config, extractionMode: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strict">
                      Strict - Fail if required fields missing
                    </SelectItem>
                    <SelectItem value="flexible">
                      Flexible - Return partial results
                    </SelectItem>
                    <SelectItem value="best_effort">
                      Best Effort - Infer missing values
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Output Options</CardTitle>
                <CardDescription>Configure extraction output</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select
                    value={config.outputFormat}
                    onValueChange={(v: 'flat' | 'nested' | 'json_schema') =>
                      onConfigChange({ ...config, outputFormat: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat Object</SelectItem>
                      <SelectItem value="nested">Nested Structure</SelectItem>
                      <SelectItem value="json_schema">JSON Schema Compliant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Confidence Scores</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add confidence level for each extracted field
                    </p>
                  </div>
                  <Switch
                    checked={config.includeConfidence}
                    onCheckedChange={(v) => onConfigChange({ ...config, includeConfidence: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Source Spans</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Show where in the text each value was found
                    </p>
                  </div>
                  <Switch
                    checked={config.includeSourceSpans}
                    onCheckedChange={(v) => onConfigChange({ ...config, includeSourceSpans: v })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Input Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label>Input Field</Label>
                <Input
                  value={config.inputField}
                  onChange={(e) => onConfigChange({ ...config, inputField: e.target.value })}
                  placeholder="content"
                />
                <p className="text-xs text-muted-foreground">
                  The field containing text to extract from
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test" className="p-4 space-y-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test Extraction</CardTitle>
                <CardDescription>Try out the extractor with sample input</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Test Input</Label>
                  <Textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Paste content to extract data from..."
                    className="min-h-[120px]"
                  />
                </div>
                <Button
                  onClick={runMockTest}
                  disabled={!testInput.trim() || isTestLoading}
                  className="w-full"
                >
                  {isTestLoading ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Extraction
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {testResult && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Extraction Result
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-1" />
                      Copy JSON
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {testResult.missingFields.length > 0 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Missing required fields
                        </p>
                        <p className="text-xs text-yellow-600">
                          {testResult.missingFields.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {Object.entries(testResult.extracted).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">{key}</span>
                            {testResult.confidence[key] !== undefined && (
                              <Badge
                                variant={testResult.confidence[key] > 0.8 ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {Math.round(testResult.confidence[key] * 100)}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {String(value)}
                          </p>
                        </div>
                        {testResult.sourceSpans[key] && (
                          <Badge variant="outline" className="text-xs">
                            chars {testResult.sourceSpans[key].start}-{testResult.sourceSpans[key].end}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t">
                    <Label className="text-xs text-muted-foreground">Raw JSON Output</Label>
                    <pre className="mt-2 text-xs bg-muted/50 p-3 rounded-lg overflow-auto max-h-[200px]">
                      {JSON.stringify(testResult.extracted, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Prompt Tab */}
          <TabsContent value="prompt" className="p-4 space-y-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Prompt</CardTitle>
                <CardDescription>
                  Customize the extraction instructions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={config.systemPrompt}
                  onChange={(e) => onConfigChange({ ...config, systemPrompt: e.target.value })}
                  placeholder="You are a data extraction assistant. Extract structured information from the given text..."
                  className="font-mono text-sm min-h-[150px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generated JSON Schema</CardTitle>
                <CardDescription>
                  Schema generated from your field definitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-auto max-h-[300px]">
                  {generateJsonSchema()}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

export default ExtractionEditor
