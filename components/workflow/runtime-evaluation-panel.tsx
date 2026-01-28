"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  AlertTriangle,
  Bell,
  BellOff,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  LineChart,
  Pause,
  Play,
  RefreshCw,
  Settings2,
  TrendingDown,
  TrendingUp,
  Zap,
  Shield,
  Target,
  BarChart3,
  Mail,
  MessageSquare,
  Webhook
} from "lucide-react"

// Types for Runtime Evaluations
export interface ScheduledEvaluation {
  id: string
  name: string
  evaluationSetId: string
  schedule: {
    type: 'interval' | 'cron' | 'trigger'
    value: string // e.g., "1h", "0 */6 * * *", "on_deploy"
  }
  enabled: boolean
  lastRun?: string
  nextRun?: string
  status: 'active' | 'paused' | 'error'
}

export interface DriftAlert {
  id: string
  timestamp: string
  metricName: string
  currentValue: number
  baselineValue: number
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'acknowledged' | 'resolved'
  nodeId?: string
  nodeName?: string
}

export interface MetricTrend {
  metricName: string
  displayName: string
  currentValue: number
  previousValue: number
  trend: 'up' | 'down' | 'stable'
  trendPercent: number
  history: { timestamp: string; value: number }[]
  threshold?: { warning: number; critical: number }
}

export interface NotificationChannel {
  id: string
  type: 'email' | 'slack' | 'webhook' | 'pagerduty'
  name: string
  config: Record<string, unknown>
  enabled: boolean
  alertTypes: ('drift' | 'failure' | 'threshold' | 'scheduled')[]
}

interface RuntimeEvaluationPanelProps {
  flowId: string
  scheduledEvaluations?: ScheduledEvaluation[]
  driftAlerts?: DriftAlert[]
  metricTrends?: MetricTrend[]
  notificationChannels?: NotificationChannel[]
  onUpdateSchedule: (schedule: ScheduledEvaluation) => void
  onAcknowledgeAlert: (alertId: string) => void
  onUpdateNotifications: (channel: NotificationChannel) => void
  className?: string
}

// Mock data
const mockScheduledEvaluations: ScheduledEvaluation[] = [
  {
    id: "sched-001",
    name: "Hourly Accuracy Check",
    evaluationSetId: "eval-001",
    schedule: { type: 'interval', value: "1h" },
    enabled: true,
    lastRun: "2024-01-15T14:00:00Z",
    nextRun: "2024-01-15T15:00:00Z",
    status: 'active'
  },
  {
    id: "sched-002",
    name: "Daily Full Evaluation",
    evaluationSetId: "eval-001",
    schedule: { type: 'cron', value: "0 9 * * *" },
    enabled: true,
    lastRun: "2024-01-15T09:00:00Z",
    nextRun: "2024-01-16T09:00:00Z",
    status: 'active'
  },
  {
    id: "sched-003",
    name: "Post-Deploy Validation",
    evaluationSetId: "eval-002",
    schedule: { type: 'trigger', value: "on_deploy" },
    enabled: false,
    lastRun: "2024-01-14T16:30:00Z",
    status: 'paused'
  }
]

const mockDriftAlerts: DriftAlert[] = [
  {
    id: "alert-001",
    timestamp: "2024-01-15T14:45:00Z",
    metricName: "accuracy",
    currentValue: 0.82,
    baselineValue: 0.94,
    threshold: 0.10,
    severity: 'high',
    status: 'active',
    nodeId: "3",
    nodeName: "Validate Invoice"
  },
  {
    id: "alert-002",
    timestamp: "2024-01-15T13:30:00Z",
    metricName: "latency_p95",
    currentValue: 2800,
    baselineValue: 1500,
    threshold: 1000,
    severity: 'medium',
    status: 'acknowledged',
    nodeId: "2",
    nodeName: "Extract Invoice Data"
  }
]

