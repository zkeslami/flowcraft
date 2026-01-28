"use client"

import * as React from "react"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  FlaskConical,
  Activity,
  Brain,
  FileSpreadsheet,
  Target,
  History,
  Settings2
} from "lucide-react"

// Import theme components
import { EpisodicMemoryPanel, Case } from "./episodic-memory-panel"
import { EvaluationBuilderPanel, EvaluationSet } from "./evaluation-builder-panel"
import { RuntimeEvaluationPanel, ScheduledEvaluation, DriftAlert, MetricTrend, NotificationChannel } from "./runtime-evaluation-panel"

// This component provides the enhanced content for the Evaluations tab
// It integrates Themes 3, 4, and 5 into a unified experience

interface EnhancedSidebarContentProps {
  // Memory props (Theme 3)
  cases?: Case[]
  selectedCaseId?: string
  onSelectCase?: (caseId: string) => void
  onSelectProcess?: (processId: string) => void
  onSelectAgent?: (agentId: string) => void

  // Evaluation props (Theme 4)
  evaluationSets?: EvaluationSet[]
  selectedEvaluationSetId?: string
  onSelectEvaluationSet?: (setId: string) => void
  onSaveEvaluationSet?: (set: EvaluationSet) => void
  onRunEvaluation?: (setId: string) => void

  // Runtime props (Theme 5)
  scheduledEvaluations?: ScheduledEvaluation[]
  driftAlerts?: DriftAlert[]
  metricTrends?: MetricTrend[]
  notificationChannels?: NotificationChannel[]
  onUpdateSchedule?: (schedule: ScheduledEvaluation) => void
  onAcknowledgeAlert?: (alertId: string) => void
  onUpdateNotifications?: (channel: NotificationChannel) => void

  className?: string
}

export function EnhancedSidebarContent({
  cases = [],
  selectedCaseId,
  onSelectCase = () => {},
  onSelectProcess = () => {},
  onSelectAgent = () => {},
  evaluationSets = [],
  selectedEvaluationSetId,
  onSaveEvaluationSet = () => {},
  onRunEvaluation = () => {},
  scheduledEvaluations = [],
  driftAlerts = [],
  metricTrends = [],
  notificationChannels = [],
  onUpdateSchedule = () => {},
  onAcknowledgeAlert = () => {},
  onUpdateNotifications = () => {},
  className
}: EnhancedSidebarContentProps) {
  const [activeSubTab, setActiveSubTab] = useState<"memory" | "evals" | "monitoring">("evals")

  const activeAlertCount = driftAlerts.filter(a => a.status === 'active').length
  const selectedEvaluationSet = evaluationSets.find(s => s.id === selectedEvaluationSetId)

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Sub-tabs for different evaluation/monitoring features */}
      <div className="border-b px-2">
        <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as typeof activeSubTab)}>
          <TabsList className="h-9 w-full grid grid-cols-3">
            <TabsTrigger value="memory" className="text-xs gap-1">
              <Brain className="h-3 w-3" />
              Memory
            </TabsTrigger>
            <TabsTrigger value="evals" className="text-xs gap-1">
              <FlaskConical className="h-3 w-3" />
              Evals
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="text-xs gap-1">
              <Activity className="h-3 w-3" />
              Monitor
              {activeAlertCount > 0 && (
                <Badge variant="destructive" className="h-4 px-1 text-[10px] ml-1">
                  {activeAlertCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content based on active sub-tab */}
      <div className="flex-1 overflow-hidden">
        {activeSubTab === "memory" && (
          <EpisodicMemoryPanel
            cases={cases}
            selectedCaseId={selectedCaseId}
            onSelectCase={onSelectCase}
            onSelectProcess={onSelectProcess}
            onSelectAgent={onSelectAgent}
            onAddFeedback={() => {}}
            onArchiveCase={() => {}}
            className="h-full"
          />
        )}

        {activeSubTab === "evals" && (
          <div className="h-full">
            {selectedEvaluationSet ? (
              <EvaluationBuilderPanel
                evaluationSet={selectedEvaluationSet}
                onSave={onSaveEvaluationSet}
                onRun={onRunEvaluation}
                className="h-full"
              />
            ) : (
              <EvaluationSetList
                evaluationSets={evaluationSets}
                onSelect={(setId) => {
                  // This would trigger a parent to set selectedEvaluationSetId
                }}
              />
            )}
          </div>
        )}

        {activeSubTab === "monitoring" && (
          <RuntimeEvaluationPanel
            flowId="current-flow"
            scheduledEvaluations={scheduledEvaluations}
            driftAlerts={driftAlerts}
            metricTrends={metricTrends}
            notificationChannels={notificationChannels}
            onUpdateSchedule={onUpdateSchedule}
            onAcknowledgeAlert={onAcknowledgeAlert}
            onUpdateNotifications={onUpdateNotifications}
            className="h-full"
          />
        )}
      </div>
    </div>
  )
}

// Simple list component for selecting evaluation sets
function EvaluationSetList({
  evaluationSets,
  onSelect
}: {
  evaluationSets: EvaluationSet[]
  onSelect: (setId: string) => void
}) {
  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-2">
        {evaluationSets.map(set => (
          <div
            key={set.id}
            onClick={() => onSelect(set.id)}
            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-sm">{set.name}</h4>
              <Badge variant="secondary" className="text-xs">
                {set.datapoints.length} datapoints
              </Badge>
            </div>
            {set.description && (
              <p className="text-xs text-muted-foreground">{set.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>{set.evaluators.length} evaluators</span>
              {set.lastRunAt && (
                <>
                  <span>•</span>
                  <History className="h-3 w-3" />
                  <span>Last run {new Date(set.lastRunAt).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        ))}

        {evaluationSets.length === 0 && (
          <div className="text-center p-6 text-muted-foreground">
            <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No evaluation sets</p>
            <p className="text-xs mt-1">Create one to start testing your flow</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

export default EnhancedSidebarContent
