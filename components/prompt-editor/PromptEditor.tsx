import { useRef, useState, useEffect } from "react";
import { EditorToolbar } from "./EditorToolbar";
import { StatusBar } from "./StatusBar";
import { CoverageOverlay } from "./CoverageOverlay";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import { useVersionHistory } from "@/hooks/useVersionHistory";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";

interface PromptEditorProps {
  content: string;
  onChange: (content: string) => void;
  storageKey?: string;
  onOpenHistory?: () => void;
  isCompact?: boolean;
  onExpand?: () => void;
}

export function PromptEditor({ content, onChange, storageKey = "prompt-versions", onOpenHistory, isCompact = false, onExpand }: PromptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 0 });
  const [showArgumentMenu, setShowArgumentMenu] = useState(false);
  const [coverageMode, setCoverageMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const {
    versions,
    lastSaved,
    isSaving,
    deleteVersion,
  } = useVersionHistory(content, { storageKey });

  const lines = content.split("\n");
  const lineCount = lines.length;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    updateCursorPosition();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "@") {
      setShowArgumentMenu(true);
    } else if (e.key === "Escape") {
      setShowArgumentMenu(false);
    }
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;

    const textBeforeCursor = text.substring(0, cursorPos);
    const line = textBeforeCursor.split("\n").length;
    const lastLineBreak = textBeforeCursor.lastIndexOf("\n");
    const column = cursorPos - lastLineBreak - 1;

    setCursorPosition({ line, column });
  };

  useEffect(() => {
    updateCursorPosition();
  }, [content]);

  const insertText = (text: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = textarea.value;

    const newContent =
      currentContent.substring(0, start) + text + currentContent.substring(end);

    onChange(newContent);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const formatSelection = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (selectedText) {
      insertText(`${prefix}${selectedText}${suffix}`);
    }
  };

  if (coverageMode) {
    return (
      <div className="flex flex-col h-full">
        <EditorToolbar
          onInsertHeading={() => {}}
          onFormatBold={() => {}}
          onFormatItalic={() => {}}
          onInsertCodeBlock={() => {}}
          onInsertOrderedList={() => {}}
          onInsertUnorderedList={() => {}}
          onInsertTable={() => {}}
          onInsertReference={() => {}}
          onInsertBlock={() => {}}
          onInsertContent={() => {}}
          coverageMode={coverageMode}
          onToggleCoverage={() => setCoverageMode(false)}
        />
        <CoverageOverlay content={content} onExit={() => setCoverageMode(false)} />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-full">
        <div className="flex flex-col flex-1">
          <EditorToolbar
            onInsertHeading={(level) => insertText("#".repeat(level) + " ")}
            onFormatBold={() => formatSelection("**")}
            onFormatItalic={() => formatSelection("*")}
            onInsertCodeBlock={() => insertText("\n```\n\n```\n")}
            onInsertOrderedList={() => insertText("1. ")}
            onInsertUnorderedList={() => insertText("- ")}
            onInsertTable={() =>
              insertText("\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n")
            }
            onInsertReference={() => setShowArgumentMenu(true)}
            onInsertBlock={(type) => {
              const blocks = {
                goal: "## Goal\n\n",
                role: "## Role\n\n",
                constraints: "## Constraints\n\n",
                output: "## Output\n\n",
                examples: "## Examples\n\n",
              };
              insertText(blocks[type as keyof typeof blocks]);
            }}
            onInsertContent={(content) => insertText(content)}
            coverageMode={coverageMode}
            onToggleCoverage={() => setCoverageMode(true)}
            isCompact={isCompact}
          />

          <div className={cn("flex-1 flex overflow-hidden", isCompact && "group")}>
            {/* Line Numbers */}
            <div className="w-12 editor-gutter border-r border-border py-4 px-2 text-right text-sm font-mono overflow-hidden select-none">
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1} className="leading-6 text-muted-foreground">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyUp={updateCursorPosition}
                onMouseUp={updateCursorPosition}
                onKeyDown={handleKeyDown}
                placeholder="Write, type / for commands, @ for references..."
                className={cn(
                  "w-full h-full p-4 bg-transparent text-foreground font-mono text-sm",
                  "resize-none outline-none leading-6",
                  "placeholder:text-muted-foreground/50",
                  isCompact && "pr-20" // Add padding on right for buttons in compact mode
                )}
                spellCheck={false}
              />

              {/* Inline Action Buttons - Only in compact mode */}
              {isCompact && onExpand && (
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onExpand}
                    className="h-6 w-6 p-0 bg-background/80 hover:bg-background"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Argument Menu */}
              {showArgumentMenu && (
                <div className="absolute top-4 left-4 bg-popover border border-border rounded-md shadow-lg p-2 min-w-[200px] z-10">
                  <div className="text-xs text-muted-foreground mb-2 px-2">
                    Select a reference:
                  </div>
                  <button
                    onClick={() => {
                      insertText("@argumentName");
                      setShowArgumentMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors font-mono"
                  >
                    @argumentName
                  </button>
                  <button
                    onClick={() => {
                      insertText("@toolName");
                      setShowArgumentMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors font-mono"
                  >
                    @toolName
                  </button>
                  <button
                    onClick={() => {
                      insertText("@domain");
                      setShowArgumentMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors font-mono"
                  >
                    @domain
                  </button>
                </div>
              )}
            </div>
          </div>

          <StatusBar
            line={cursorPosition.line}
            column={cursorPosition.column}
            tokenCount={Math.ceil(content.split(/\s+/).length * 1.3)}
            lastSaved={lastSaved}
            isSaving={isSaving}
            onOpenHistory={onOpenHistory || (() => setShowHistory(true))}
            hasVersions={versions.length > 0}
          />
        </div>

        {/* Version History Panel */}
        {showHistory && (
          <VersionHistoryPanel
            versions={versions}
            currentContent={content}
            onRevert={(newContent) => {
              onChange(newContent);
            }}
            onDeleteVersion={deleteVersion}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}