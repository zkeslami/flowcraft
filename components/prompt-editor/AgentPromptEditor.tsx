"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PromptEditor } from "./PromptEditor"
import { MarkdownPreview } from "./MarkdownPreview"
import { cn } from "@/lib/utils"

interface AgentPromptEditorProps {
  value: string
  onChange: (value: string) => void
  nodeId: string
}

type EditorMode = "editor" | "preview"

export function AgentPromptEditor({ value, onChange, nodeId }: AgentPromptEditorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<EditorMode>("editor")
  const [height, setHeight] = useState(220)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)

  const MIN_HEIGHT = 220
  const MAX_HEIGHT = 500

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return

      const container = resizeRef.current.parentElement
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const newHeight = e.clientY - containerRect.top

      if (newHeight >= MIN_HEIGHT && newHeight <= MAX_HEIGHT) {
        setHeight(newHeight)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  const handleOpenDialog = useCallback(() => {
    setDialogMode("editor")
    setIsDialogOpen(true)
  }, [])

  return (
    <>
      {/* Inline Compact View */}
      <div className="relative group" ref={resizeRef}>
        <div
          className="overflow-hidden border border-border rounded-md bg-[#0a0a0b]"
          style={{ height: `${height}px` }}
        >
          <PromptEditor
            content={value}
            onChange={onChange}
            storageKey={`agent-prompt-${nodeId}`}
            isCompact={true}
            onExpand={handleOpenDialog}
          />
        </div>

        {/* Resize Handle */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize",
            "hover:bg-primary/50 transition-colors",
            isResizing && "bg-primary"
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-border rounded-t-sm" />
        </div>
      </div>

      {/* Expanded Dialog View */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-none p-0 gap-0 bg-[#0a0a0b] flex flex-col w-[90vw] h-[88vh]"
        >
          <DialogHeader className="border-b border-border pb-0 px-4 pt-3 shrink-0">
            <div className="flex items-center justify-between pb-3">
              <DialogTitle className="text-base">Agent Prompt Editor</DialogTitle>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-border bg-transparent -mx-4 -mb-0">
              <button
                onClick={() => setDialogMode("editor")}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors relative",
                  dialogMode === "editor"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Editor
                {dialogMode === "editor" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setDialogMode("preview")}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors relative",
                  dialogMode === "preview"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Preview
                {dialogMode === "preview" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </DialogHeader>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden min-h-0">
            {dialogMode === "editor" ? (
              <PromptEditor
                content={value}
                onChange={onChange}
                storageKey={`agent-prompt-${nodeId}`}
                isCompact={false}
              />
            ) : (
              <MarkdownPreview content={value} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
