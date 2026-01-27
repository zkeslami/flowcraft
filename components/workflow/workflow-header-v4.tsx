"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WorkflowHeaderV4Props {
  onBack: () => void
}

export function WorkflowHeaderV4({ onBack }: WorkflowHeaderV4Props) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 text-primary-foreground"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-medium text-foreground">Flow</span>
          <span className="text-xs text-muted-foreground">AI + Side Panel</span>
        </div>
      </div>
    </header>
  )
}
