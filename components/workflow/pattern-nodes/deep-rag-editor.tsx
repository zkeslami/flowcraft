"use client"

import { useState } from "react"
import {
  Search,
  FileText,
  Link2,
  Globe,
  Database,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Play,
  Sparkles,
  BookOpen,
  Quote,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Settings,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { GroundingSource, Citation } from "@/lib/flow-types"

interface DeepRAGEditorProps {
  nodeId: string
  config: {
    query?: string
    groundingSources?: GroundingSource[]
    citationMode?: 'inline' | 'footnote' | 'none'
    researchDepth?: 'shallow' | 'medium' | 'deep'
    filters?: {
      dateRange?: { start: string; end: string }
      metadata?: Record<string, string>
    }
  }
  onConfigChange: (config: DeepRAGEditorProps['config']) => void
  onTest?: () => void
  isRunning?: boolean
  testResults?: {
    answer: string
    citations: Citation[]
    researchSteps: ResearchStep[]
    metrics: {
      sourcesSearched: number
      documentsRetrieved: number
      latencyMs: number
    }
  }
}

interface ResearchStep {
  id: string
  type: 'query' | 'retrieve' | 'summarize' | 'refine'
  content: string
  timestamp: Date
  sources?: string[]
}

const MOCK_SOURCES: GroundingSource[] = [
  { id: 's1', type: 'index', name: 'Product Documentation' },
  { id: 's2', type: 'index', name: 'Knowledge Base' },
  { id: 's3', type: 'connector', name: 'SharePoint - Engineering' },
  { id: 's4', type: 'web', name: 'Web Search' },
]

const MOCK_CITATIONS: Citation[] = [
  {
    source: 'Product Documentation',
    document: 'API Reference Guide',
    page: 42,
    excerpt: 'The authentication endpoint accepts OAuth 2.0 tokens with the following scopes...',
    confidence: 0.95
  },
  {
    source: 'Knowledge Base',
    document: 'Troubleshooting Guide',
    page: 15,
    excerpt: 'Common authentication errors include expired tokens and incorrect scope configurations...',
    confidence: 0.88
  },
]

export function DeepRAGEditor({
  nodeId,
  config,
  onConfigChange,
  onTest,
  isRunning = false,
  testResults,
}: DeepRAGEditorProps) {
  const [activeTab, setActiveTab] = useState<'input' | 'sources' | 'citations' | 'testing' | 'results'>('input')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    query: true,
    sources: true,
    filters: false,
  })
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const addSource = (source: GroundingSource) => {
    const currentSources = config.groundingSources || []
    if (!currentSources.find(s => s.id === source.id)) {
      onConfigChange({
        ...config,
        groundingSources: [...currentSources, source]
      })
    }
  }

  const removeSource = (sourceId: string) => {
    onConfigChange({
      ...config,
      groundingSources: (config.groundingSources || []).filter(s => s.id !== sourceId)
    })
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
            <Search className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium text-sm">DeepRAG Research</h3>
            <p className="text-xs text-muted-foreground">Multi-step retrieval with citations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {config.researchDepth || 'medium'} depth
          </Badge>
          <Button
            size="sm"
            variant="default"
            onClick={onTest}
            disabled={isRunning}
            className="gap-1"
          >
            {isRunning ? (
              <Clock className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            Test
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 h-10">
          <TabsTrigger value="input" className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Input & Query
          </TabsTrigger>
          <TabsTrigger value="sources" className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Sources
          </TabsTrigger>
          <TabsTrigger value="citations" className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Citations
          </TabsTrigger>
          <TabsTrigger value="testing" className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Testing
          </TabsTrigger>
          <TabsTrigger value="results" className="text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Results
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Input & Query Tab */}
          <TabsContent value="input" className="p-4 m-0 space-y-4">
            {/* Research Query */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Research Query</label>
                <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs text-purple-400">
                  <Sparkles className="h-3 w-3" />
                  Generate
                </Button>
              </div>
              <Textarea
                value={config.query || ''}
                onChange={(e) => onConfigChange({ ...config, query: e.target.value })}
                placeholder="Enter your research question or use variables like {{input.question}}"
                className="min-h-[100px] text-sm font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Supports single or multi-question research. Use follow-up queries for deeper investigation.
              </p>
            </div>

            {/* Research Depth */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Research Depth</label>
              <div className="flex gap-2">
                {(['shallow', 'medium', 'deep'] as const).map((depth) => (
                  <Button
                    key={depth}
                    variant={config.researchDepth === depth ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onConfigChange({ ...config, researchDepth: depth })}
                    className="flex-1 capitalize"
                  >
                    {depth}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {config.researchDepth === 'shallow' && 'Quick search with minimal refinement (1-2 iterations)'}
                {config.researchDepth === 'medium' && 'Balanced research with follow-up queries (3-5 iterations)'}
                {config.researchDepth === 'deep' && 'Comprehensive research with extensive refinement (5+ iterations)'}
                {!config.researchDepth && 'Balanced research with follow-up queries (3-5 iterations)'}
              </p>
            </div>

            {/* Filters */}
            <div className="border border-border rounded-lg">
              <button
                onClick={() => toggleSection('filters')}
                className="flex items-center justify-between w-full p-3 text-left"
              >
                <span className="text-sm font-medium">Filters & Scope</span>
                {expandedSections.filters ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {expandedSections.filters && (
                <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Start Date</label>
                      <Input
                        type="date"
                        value={config.filters?.dateRange?.start || ''}
                        onChange={(e) => onConfigChange({
                          ...config,
                          filters: {
                            ...config.filters,
                            dateRange: { ...config.filters?.dateRange, start: e.target.value, end: config.filters?.dateRange?.end || '' }
                          }
                        })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">End Date</label>
                      <Input
                        type="date"
                        value={config.filters?.dateRange?.end || ''}
                        onChange={(e) => onConfigChange({
                          ...config,
                          filters: {
                            ...config.filters,
                            dateRange: { ...config.filters?.dateRange, end: e.target.value, start: config.filters?.dateRange?.start || '' }
                          }
                        })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources" className="p-4 m-0 space-y-4">
            {/* Selected Sources */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Selected Sources</label>
              {(config.groundingSources || []).length === 0 ? (
                <div className="border border-dashed border-border rounded-lg p-4 text-center">
                  <Database className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No sources selected</p>
                  <p className="text-xs text-muted-foreground/70">Add sources from available options below</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(config.groundingSources || []).map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border"
                    >
                      <div className="flex items-center gap-2">
                        {source.type === 'index' && <Database className="h-4 w-4 text-blue-400" />}
                        {source.type === 'connector' && <Link2 className="h-4 w-4 text-green-400" />}
                        {source.type === 'web' && <Globe className="h-4 w-4 text-orange-400" />}
                        {source.type === 'document' && <FileText className="h-4 w-4 text-purple-400" />}
                        <span className="text-sm">{source.name}</span>
                        <Badge variant="outline" className="text-[10px]">{source.type}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeSource(source.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Sources */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Available Sources</label>
              <div className="space-y-2">
                {MOCK_SOURCES.filter(s => !(config.groundingSources || []).find(cs => cs.id === s.id)).map((source) => (
                  <button
                    key={source.id}
                    onClick={() => addSource(source)}
                    className="flex items-center justify-between w-full p-2 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {source.type === 'index' && <Database className="h-4 w-4 text-blue-400" />}
                      {source.type === 'connector' && <Link2 className="h-4 w-4 text-green-400" />}
                      {source.type === 'web' && <Globe className="h-4 w-4 text-orange-400" />}
                      {source.type === 'document' && <FileText className="h-4 w-4 text-purple-400" />}
                      <span className="text-sm">{source.name}</span>
                      <Badge variant="outline" className="text-[10px]">{source.type}</Badge>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Citations Tab */}
          <TabsContent value="citations" className="p-4 m-0 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Citation Mode</label>
              <div className="flex gap-2">
                {(['inline', 'footnote', 'none'] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={config.citationMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onConfigChange({ ...config, citationMode: mode })}
                    className="flex-1 capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            {/* Citation Preview */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Citation Inspector</label>
              <div className="border border-border rounded-lg divide-y divide-border">
                {MOCK_CITATIONS.map((citation, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedCitation(citation)}
                    className={cn(
                      "w-full p-3 text-left hover:bg-secondary/50 transition-colors",
                      selectedCitation === citation && "bg-secondary/50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Quote className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{citation.source}</span>
                      </div>
                      <Badge
                        variant={citation.confidence > 0.9 ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {Math.round(citation.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{citation.excerpt}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span>{citation.document}</span>
                      {citation.page && (
                        <>
                          <span>•</span>
                          <span>Page {citation.page}</span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="p-4 m-0 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Research Timeline Simulator</label>
              <div className="border border-border rounded-lg p-4">
                <div className="space-y-3">
                  {/* Mock research steps */}
                  {[
                    { type: 'query', content: 'Initial query: "How does authentication work?"', status: 'completed' },
                    { type: 'retrieve', content: 'Retrieved 12 documents from 3 sources', status: 'completed' },
                    { type: 'summarize', content: 'Summarizing key findings...', status: 'running' },
                    { type: 'refine', content: 'Generating follow-up queries', status: 'pending' },
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full shrink-0",
                        step.status === 'completed' && "bg-green-500/20",
                        step.status === 'running' && "bg-blue-500/20",
                        step.status === 'pending' && "bg-muted"
                      )}>
                        {step.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-400" />}
                        {step.status === 'running' && <Clock className="h-3 w-3 text-blue-400 animate-spin" />}
                        {step.status === 'pending' && <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
                      </div>
                      <div className="flex-1">
                        <p className={cn(
                          "text-sm",
                          step.status === 'pending' && "text-muted-foreground"
                        )}>
                          {step.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Query Transformation Preview</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-[10px] text-muted-foreground mb-1">Original Query</p>
                  <p className="text-sm">{config.query || 'No query set'}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-[10px] text-purple-400 mb-1">Generated Follow-up</p>
                  <p className="text-sm">What are the specific OAuth scopes required?</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="p-4 m-0 space-y-4">
            {testResults ? (
              <>
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border text-center">
                    <p className="text-2xl font-semibold">{testResults.metrics.sourcesSearched}</p>
                    <p className="text-[10px] text-muted-foreground">Sources Searched</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border text-center">
                    <p className="text-2xl font-semibold">{testResults.metrics.documentsRetrieved}</p>
                    <p className="text-[10px] text-muted-foreground">Documents Retrieved</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border text-center">
                    <p className="text-2xl font-semibold">{testResults.metrics.latencyMs}ms</p>
                    <p className="text-[10px] text-muted-foreground">Latency</p>
                  </div>
                </div>

                {/* Answer */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Generated Answer</label>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-sm whitespace-pre-wrap">{testResults.answer}</p>
                  </div>
                </div>

                {/* Citations */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Citations ({testResults.citations.length})
                  </label>
                  <div className="space-y-2">
                    {testResults.citations.map((citation, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">[{idx + 1}] {citation.source}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {Math.round(citation.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{citation.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No results yet</p>
                <p className="text-xs text-muted-foreground/70">Run a test to see research results</p>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
