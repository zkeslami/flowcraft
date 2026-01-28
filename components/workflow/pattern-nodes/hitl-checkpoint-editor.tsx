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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Edit3,
  RotateCcw,
  Bell,
  Users,
  Shield,
  Settings2,
  History,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Sparkles
} from "lucide-react"

interface HITLCheckpointConfig {
  id: string
  name: string
  description: string
  checkpointType: 'approval' | 'edit' | 'review' | 'escalation'
  triggerCondition: 'always' | 'confidence_below' | 'custom_rule'
  confidenceThreshold?: number
  customRule?: string
  timeoutMinutes: number
  timeoutAction: 'auto_approve' | 'auto_reject' | 'escalate'
  escalationPath?: string[]
  notificationChannels: string[]
  requiredApprovers: number
  allowEditing: boolean
  showConfidence: boolean
  collectFeedback: boolean
}

interface PendingReview {
  id: string
  timestamp: string
  inputData: Record<string, unknown>
  aiDecision: string
  confidence: number
  reasoning: string
  status: 'pending' | 'approved' | 'rejected' | 'edited' | 'escalated'
  assignedTo?: string
  waitingTime: string
}

interface ReviewHistory {
  id: string
  timestamp: string
  reviewer: string
  action: 'approved' | 'rejected' | 'edited'
  feedback?: string
  editedOutput?: string
  originalConfidence: number
}

interface HITLCheckpointEditorProps {
  config: HITLCheckpointConfig
  onConfigChange: (config: HITLCheckpointConfig) => void
}

