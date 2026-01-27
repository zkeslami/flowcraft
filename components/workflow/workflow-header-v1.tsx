"use client"

import { Button } from "@/components/ui/button"
import { Save, Undo, Redo, Settings, ChevronDown, ArrowLeft } from "lucide-react"

interface WorkflowHeaderV1Props {
  onBack: () => void
}

export function WorkflowHeaderV1({ onBack }: WorkflowHeaderV1Props) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-primary-foreground"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-semibold text-foreground">Flow</span>
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Project:</span>
          <button className="flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-foreground hover:bg-secondary">
            User Onboarding Flow
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border border-border bg-secondary/50 p-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Save className="h-4 w-4" />
          Save
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
