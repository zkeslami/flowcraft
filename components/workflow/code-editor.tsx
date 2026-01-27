"use client"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface CodeEditorProps {
  value: string
  language: string
  readOnly?: boolean
  onChange?: (value: string) => void
}

export function CodeEditor({ value, language, readOnly = false, onChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbers = value.split("\n").length

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value])

  return (
    <div className="flex h-full overflow-auto font-mono text-sm text-black bg-background">
      {/* Line numbers */}
      <div className="sticky left-0 flex flex-col border-r border-border bg-secondary/50 px-3 py-3 text-right text-muted-foreground select-none">
        {Array.from({ length: lineNumbers }, (_, i) => (
          <span key={i + 1} className="leading-6">
            {i + 1}
          </span>
        ))}
      </div>

      {/* Code content */}
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          className={cn(
            "h-full min-h-full w-full resize-none bg-transparent p-3 leading-6 text-foreground outline-none",
            readOnly && "cursor-default opacity-80",
          )}
          spellCheck={false}
          style={{
            tabSize: 2,
          }}
        />
      </div>
    </div>
  )
}
