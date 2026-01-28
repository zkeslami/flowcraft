"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Brain,
  Folder,
  FolderOpen,
  GitBranch,
  Clock,
  Tag,
  MessageSquare,
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Star,
  Archive,
  Trash2,
  Eye,
  Plus,
  ExternalLink,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Bot,
  User,
  Zap
} from "lucide-react"

// Types for Episodic Memory System
export interface MemoryArtifact {
  id: string
  type: 'document' | 'screenshot' | 'transcript' | 'data' | 'model_output'
  name: string
  content: string
  timestamp: string
  metadata: Record<string, unknown>
}

export interface FeedbackItem {
  id: string
  type: 'thumbs' | 'rating' | 'correction' | 'comment'
  value: unknown
  source: 'user' | 'system' | 'evaluator'
  timestamp: string
  context?: string
}

export interface AgentEpisode {
  id: string
  agentNodeId: string
  agentName: string
  startTime: string
  endTime?: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  inputContext: Record<string, unknown>
  outputResult?: Record<string, unknown>
  toolCalls: ToolCall[]
  reasoningTrace: ReasoningStep[]
  feedback: FeedbackItem[]
  tokenUsage: { input: number; output: number; total: number }
  model: string
  confidence?: number
}

export interface ToolCall {
  id: string
  toolName: string
  input: Record<string, unknown>
  output?: unknown
  duration: number
  status: 'success' | 'error'
  error?: string
}

export interface ReasoningStep {
  id: string
  type: 'thought' | 'observation' | 'action' | 'reflection'
  content: string
  timestamp: string
}

export interface ProcessEpisode {
  id: string
  processName: string
  startTime: string
  endTime?: string
  status: 'running' | 'completed' | 'failed' | 'waiting'
  currentStep?: string
  agentRuns: AgentEpisode[]
  artifacts: MemoryArtifact[]
  feedback: FeedbackItem[]
}

export interface Case {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  status: 'active' | 'completed' | 'archived'
  tags: string[]
  processInstances: ProcessEpisode[]
  metadata: Record<string, unknown>
}

interface EpisodicMemoryPanelProps {
  cases: Case[]
  selectedCaseId?: string
  onSelectCase: (caseId: string) => void
  onSelectProcess: (processId: string) => void
  onSelectAgent: (agentId: string) => void
  onAddFeedback: (targetId: string, feedback: FeedbackItem) => void
  onArchiveCase: (caseId: string) => void
  className?: string
}

// Mock data for demonstration
const mockCases: Case[] = [
  {
    id: "case-001",
    name: "Invoice INV-2024-1247",
    description: "Processing vendor invoice from Acme Corp",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T11:45:00Z",
    status: 'completed',
    tags: ["vendor:acme", "amount:high", "auto-approved"],
    metadata: { vendor: "Acme Corp", amount: 15000 },
    processInstances: [
      {
        id: "proc-001",
        processName: "Invoice Processing",
        startTime: "2024-01-15T10:30:00Z",
        endTime: "2024-01-15T11:45:00Z",
        status: 'completed',
        agentRuns: [
          {
            id: "agent-001",
            agentNodeId: "3",
            agentName: "Validate Invoice",
            startTime: "2024-01-15T10:35:00Z",
            endTime: "2024-01-15T10:38:00Z",
            status: 'completed',
            inputContext: { invoiceId: "INV-2024-1247", extractedData: {} },
            outputResult: { isValid: true, confidence: 0.96 },
            toolCalls: [
              { id: "tc-1", toolName: "OCR Extract", input: {}, output: {}, duration: 1200, status: 'success' },
              { id: "tc-2", toolName: "Vendor Lookup", input: {}, output: {}, duration: 450, status: 'success' },
              { id: "tc-3", toolName: "Amount Validator", input: {}, output: {}, duration: 320, status: 'success' },
            ],
            reasoningTrace: [
              { id: "r1", type: 'thought', content: "Received invoice data for validation", timestamp: "10:35:01" },
              { id: "r2", type: 'action', content: "Running OCR extraction on attached PDF", timestamp: "10:35:02" },
              { id: "r3", type: 'observation', content: "Extracted vendor: Acme Corp, Amount: $15,000", timestamp: "10:35:15" },
              { id: "r4", type: 'thought', content: "Amount exceeds $10k threshold, verifying vendor status", timestamp: "10:35:16" },
              { id: "r5", type: 'action', content: "Looking up vendor in approved vendor database", timestamp: "10:35:17" },
              { id: "r6", type: 'observation', content: "Vendor Acme Corp is a Tier-1 approved vendor", timestamp: "10:35:20" },
              { id: "r7", type: 'reflection', content: "High confidence in approval - vendor is trusted and amount matches PO", timestamp: "10:35:25" },
            ],
            feedback: [
              { id: "fb-1", type: 'thumbs', value: 'up', source: 'user', timestamp: "2024-01-15T11:00:00Z" }
            ],
            tokenUsage: { input: 1247, output: 892, total: 2139 },
            model: "GPT-4o",
            confidence: 0.96
          }
        ],
        artifacts: [
          { id: "art-1", type: 'document', name: "invoice_acme_1247.pdf", content: "", timestamp: "2024-01-15T10:30:00Z", metadata: {} },
          { id: "art-2", type: 'model_output', name: "validation_result.json", content: "{}", timestamp: "2024-01-15T10:38:00Z", metadata: {} }
        ],
        feedback: []
      }
    ]
  },
  {
    id: "case-002",
    name: "Invoice INV-2024-1248",
    description: "Manual review required - new vendor",
    createdAt: "2024-01-15T11:00:00Z",
    updatedAt: "2024-01-15T12:30:00Z",
    status: 'active',
    tags: ["vendor:new", "manual-review"],
    metadata: { vendor: "NewCo Inc", amount: 5000 },
    processInstances: []
  }
]