const mockMetricTrends: MetricTrend[] = [
  {
    metricName: "accuracy",
    displayName: "Accuracy",
    currentValue: 0.89,
    previousValue: 0.94,
    trend: 'down',
    trendPercent: -5.3,
    threshold: { warning: 0.90, critical: 0.85 },
    history: [
      { timestamp: "2024-01-10", value: 0.94 },
      { timestamp: "2024-01-11", value: 0.93 },
      { timestamp: "2024-01-12", value: 0.92 },
      { timestamp: "2024-01-13", value: 0.91 },
      { timestamp: "2024-01-14", value: 0.90 },
      { timestamp: "2024-01-15", value: 0.89 }
    ]
  },
  {
    metricName: "throughput",
    displayName: "Throughput",
    currentValue: 1247,
    previousValue: 1180,
    trend: 'up',
    trendPercent: 5.7,
    history: [
      { timestamp: "2024-01-10", value: 980 },
      { timestamp: "2024-01-11", value: 1050 },
      { timestamp: "2024-01-12", value: 1120 },
      { timestamp: "2024-01-13", value: 1180 },
      { timestamp: "2024-01-14", value: 1210 },
      { timestamp: "2024-01-15", value: 1247 }
    ]
  },
  {
    metricName: "latency_p95",
    displayName: "P95 Latency",
    currentValue: 1850,
    previousValue: 1500,
    trend: 'up',
    trendPercent: 23.3,
    threshold: { warning: 2000, critical: 3000 },
    history: [
      { timestamp: "2024-01-10", value: 1200 },
      { timestamp: "2024-01-11", value: 1350 },
      { timestamp: "2024-01-12", value: 1400 },
      { timestamp: "2024-01-13", value: 1500 },
      { timestamp: "2024-01-14", value: 1650 },
      { timestamp: "2024-01-15", value: 1850 }
    ]
  },
  {
    metricName: "error_rate",
    displayName: "Error Rate",
    currentValue: 0.02,
    previousValue: 0.01,
    trend: 'up',
    trendPercent: 100,
    threshold: { warning: 0.05, critical: 0.10 },
    history: [
      { timestamp: "2024-01-10", value: 0.008 },
      { timestamp: "2024-01-11", value: 0.01 },
      { timestamp: "2024-01-12", value: 0.012 },
      { timestamp: "2024-01-13", value: 0.015 },
      { timestamp: "2024-01-14", value: 0.018 },
      { timestamp: "2024-01-15", value: 0.02 }
    ]
  }
]

const mockNotificationChannels: NotificationChannel[] = [
  {
    id: "notif-001",
    type: 'slack',
    name: "AI-Ops Alerts",
    config: { channel: "#ai-ops-alerts", webhook: "https://..." },
    enabled: true,
    alertTypes: ['drift', 'failure', 'threshold']
  },
  {
    id: "notif-002",
    type: 'email',
    name: "Team Lead",
    config: { recipients: ["lead@example.com"] },
    enabled: true,
    alertTypes: ['critical', 'failure']
  },
  {
    id: "notif-003",
    type: 'webhook',
    name: "Incident Manager",
    config: { url: "https://..." },
    enabled: false,
    alertTypes: ['drift']
  }
]

