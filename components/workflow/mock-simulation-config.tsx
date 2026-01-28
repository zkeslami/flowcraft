"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Database, Wand2, FileJson, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { CodeEditor } from "./code-editor"
import type { ExecutionSpan } from "@/lib/execution-types"

export interface MockConfig {
  enabled: boolean
  source: "custom" | "history"
  customData?: string
  historyRunId?: string
}

export interface SimulationConfig {
  enabled: boolean
  prompt: string
}

interface MockSimulationConfigProps {
  mockConfig: MockConfig
  simulationConfig: SimulationConfig
  onMockConfigChange: (config: MockConfig) => void
  onSimulationConfigChange: (config: SimulationConfig) => void
  availableRuns?: ExecutionSpan[]
  className?: string
}

export function MockSimulationConfig({
  mockConfig,
  simulationConfig,
  onMockConfigChange,
  onSimulationConfigChange,
  availableRuns = [],
  className,
}: MockSimulationConfigProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Mock Data Section */}
      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium text-foreground">Mock Data Mode</Label>
          </div>
          <Switch
            checked={mockConfig.enabled}
            onCheckedChange={(enabled) => onMockConfigChange({ ...mockConfig, enabled })}
          />
        </div>

        {mockConfig.enabled && (
          <div className="space-y-3 mt-3 pt-3 border-t border-border">
            <RadioGroup
              value={mockConfig.source}
              onValueChange={(source: "custom" | "history") =>
                onMockConfigChange({ ...mockConfig, source })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="mock-custom" />
                <Label htmlFor="mock-custom" className="text-xs font-normal cursor-pointer flex items-center gap-2">
                  <FileJson className="h-3.5 w-3.5" />
                  Custom JSON Data
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="history" id="mock-history" />
                <Label htmlFor="mock-history" className="text-xs font-normal cursor-pointer flex items-center gap-2">
                  <History className="h-3.5 w-3.5" />
                  From Run History
                </Label>
              </div>
            </RadioGroup>

            {mockConfig.source === "custom" && (
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground mb-2 block">Custom Mock Data</Label>
                <div className="h-40 border border-border rounded-md overflow-hidden">
                  <CodeEditor
                    value={mockConfig.customData || "{\n  \"example\": \"data\"\n}"}
                    onChange={(value) => onMockConfigChange({ ...mockConfig, customData: value })}
                    language="json"
                  />
                </div>
              </div>
            )}

            {mockConfig.source === "history" && (
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground mb-2 block">Select Run</Label>
                <Select
                  value={mockConfig.historyRunId}
                  onValueChange={(historyRunId) => onMockConfigChange({ ...mockConfig, historyRunId })}
                >
                  <SelectTrigger className="h-8 bg-background">
                    <SelectValue placeholder="Select a previous run" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRuns.length > 0 ? (
                      availableRuns.map((run) => (
                        <SelectItem key={run.id} value={run.id}>
                          {run.nodeName} - {new Date(run.startTime).toLocaleString()} ({run.status})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-runs" disabled>
                        No runs available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Simulation Mode Section */}
      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium text-foreground">Simulation Mode</Label>
          </div>
          <Switch
            checked={simulationConfig.enabled}
            onCheckedChange={(enabled) => onSimulationConfigChange({ ...simulationConfig, enabled })}
          />
        </div>

        {simulationConfig.enabled && (
          <div className="space-y-3 mt-3 pt-3 border-t border-border">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Simulation Instructions
              </Label>
              <p className="text-[10px] text-muted-foreground/70 mb-2">
                Describe how the output should be simulated (e.g., "Return validation successful with confidence score 0.95")
              </p>
              <Textarea
                value={simulationConfig.prompt}
                onChange={(e) => onSimulationConfigChange({ ...simulationConfig, prompt: e.target.value })}
                placeholder="Enter simulation instructions..."
                className="min-h-[120px] text-xs bg-background resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {mockConfig.enabled && simulationConfig.enabled && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            <strong>Note:</strong> Both Mock Data and Simulation modes are enabled. Simulation mode will override mock data.
          </p>
        </div>
      )}
    </div>
  )
}