export function EpisodicMemoryPanel({
  cases = mockCases,
  selectedCaseId,
  onSelectCase,
  onSelectProcess,
  onSelectAgent,
  onAddFeedback,
  onArchiveCase,
  className
}: EpisodicMemoryPanelProps) {
  const [activeTab, setActiveTab] = useState("cases")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set(["case-001"]))
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(new Set(["proc-001"]))
  const [selectedAgentRun, setSelectedAgentRun] = useState<AgentEpisode | null>(null)

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesSearch = searchQuery === "" ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [cases, searchQuery, statusFilter])

  const toggleCaseExpanded = (caseId: string) => {
    setExpandedCases(prev => {
      const next = new Set(prev)
      if (next.has(caseId)) {
        next.delete(caseId)
      } else {
        next.add(caseId)
      }
      return next
    })
  }

  const toggleProcessExpanded = (processId: string) => {
    setExpandedProcesses(prev => {
      const next = new Set(prev)
      if (next.has(processId)) {
        next.delete(processId)
      } else {
        next.add(processId)
      }
      return next
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Active</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 text-xs">Complete</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 text-xs">Failed</Badge>
      case 'waiting':
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Waiting</Badge>
      case 'archived':
        return <Badge variant="outline" className="text-xs">Archived</Badge>
      default:
        return null
    }
  }

  const renderAgentDetails = (agent: AgentEpisode) => (
    <div className="space-y-4">
      {/* Agent Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Bot className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h4 className="font-medium">{agent.agentName}</h4>
            <p className="text-xs text-muted-foreground">{agent.model}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {agent.confidence && (
            <Badge variant="outline" className="text-xs">
              {Math.round(agent.confidence * 100)}% confidence
            </Badge>
          )}
          {getStatusBadge(agent.status)}
        </div>
      </div>

      {/* Token Usage */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-muted/50 rounded">
          <div className="text-lg font-semibold">{agent.tokenUsage.input.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Input tokens</div>
        </div>
        <div className="p-2 bg-muted/50 rounded">
          <div className="text-lg font-semibold">{agent.tokenUsage.output.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Output tokens</div>
        </div>
        <div className="p-2 bg-muted/50 rounded">
          <div className="text-lg font-semibold">{agent.tokenUsage.total.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
      </div>

      {/* Tool Calls */}
      <div>
        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Tool Calls ({agent.toolCalls.length})
        </h5>
        <div className="space-y-1">
          {agent.toolCalls.map(tool => (
            <div
              key={tool.id}
              className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
            >
              <div className="flex items-center gap-2">
                {tool.status === 'success' ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                )}
                <span className="font-mono">{tool.toolName}</span>
              </div>
              <span className="text-xs text-muted-foreground">{tool.duration}ms</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reasoning Trace */}
      <div>
        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Reasoning Trace
        </h5>
        <div className="space-y-2 pl-4 border-l-2 border-muted">
          {agent.reasoningTrace.map(step => (
            <div key={step.id} className="relative">
              <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-background border-2 border-muted" />
              <div className="pl-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {step.type}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{step.timestamp}</span>
                </div>
                <p className="text-sm text-muted-foreground">{step.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div className="pt-3 border-t">
        <h5 className="text-sm font-medium mb-2">Feedback</h5>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <ThumbsUp className="h-3 w-3" />
            Helpful
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <ThumbsDown className="h-3 w-3" />
            Not Helpful
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <MessageSquare className="h-3 w-3" />
            Add Note
          </Button>
        </div>
        {agent.feedback.length > 0 && (
          <div className="mt-2 space-y-1">
            {agent.feedback.map(fb => (
              <div key={fb.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                {fb.type === 'thumbs' && fb.value === 'up' && <ThumbsUp className="h-3 w-3 text-green-500" />}
                {fb.type === 'thumbs' && fb.value === 'down' && <ThumbsDown className="h-3 w-3 text-red-500" />}
                <span>{fb.source} rated this {fb.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold">Episodic Memory</h3>
        </div>
        <Button variant="outline" size="sm" className="h-7">
          <RefreshCw className="h-3 w-3 mr-1" />
          Sync
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="p-3 space-y-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cases..."
            className="pl-8 h-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 text-xs w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="text-xs">
            {filteredCases.length} cases
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-3">
          <TabsList className="h-9">
            <TabsTrigger value="cases" className="text-xs gap-1">
              <Folder className="h-3 w-3" />
              Cases
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs gap-1">
              <BarChart3 className="h-3 w-3" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Cases Tab */}
          <TabsContent value="cases" className="p-0 m-0">
            <div className="p-2 space-y-1">
              {filteredCases.map(caseItem => (
                <Collapsible
                  key={caseItem.id}
                  open={expandedCases.has(caseItem.id)}
                  onOpenChange={() => toggleCaseExpanded(caseItem.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                      {expandedCases.has(caseItem.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      {expandedCases.has(caseItem.id) ? (
                        <FolderOpen className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Folder className="h-4 w-4 text-yellow-500" />
                      )}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{caseItem.name}</span>
                          {getStatusBadge(caseItem.status)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {caseItem.description}
                        </p>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="ml-6 pl-4 border-l space-y-1">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 py-1">
                        {caseItem.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-[10px] h-5">
                            <Tag className="h-2.5 w-2.5 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Process Instances */}
                      {caseItem.processInstances.map(process => (
                        <Collapsible
                          key={process.id}
                          open={expandedProcesses.has(process.id)}
                          onOpenChange={() => toggleProcessExpanded(process.id)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
                              {expandedProcesses.has(process.id) ? (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              )}
                              <GitBranch className="h-3 w-3 text-blue-500" />
                              <span className="text-xs font-medium flex-1 text-left">
                                {process.processName}
                              </span>
                              {getStatusBadge(process.status)}
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="ml-5 pl-3 border-l space-y-1">
                              {/* Agent Runs */}
                              {process.agentRuns.map(agent => (
                                <div
                                  key={agent.id}
                                  className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                    selectedAgentRun?.id === agent.id
                                      ? 'bg-purple-50 dark:bg-purple-950/20'
                                      : 'hover:bg-muted/50'
                                  }`}
                                  onClick={() => setSelectedAgentRun(agent)}
                                >
                                  <Bot className="h-3 w-3 text-purple-500" />
                                  <span className="text-xs flex-1">{agent.agentName}</span>
                                  {agent.confidence && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {Math.round(agent.confidence * 100)}%
                                    </span>
                                  )}
                                  {getStatusBadge(agent.status)}
                                </div>
                              ))}

                              {/* Artifacts */}
                              {process.artifacts.length > 0 && (
                                <div className="pt-1">
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                                    Artifacts
                                  </span>
                                  {process.artifacts.map(artifact => (
                                    <div
                                      key={artifact.id}
                                      className="flex items-center gap-2 p-1.5 text-xs hover:bg-muted/50 rounded cursor-pointer"
                                    >
                                      <FileText className="h-3 w-3 text-muted-foreground" />
                                      <span className="truncate">{artifact.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="p-3 m-0 space-y-3">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Learned Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded text-sm">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    High Confidence Pattern
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Invoices from Tier-1 vendors under $20k are consistently auto-approved (94% success rate)
                  </p>
                </div>
                <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Improvement Opportunity
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    New vendor verification takes 3x longer - consider pre-registration flow
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Recent Corrections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2 text-xs">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>User corrected vendor name extraction</p>
                    <p className="text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="p-3 m-0 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-xs text-muted-foreground">Total Cases</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">89%</div>
                  <div className="text-xs text-muted-foreground">Auto-Approved</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold">2.3m</div>
                  <div className="text-xs text-muted-foreground">Tokens Used</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold">4.2s</div>
                  <div className="text-xs text-muted-foreground">Avg Time</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Agent Detail Drawer */}
      {selectedAgentRun && (
        <div className="border-t">
          <div className="flex items-center justify-between p-2 bg-muted/30">
            <span className="text-sm font-medium">Agent Run Details</span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedAgentRun(null)}>
              ×
            </Button>
          </div>
          <ScrollArea className="h-[300px] p-3">
            {renderAgentDetails(selectedAgentRun)}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

export default EpisodicMemoryPanel
