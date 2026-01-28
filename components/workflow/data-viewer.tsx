"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Code2, Table as TableIcon, List, Download, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { CodeEditor } from "./code-editor"

export type ViewMode = "json" | "table" | "list"

interface DataViewerProps {
  data: Record<string, unknown> | null
  mode?: "input" | "output"
  readOnly?: boolean
  onChange?: (value: string) => void
  className?: string
}

export function DataViewer({ data, mode = "output", readOnly = false, onChange, className }: DataViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("json")
  const [copied, setCopied] = useState(false)

  const jsonString = data ? JSON.stringify(data, null, 2) : "{}"

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${mode}-data.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderTableView = () => {
    if (!data || typeof data !== "object") {
      return (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          No data available
        </div>
      )
    }

    const entries = Object.entries(data)

    return (
      <div className="h-full overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-secondary border-b border-border">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-foreground">Parameter</th>
              <th className="text-left px-3 py-2 font-medium text-foreground">Value</th>
              <th className="text-left px-3 py-2 font-medium text-foreground">Type</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value], index) => (
              <tr key={key} className={cn("border-b border-border/50", index % 2 === 0 ? "bg-secondary/30" : "")}>
                <td className="px-3 py-2 font-mono text-xs text-foreground">{key}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {typeof value === "object" && value !== null
                    ? JSON.stringify(value)
                    : String(value)}
                </td>
                <td className="px-3 py-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-medium",
                    typeof value === "string" && "bg-blue-500/10 text-blue-500",
                    typeof value === "number" && "bg-purple-500/10 text-purple-500",
                    typeof value === "boolean" && "bg-orange-500/10 text-orange-500",
                    typeof value === "object" && "bg-green-500/10 text-green-500"
                  )}>
                    {Array.isArray(value) ? "array" : typeof value}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderListView = () => {
    if (!data || typeof data !== "object") {
      return (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          No data available
        </div>
      )
    }

    const entries = Object.entries(data)

    return (
      <div className="h-full overflow-auto p-4 space-y-3">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-lg border border-border bg-secondary/30 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium font-mono">
                {key}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-medium",
                typeof value === "string" && "bg-blue-500/10 text-blue-500",
                typeof value === "number" && "bg-purple-500/10 text-purple-500",
                typeof value === "boolean" && "bg-orange-500/10 text-orange-500",
                typeof value === "object" && "bg-green-500/10 text-green-500"
              )}>
                {Array.isArray(value) ? "array" : typeof value}
              </span>
            </div>
            <div className="font-mono text-sm text-foreground bg-background/50 rounded p-2 break-all">
              {typeof value === "object" && value !== null
                ? JSON.stringify(value, null, 2)
                : String(value)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* View mode toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-3 py-2 shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2 gap-1.5", viewMode === "json" && "bg-secondary")}
            onClick={() => setViewMode("json")}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span className="text-xs">JSON</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2 gap-1.5", viewMode === "table" && "bg-secondary")}
            onClick={() => setViewMode("table")}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span className="text-xs">Table</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2 gap-1.5", viewMode === "list" && "bg-secondary")}
            onClick={() => setViewMode("list")}
          >
            <List className="h-3.5 w-3.5" />
            <span className="text-xs">List</span>
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleDownload}
            title="Download JSON"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "json" && (
          <CodeEditor
            value={jsonString}
            onChange={onChange || (() => {})}
            language="json"
            readOnly={readOnly}
          />
        )}
        {viewMode === "table" && renderTableView()}
        {viewMode === "list" && renderListView()}
      </div>
    </div>
  )
}
