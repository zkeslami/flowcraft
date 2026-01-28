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
import { Slider } from "@/components/ui/slider"
import {
  Tags,
  Plus,
  Trash2,
  Play,
  Sparkles,
  Target,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Settings2,
  TestTube,
  Code,
  GripVertical
} from "lucide-react"

interface ClassLabel {
  id: string
  name: string
  description: string
  examples: string[]
  color: string
}

interface ClassificationConfig {
  id: string
  name: string
  description: string
  classificationMode: 'single' | 'multi' | 'hierarchical'
  labels: ClassLabel[]
  inputField: string
  outputField: string
  includeConfidence: boolean
  includeReasoning: boolean
  confidenceThreshold: number
  fallbackLabel?: string
  systemPrompt: string
}

interface TestResult {
  input: string
  predictedLabel: string
  confidence: number
  reasoning: string
  allScores: { label: string; score: number }[]
}

interface ClassificationEditorProps {
  config: ClassificationConfig
  onConfigChange: (config: ClassificationConfig) => void
  onTest?: (input: string) => Promise<TestResult>
}

const COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
  "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
  "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500",
  "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500"
]

export function ClassificationEditor({
  config,
  onConfigChange,
  onTest
}: ClassificationEditorProps) {
  const [activeTab, setActiveTab] = useState("labels")
  const [testInput, setTestInput] = useState("")
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isTestLoading, setIsTestLoading] = useState(false)

  const addLabel = () => {
    const newLabel: ClassLabel = {
      id: `label-${Date.now()}`,
      name: "",
      description: "",
      examples: [],
      color: COLORS[config.labels.length % COLORS.length]
    }
    onConfigChange({ ...config, labels: [...config.labels, newLabel] })
  }

  const updateLabel = (id: string, updates: Partial<ClassLabel>) => {
    const newLabels = config.labels.map(label =>
      label.id === id ? { ...label, ...updates } : label
    )
    onConfigChange({ ...config, labels: newLabels })
  }

  const removeLabel = (id: string) => {
    onConfigChange({
      ...config,
      labels: config.labels.filter(l => l.id !== id)
    })
  }

  const addExample = (labelId: string) => {
    const label = config.labels.find(l => l.id === labelId)
    if (label) {
      updateLabel(labelId, { examples: [...label.examples, ""] })
    }
  }

  const updateExample = (labelId: string, index: number, value: string) => {
    const label = config.labels.find(l => l.id === labelId)
    if (label) {
      const newExamples = [...label.examples]
      newExamples[index] = value
      updateLabel(labelId, { examples: newExamples })
    }
  }

  const removeExample = (labelId: string, index: number) => {
    const label = config.labels.find(l => l.id === labelId)
    if (label) {
      updateLabel(labelId, { examples: label.examples.filter((_, i) => i !== index) })
    }
  }

  const handleTest = async () => {
    if (!testInput.trim() || !onTest) return
    setIsTestLoading(true)
    try {
      const result = await onTest(testInput)
      setTestResult(result)
    } finally {
      setIsTestLoading(false)
    }
  }

  // Mock test result for demo
  const runMockTest = () => {
    setIsTestLoading(true)
    setTimeout(() => {
      setTestResult({
        input: testInput,
        predictedLabel: "Support Request",
        confidence: 0.89,
        reasoning: "The text contains keywords related to help and product issues, and follows the pattern of a typical support inquiry.",
        allScores: [
          { label: "Support Request", score: 0.89 },
          { label: "Sales Inquiry", score: 0.07 },
          { label: "Feedback", score: 0.03 },
          { label: "Other", score: 0.01 }
        ]
      })
      setIsTestLoading(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Tags className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{config.name || "Classification"}</h2>
            <p className="text-sm text-muted-foreground">
              Categorize content into predefined labels
            </p>
          </div>
        </div>
        <Badge variant="secondary">
          {config.labels.length} labels
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-10">
            <TabsTrigger value="labels" className="gap-2">
              <Tags className="h-4 w-4" />
              Labels
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
            <TabsTrigger value="metrics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Metrics
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Labels Tab */}
          <TabsContent value="labels" className="p-4 space-y-4 m-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Classification Labels</h3>
                <p className="text-sm text-muted-foreground">
                  Define the categories for classification
                </p>
              </div>
              <Button size="sm" onClick={addLabel}>
                <Plus className="h-4 w-4 mr-1" />
                Add Label
              </Button>
            </div>

            <div className="space-y-3">
              {config.labels.map((label, labelIndex) => (
                <Card key={label.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full ${label.color}`}
                            onClick={() => {
                              const nextColor = COLORS[(COLORS.indexOf(label.color) + 1) % COLORS.length]
                              updateLabel(label.id, { color: nextColor })
                            }}
                          />
                          <Input
                            value={label.name}
                            onChange={(e) => updateLabel(label.id, { name: e.target.value })}
                            placeholder="Label name"
                            className="flex-1 font-medium"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLabel(label.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <Textarea
                          value={label.description}
                          onChange={(e) => updateLabel(label.id, { description: e.target.value })}
                          placeholder="Describe what content belongs in this category..."
                          className="text-sm min-h-[60px]"
                        />

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Examples</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => addExample(label.id)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Example
                            </Button>
                          </div>
                          {label.examples.map((example, exIndex) => (
                            <div key={exIndex} className="flex items-center gap-2">
                              <Input
                                value={example}
                                onChange={(e) => updateExample(label.id, exIndex, e.target.value)}
                                placeholder={`Example ${exIndex + 1}...`}
                                className="text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => removeExample(label.id, exIndex)}
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {config.labels.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <Tags className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">No labels defined</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add labels to start classifying content
                    </p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={addLabel}>
                      Add First Label
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="p-4 space-y-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Classification Mode</CardTitle>
                <CardDescription>How labels are assigned to content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={config.classificationMode}
                  onValueChange={(v: 'single' | 'multi' | 'hierarchical') =>
                    onConfigChange({ ...config, classificationMode: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Label - One category per item</SelectItem>
                    <SelectItem value="multi">Multi-Label - Multiple categories allowed</SelectItem>
                    <SelectItem value="hierarchical">Hierarchical - Nested categories</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Input/Output Fields</CardTitle>
                <CardDescription>Map data fields for classification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Input Field</Label>
                  <Input
                    value={config.inputField}
                    onChange={(e) => onConfigChange({ ...config, inputField: e.target.value })}
                    placeholder="content"
                  />
                  <p className="text-xs text-muted-foreground">
                    The field containing text to classify
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Output Field</Label>
                  <Input
                    value={config.outputField}
                    onChange={(e) => onConfigChange({ ...config, outputField: e.target.value })}
                    placeholder="category"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Confidence Settings</CardTitle>
                <CardDescription>Control classification behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Confidence Score</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add confidence percentage to output
                    </p>
                  </div>
                  <Switch
                    checked={config.includeConfidence}
                    onCheckedChange={(v) => onConfigChange({ ...config, includeConfidence: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Reasoning</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Explain why the label was chosen
                    </p>
                  </div>
                  <Switch
                    checked={config.includeReasoning}
                    onCheckedChange={(v) => onConfigChange({ ...config, includeReasoning: v })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Confidence Threshold</Label>
                    <span className="text-sm font-mono">{Math.round(config.confidenceThreshold * 100)}%</span>
                  </div>
                  <Slider
                    value={[config.confidenceThreshold * 100]}
                    onValueChange={([v]) => onConfigChange({ ...config, confidenceThreshold: v / 100 })}
                    min={0}
                    max={100}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use fallback label when confidence is below threshold
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Fallback Label</Label>
                  <Select
                    value={config.fallbackLabel || ""}
                    onValueChange={(v) => onConfigChange({ ...config, fallbackLabel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fallback..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None - Return uncertain</SelectItem>
                      {config.labels.map((label) => (
                        <SelectItem key={label.id} value={label.name}>
                          {label.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test" className="p-4 space-y-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test Classification</CardTitle>
                <CardDescription>Try out the classifier with sample input</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Test Input</Label>
                  <Textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Enter text to classify..."
                    className="min-h-[100px]"
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
                      Classifying...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Classification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {testResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Classification Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">{testResult.predictedLabel}</span>
                    </div>
                    <Badge variant={testResult.confidence > 0.8 ? "default" : "secondary"}>
                      {Math.round(testResult.confidence * 100)}% confidence
                    </Badge>
                  </div>

                  {config.includeReasoning && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <Label className="text-xs text-muted-foreground">Reasoning</Label>
                      <p className="text-sm mt-1">{testResult.reasoning}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">All Scores</Label>
                    {testResult.allScores.map((score) => (
                      <div key={score.label} className="flex items-center gap-2">
                        <span className="text-sm w-32 truncate">{score.label}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${score.score * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {Math.round(score.score * 100)}%
                        </span>
                      </div>
                    ))}
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
                  Customize the classification instructions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={config.systemPrompt}
                  onChange={(e) => onConfigChange({ ...config, systemPrompt: e.target.value })}
                  placeholder="You are a content classifier. Analyze the given text and categorize it into one of the predefined labels..."
                  className="font-mono text-sm min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Labels and examples will be automatically appended to this prompt
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generated Prompt Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-auto max-h-[300px]">
{`${config.systemPrompt || "You are a content classifier."}

Available labels:
${config.labels.map(l => `- ${l.name}: ${l.description}
  Examples: ${l.examples.join(', ') || 'None'}`).join('\n')}

${config.classificationMode === 'single'
  ? 'Assign exactly ONE label to the content.'
  : 'Assign ALL applicable labels to the content.'
}

${config.includeConfidence ? 'Include a confidence score (0-1) for your classification.' : ''}
${config.includeReasoning ? 'Explain your reasoning briefly.' : ''}

Respond in JSON format.`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="p-4 space-y-4 m-0">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">94.2%</div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">0.91</div>
                  <div className="text-sm text-muted-foreground">F1 Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">1,247</div>
                  <div className="text-sm text-muted-foreground">Total Classifications</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">0.87</div>
                  <div className="text-sm text-muted-foreground">Avg Confidence</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Label Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.labels.map((label) => {
                  const percentage = Math.random() * 40 + 10 // Mock data
                  return (
                    <div key={label.id} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${label.color}`} />
                      <span className="text-sm w-32 truncate">{label.name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${label.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Low Confidence Alerts</CardTitle>
                <CardDescription>Recent classifications below threshold</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm truncate max-w-[200px]">
                      "I have a question about..."
                    </span>
                  </div>
                  <Badge variant="outline" className="text-yellow-600">52%</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm truncate max-w-[200px]">
                      "Can you help me with..."
                    </span>
                  </div>
                  <Badge variant="outline" className="text-yellow-600">48%</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

export default ClassificationEditor
