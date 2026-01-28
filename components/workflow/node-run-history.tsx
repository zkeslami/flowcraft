"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  ArrowLeft,
  Download,
  Copy,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExecutionSpan } from "@/lib/execution-types"
import { DataViewer } from "./data-viewer"

interface NodeRunHistoryProps {
  nodeId: string
  nodeName: string
  runs: ExecutionSpan[]
  onClose: () => void
  onSelectRun?: (run: ExecutionSpan) => void
}

const statusConfig = {
  pending: { icon: Circle, className: "text-orange-400 bg-orange-500/10 border-orange-500", label: "Pending" },
  running: { icon: Loader2, className: "text-blue-400 bg-blue-500/10 border-blue-500", label: "Running" },
  success: { icon: CheckCircle2, className: "text-green-400 bg-green-500/10 border-green-500", label: "Success" },
  error: { icon: XCircle, className: "text-red-400 bg-red-500/10 border-red-500", label: "Failed" },
}

const formatDuration = (ms?: number) => {
  if (!ms) return "-"
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

export function NodeRunHistory({ nodeId, nodeName, runs, onClose, onSelectRun }: NodeRunHistoryProps) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(runs[0]?.id || null)
  const [copiedInput, setCopiedInput] = useState(false)
  const [copiedOutput, setCopiedOutput] = useState(false)

  const selectedRun = runs.find((r) => r.id === selectedRunId)

  const handleSelectRun = (run: ExecutionSpan) => {
    setSelectedRunId(run.id)
    onSelectRun?.(run)
  }

  const handleCopyInput = () => {
    if (selectedRun?.inputs) {
      navigator.clipboard.writeText(JSON.stringify(selectedRun.inputs, null, 2))
      setCopiedInput(true)
      setTimeout(() => setCopiedInput(false), 2000)
    }
  }

  const handleCopyOutput = () => {
    if (selectedRun?.outputs) {
      navigator.clipboard.writeText(JSON.stringify(selectedRun.outputs, null, 2))
      setCopiedOutput(true)
      setTimeout(() => setCopiedOutput(false), 2000)
    }
  }

  const handleDownloadData = () => {
    if (!selectedRun) return
    const data = {
      runId: selectedRun.id,
      nodeName: selectedRun.nodeName,
      status: selectedRun.status,
      startTime: selectedRun.startTime,
      endTime: selectedRun.endTime,
      duration: selectedRun.duration,
      inputs: selectedRun.inputs,
      outputs: selectedRun.outputs,
      logs: selectedRun.logs,
      metrics: selectedRun.metrics,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${nodeName}-run-${selectedRun.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Run History</h3>
            <p className="text-xs text-muted-foreground">{nodeName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleDownloadData}>
            <Download className="h-3.5 w-3.5" />
            Export Run
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Runs list - left side */}
        <div className="w-64 border-r border-border flex flex-col">
          <div className="px-3 py-2 border-b border-border bg-secondary/30">
            <p className="text-xs font-medium text-muted-foreground">
              {runs.length} run{runs.length !== 1 ? "s" : ""}
            </p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {runs.map((run) => {
                const config = statusConfig[run.status]
                const StatusIcon = config.icon
                const isSelected = run.id === selectedRunId

                return (
                  <button
                    key={run.id}
                    onClick={() => handleSelectRun(run)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md transition-colors",
                      isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <StatusIcon className={cn("h-3.5 w-3.5", config.className.split(" ")[0])} />
                      <span className="text-xs font-medium text-foreground">
                        {format(run.startTime, "MMM d, HH:mm:ss")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className={cn("text-[10px] h-4 px-1", config.className)}>
                        {config.label}
                      </Badge>
                      {run.duration && <span>{formatDuration(run.duration)}</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Run details - right side */}
        {selectedRun ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Run metadata */}
            <div className="px-4 py-3 border-b border-border bg-secondary/30 shrink-0">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className={cn("ml-2 text-[10px] h-5", statusConfig[selectedRun.status].className)}>
                    {statusConfig[selectedRun.status].label}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-2 text-foreground font-medium">{formatDuration(selectedRun.duration)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <span className="ml-2 text-foreground font-medium">
                    {format(selectedRun.startTime, "HH:mm:ss")}
                  </span>
                </div>
              </div>
            </div>

            {/* Input/Output split */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Input */}
              <div className="flex-1 flex flex-col border-b border-border">
                <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 border-b border-border shrink-0">
                  <span className="text-xs font-medium text-foreground">Input</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleCopyInput}
                    title="Copy input"
                  >
                    {copiedInput ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <DataViewer data={selectedRun.inputs || {}} mode="input" readOnly />
                </div>
              </div>

              {/* Output */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 border-b border-border shrink-0">
                  <span className="text-xs font-medium text-foreground">Output</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleCopyOutput}
                    title="Copy output"
                  >
                    {copiedOutput ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <DataViewer data={selectedRun.outputs || {}} mode="output" readOnly />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            No run selected
          </div>
        )}
      </div>
    </div>
  )
}