export function RuntimeEvaluationPanel({
  scheduledEvaluations = mockScheduledEvaluations,
  driftAlerts = mockDriftAlerts,
  metricTrends = mockMetricTrends,
  notificationChannels = mockNotificationChannels,
  onUpdateSchedule,
  onAcknowledgeAlert,
  onUpdateNotifications,
  className
}: RuntimeEvaluationPanelProps) {
  const [activeTab, setActiveTab] = useState("monitoring")
  const [timeRange, setTimeRange] = useState("7d")

  const activeAlerts = useMemo(() => {
    return driftAlerts.filter(a => a.status === 'active')
  }, [driftAlerts])

  const getSeverityColor = (severity: DriftAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getMetricStatus = (metric: MetricTrend) => {
    if (!metric.threshold) return 'healthy'
    if (metric.currentValue <= metric.threshold.critical) return 'critical'
    if (metric.currentValue <= metric.threshold.warning) return 'warning'
    return 'healthy'
  }

  const renderSparkline = (history: { timestamp: string; value: number }[]) => {
    const max = Math.max(...history.map(h => h.value))
    const min = Math.min(...history.map(h => h.value))
    const range = max - min || 1

    const points = history.map((h, i) => {
      const x = (i / (history.length - 1)) * 80
      const y = 20 - ((h.value - min) / range) * 16
      return `${x},${y}`
    }).join(' ')

    return (
      <svg width="80" height="24" className="text-muted-foreground">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-primary"
        />
      </svg>
    )
  }

  return (
    <div className={`flex flex-col h-full bg-background ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Activity className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Runtime Monitoring</h2>
            <p className="text-sm text-muted-foreground">
              Live evaluation metrics and drift detection
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeAlerts.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {activeAlerts.length} Active Alert{activeAlerts.length > 1 ? 's' : ''}
            </Badge>
          )}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-10">
            <TabsTrigger value="monitoring" className="gap-2">
              <LineChart className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alerts
              {activeAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                  {activeAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="schedules" className="gap-2">
              <Calendar className="h-4 w-4" />
              Schedules
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="p-4 m-0 space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              {metricTrends.map(metric => {
                const status = getMetricStatus(metric)
                return (
                  <Card key={metric.metricName} className={
                    status === 'critical' ? 'border-red-300' :
                    status === 'warning' ? 'border-yellow-300' : ''
                  }>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">{metric.displayName}</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold">
                              {metric.metricName === 'accuracy' || metric.metricName === 'error_rate'
                                ? `${(metric.currentValue * 100).toFixed(1)}%`
                                : metric.metricName === 'latency_p95'
                                ? `${metric.currentValue}ms`
                                : metric.currentValue.toLocaleString()
                              }
                            </span>
                            <span className={`text-xs flex items-center gap-0.5 ${
                              metric.trend === 'up'
                                ? metric.metricName === 'error_rate' || metric.metricName === 'latency_p95'
                                  ? 'text-red-600'
                                  : 'text-green-600'
                                : metric.trend === 'down'
                                ? metric.metricName === 'accuracy' || metric.metricName === 'throughput'
                                  ? 'text-red-600'
                                  : 'text-green-600'
                                : 'text-muted-foreground'
                            }`}>
                              {metric.trend === 'up' ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : metric.trend === 'down' ? (
                                <TrendingDown className="h-3 w-3" />
                              ) : null}
                              {Math.abs(metric.trendPercent).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        {renderSparkline(metric.history)}
                      </div>

                      {metric.threshold && (
                        <div className="mt-3">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                status === 'critical' ? 'bg-red-500' :
                                status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{
                                width: `${Math.min(100, (metric.currentValue / metric.threshold.critical) * 100)}%`
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                            <span>Warning: {metric.threshold.warning}</span>
                            <span>Critical: {metric.threshold.critical}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Drift Detection Status */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  Drift Detection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Statistical Drift Detection</span>
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Concept Drift Monitoring</span>
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Distribution Analysis</span>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Last run 2h ago
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="p-4 m-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Alerts</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {driftAlerts.map(alert => (
                <Card key={alert.id} className={`border-l-4 ${
                  alert.severity === 'critical' ? 'border-l-red-500' :
                  alert.severity === 'high' ? 'border-l-orange-500' :
                  alert.severity === 'medium' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[10px] ${getSeverityColor(alert.severity)}`}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          {alert.status === 'active' && (
                            <Badge variant="destructive" className="text-[10px] animate-pulse">
                              ACTIVE
                            </Badge>
                          )}
                          {alert.status === 'acknowledged' && (
                            <Badge variant="outline" className="text-[10px]">
                              ACKNOWLEDGED
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-sm">
                          {alert.metricName.replace('_', ' ')} Drift Detected
                        </h4>
                        {alert.nodeName && (
                          <p className="text-xs text-muted-foreground">
                            Node: {alert.nodeName}
                          </p>
                        )}
                        <div className="mt-2 grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">Current:</span>{" "}
                            <span className="font-mono font-medium text-red-600">
                              {alert.currentValue}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Baseline:</span>{" "}
                            <span className="font-mono">{alert.baselineValue}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Threshold:</span>{" "}
                            <span className="font-mono">{alert.threshold}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                        {alert.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => onAcknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {driftAlerts.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-medium">No drift alerts</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All metrics are within expected ranges
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="p-4 m-0 space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                Add Schedule
              </Button>
            </div>

            <div className="space-y-3">
              {scheduledEvaluations.map(schedule => (
                <Card key={schedule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          schedule.enabled ? 'bg-green-100 dark:bg-green-950/30' : 'bg-muted'
                        }`}>
                          {schedule.enabled ? (
                            <Play className="h-4 w-4 text-green-600" />
                          ) : (
                            <Pause className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{schedule.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {schedule.schedule.type === 'interval' && (
                              <span>Every {schedule.schedule.value}</span>
                            )}
                            {schedule.schedule.type === 'cron' && (
                              <span>Cron: {schedule.schedule.value}</span>
                            )}
                            {schedule.schedule.type === 'trigger' && (
                              <span>Trigger: {schedule.schedule.value}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-xs">
                          {schedule.lastRun && (
                            <div className="text-muted-foreground">
                              Last: {new Date(schedule.lastRun).toLocaleString()}
                            </div>
                          )}
                          {schedule.nextRun && schedule.enabled && (
                            <div className="text-primary">
                              Next: {new Date(schedule.nextRun).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <Switch
                          checked={schedule.enabled}
                          onCheckedChange={(checked) => {
                            onUpdateSchedule({ ...schedule, enabled: checked })
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="p-4 m-0 space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-1" />
                Add Channel
              </Button>
            </div>

            <div className="space-y-3">
              {notificationChannels.map(channel => (
                <Card key={channel.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          channel.enabled ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          {channel.type === 'slack' && <MessageSquare className="h-4 w-4" />}
                          {channel.type === 'email' && <Mail className="h-4 w-4" />}
                          {channel.type === 'webhook' && <Webhook className="h-4 w-4" />}
                          {channel.type === 'pagerduty' && <Zap className="h-4 w-4" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{channel.name}</h4>
                          <div className="flex items-center gap-1 mt-1">
                            {channel.alertTypes.map(type => (
                              <Badge key={type} variant="outline" className="text-[10px] capitalize">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={channel.enabled}
                          onCheckedChange={(checked) => {
                            onUpdateNotifications({ ...channel, enabled: checked })
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Alert Routing Rules</CardTitle>
                <CardDescription className="text-xs">
                  Configure which alerts go to which channels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Critical alerts</span>
                  <span className="text-xs text-muted-foreground">→ All channels</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">High severity drift</span>
                  <span className="text-xs text-muted-foreground">→ Slack, Email</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Scheduled run failures</span>
                  <span className="text-xs text-muted-foreground">→ Slack only</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

export default RuntimeEvaluationPanel