export function HITLCheckpointEditor({
  config,
  onConfigChange
}: HITLCheckpointEditorProps) {
  const [activeTab, setActiveTab] = useState("config")

  // Mock pending reviews
  const [pendingReviews] = useState<PendingReview[]>([
    {
      id: "rev-001",
      timestamp: "2 min ago",
      inputData: { document: "Contract Amendment #1247", type: "legal" },
      aiDecision: "Approve with modifications",
      confidence: 0.72,
      reasoning: "Contract terms align with company policy but includes non-standard indemnification clause",
      status: 'pending',
      assignedTo: "Sarah M.",
      waitingTime: "2 min"
    },
    {
      id: "rev-002",
      timestamp: "15 min ago",
      inputData: { document: "Vendor Agreement", type: "procurement" },
      aiDecision: "Reject",
      confidence: 0.45,
      reasoning: "Payment terms exceed authorized limits, requires finance approval",
      status: 'pending',
      waitingTime: "15 min"
    },
    {
      id: "rev-003",
      timestamp: "1 hour ago",
      inputData: { document: "NDA Template", type: "legal" },
      aiDecision: "Approve",
      confidence: 0.94,
      reasoning: "Standard NDA with minor customizations, all terms within policy",
      status: 'approved',
      assignedTo: "John D.",
      waitingTime: "45 min"
    }
  ])

  // Mock review history
  const [reviewHistory] = useState<ReviewHistory[]>([
    {
      id: "hist-001",
      timestamp: "1 hour ago",
      reviewer: "John D.",
      action: 'approved',
      feedback: "Confirmed NDA terms are acceptable",
      originalConfidence: 0.94
    },
    {
      id: "hist-002",
      timestamp: "3 hours ago",
      reviewer: "Sarah M.",
      action: 'edited',
      feedback: "Modified payment terms to 30 days",
      editedOutput: "Approve with payment term change to Net 30",
      originalConfidence: 0.68
    },
    {
      id: "hist-003",
      timestamp: "Yesterday",
      reviewer: "Mike R.",
      action: 'rejected',
      feedback: "Non-compliant liability clause",
      originalConfidence: 0.52
    }
  ])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-50"
    if (confidence >= 0.6) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  const getStatusBadge = (status: PendingReview['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>
      case 'edited':
        return <Badge className="bg-blue-100 text-blue-700 gap-1"><Edit3 className="h-3 w-3" /> Edited</Badge>
      case 'escalated':
        return <Badge className="bg-orange-100 text-orange-700 gap-1"><AlertTriangle className="h-3 w-3" /> Escalated</Badge>
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <UserCheck className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{config.name || "Human-in-the-Loop Checkpoint"}</h2>
            <p className="text-sm text-muted-foreground">
              Require human review for critical decisions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            2 pending
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-10">
            <TabsTrigger value="config" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-2">
              <Users className="h-4 w-4" />
              Review Queue
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">2</Badge>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Configuration Tab */}
          <TabsContent value="config" className="p-4 space-y-4 m-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Checkpoint Type</CardTitle>
                <CardDescription>Define when and how humans should intervene</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Checkpoint Type</Label>
                  <Select
                    value={config.checkpointType}
                    onValueChange={(v: 'approval' | 'edit' | 'review' | 'escalation') =>
                      onConfigChange({ ...config, checkpointType: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approval">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Approval Gate
                        </div>
                      </SelectItem>
                      <SelectItem value="edit">
                        <div className="flex items-center gap-2">
                          <Edit3 className="h-4 w-4" />
                          Edit & Approve
                        </div>
                      </SelectItem>
                      <SelectItem value="review">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Review & Feedback
                        </div>
                      </SelectItem>
                      <SelectItem value="escalation">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Escalation Path
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Trigger Condition</Label>
                  <Select
                    value={config.triggerCondition}
                    onValueChange={(v: 'always' | 'confidence_below' | 'custom_rule') =>
                      onConfigChange({ ...config, triggerCondition: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">Always require review</SelectItem>
                      <SelectItem value="confidence_below">Confidence below threshold</SelectItem>
                      <SelectItem value="custom_rule">Custom rule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.triggerCondition === 'confidence_below' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Confidence Threshold</Label>
                      <span className="text-sm font-mono">{(config.confidenceThreshold || 0.8) * 100}%</span>
                    </div>
                    <Slider
                      value={[(config.confidenceThreshold || 0.8) * 100]}
                      onValueChange={([v]) => onConfigChange({
                        ...config,
                        confidenceThreshold: v / 100
                      })}
                      min={0}
                      max={100}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Trigger human review when AI confidence is below this threshold
                    </p>
                  </div>
                )}

                {config.triggerCondition === 'custom_rule' && (
                  <div className="space-y-2">
                    <Label>Custom Rule Expression</Label>
                    <Textarea
                      value={config.customRule || ""}
                      onChange={(e) => onConfigChange({ ...config, customRule: e.target.value })}
                      placeholder="output.risk_level == 'high' || input.amount > 10000"
                      className="font-mono text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeout & Escalation</CardTitle>
                <CardDescription>Configure what happens when reviews take too long</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Review Timeout</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={config.timeoutMinutes}
                      onChange={(e) => onConfigChange({
                        ...config,
                        timeoutMinutes: parseInt(e.target.value) || 60
                      })}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Timeout Action</Label>
                  <Select
                    value={config.timeoutAction}
                    onValueChange={(v: 'auto_approve' | 'auto_reject' | 'escalate') =>
                      onConfigChange({ ...config, timeoutAction: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto_approve">Auto-approve</SelectItem>
                      <SelectItem value="auto_reject">Auto-reject</SelectItem>
                      <SelectItem value="escalate">Escalate to next level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Required Approvers</Label>
                  <Select
                    value={String(config.requiredApprovers)}
                    onValueChange={(v) => onConfigChange({
                      ...config,
                      requiredApprovers: parseInt(v)
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 approver</SelectItem>
                      <SelectItem value="2">2 approvers</SelectItem>
                      <SelectItem value="3">3 approvers (consensus)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Review Options</CardTitle>
                <CardDescription>Configure the review experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Editing</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Let reviewers modify AI output before approving
                    </p>
                  </div>
                  <Switch
                    checked={config.allowEditing}
                    onCheckedChange={(v) => onConfigChange({ ...config, allowEditing: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Confidence Score</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Display AI confidence level to reviewers
                    </p>
                  </div>
                  <Switch
                    checked={config.showConfidence}
                    onCheckedChange={(v) => onConfigChange({ ...config, showConfidence: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Collect Feedback</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Require reviewers to explain their decision
                    </p>
                  </div>
                  <Switch
                    checked={config.collectFeedback}
                    onCheckedChange={(v) => onConfigChange({ ...config, collectFeedback: v })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notifications</CardTitle>
                <CardDescription>How to notify reviewers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {["Email", "Slack", "In-app"].map((channel) => (
                  <div key={channel} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{channel}</span>
                    </div>
                    <Switch
                      checked={config.notificationChannels.includes(channel.toLowerCase())}
                      onCheckedChange={(checked) => {
                        const channels = checked
                          ? [...config.notificationChannels, channel.toLowerCase()]
                          : config.notificationChannels.filter(c => c !== channel.toLowerCase())
                        onConfigChange({ ...config, notificationChannels: channels })
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review Queue Tab */}
          <TabsContent value="queue" className="p-4 space-y-4 m-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Pending Reviews</h3>
                <p className="text-sm text-muted-foreground">
                  Items waiting for human decision
                </p>
              </div>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>

            <div className="space-y-3">
              {pendingReviews.map((review) => (
                <Card key={review.id} className={review.status === 'pending' ? 'border-orange-200' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(review.status)}
                        <span className="text-xs text-muted-foreground">{review.timestamp}</span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(review.confidence)}`}>
                        {Math.round(review.confidence * 100)}% confidence
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Input:</span>{" "}
                        <span className="font-medium">{review.inputData.document as string}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {review.inputData.type as string}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">AI Decision:</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{review.aiDecision}</span>
                      </div>
                      <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        <Sparkles className="h-3 w-3 inline mr-1" />
                        {review.reasoning}
                      </div>
                    </div>

                    {review.status === 'pending' && (
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {review.assignedTo && (
                            <>
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px]">
                                  {review.assignedTo.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>Assigned to {review.assignedTo}</span>
                            </>
                          )}
                          <span>• Waiting {review.waitingTime}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-7 gap-1">
                            <Edit3 className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-red-600 hover:text-red-700">
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                          <Button size="sm" className="h-7 gap-1 bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="p-4 space-y-4 m-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Review History</h3>
                <p className="text-sm text-muted-foreground">
                  Past decisions and feedback
                </p>
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="edited">Edited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {reviewHistory.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {item.reviewer.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{item.reviewer}</span>
                            {item.action === 'approved' && (
                              <Badge className="bg-green-100 text-green-700 gap-1">
                                <ThumbsUp className="h-3 w-3" /> Approved
                              </Badge>
                            )}
                            {item.action === 'rejected' && (
                              <Badge className="bg-red-100 text-red-700 gap-1">
                                <ThumbsDown className="h-3 w-3" /> Rejected
                              </Badge>
                            )}
                            {item.action === 'edited' && (
                              <Badge className="bg-blue-100 text-blue-700 gap-1">
                                <Edit3 className="h-3 w-3" /> Edited
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${getConfidenceColor(item.originalConfidence)}`}>
                        {Math.round(item.originalConfidence * 100)}%
                      </div>
                    </div>

                    {item.feedback && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          <MessageSquare className="h-3 w-3 inline mr-1" />
                          {item.feedback}
                        </p>
                      </div>
                    )}

                    {item.editedOutput && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-sm">
                        <span className="text-muted-foreground">Modified to:</span>{" "}
                        <span className="font-medium">{item.editedOutput}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="p-4 space-y-4 m-0">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">87%</div>
                  <div className="text-sm text-muted-foreground">Approval Rate</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">12 min</div>
                  <div className="text-sm text-muted-foreground">Avg Review Time</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">23%</div>
                  <div className="text-sm text-muted-foreground">Edit Rate</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold">156</div>
                  <div className="text-sm text-muted-foreground">Total Reviews</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI Improvement Insights</CardTitle>
                <CardDescription>
                  Patterns from human corrections to improve AI accuracy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Payment terms frequently corrected</span>
                  </div>
                  <Badge variant="outline">15 corrections</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Liability clauses need more caution</span>
                  </div>
                  <Badge variant="outline">8 corrections</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

export default HITLCheckpointEditor
