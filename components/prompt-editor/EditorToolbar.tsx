"use client"

import { useState, useRef, useEffect } from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  Table,
  AtSign,
  LayoutGrid,
  MessageSquare,
  BookOpen,
  Sparkles,
  ShieldCheck,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PromptLibrary } from "./PromptLibrary";

interface EditorToolbarProps {
  onInsertHeading: (level: 1 | 2 | 3) => void;
  onFormatBold: () => void;
  onFormatItalic: () => void;
  onInsertCodeBlock: () => void;
  onInsertOrderedList: () => void;
  onInsertUnorderedList: () => void;
  onInsertTable: () => void;
  onInsertReference: () => void;
  onInsertBlock: (type: string) => void;
  onInsertContent?: (content: string) => void;
  coverageMode?: boolean;
  onToggleCoverage?: () => void;
  isCompact?: boolean;
}

export function EditorToolbar({
  onInsertHeading,
  onFormatBold,
  onFormatItalic,
  onInsertCodeBlock,
  onInsertOrderedList,
  onInsertUnorderedList,
  onInsertTable,
  onInsertReference,
  onInsertBlock,
  onInsertContent,
  coverageMode = false,
  onToggleCoverage,
  isCompact = false,
}: EditorToolbarProps) {
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [overflowItems, setOverflowItems] = useState<string[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (!toolbarRef.current) return;

      const toolbarWidth = toolbarRef.current.offsetWidth;
      const itemsContainer = toolbarRef.current.querySelector('[data-toolbar-items]');

      if (!itemsContainer) return;

      // Estimate widths - these are approximate button widths
      const buttonWidth = 28; // w-6 + gap
      const dividerWidth = 10;
      const commentButtonWidth = 60; // Coverage button is wider

      // Calculate available width (leave space for flexbox spacer and potential more button)
      const availableWidth = toolbarWidth - 100; // Reserve space for more button and spacing

      // Priority order: core buttons first, then nice-to-have
      const buttons = [
        { id: 'autopilot', width: buttonWidth, priority: 1 },
        { id: 'divider1', width: dividerWidth, priority: 1 },
        { id: 'heading', width: buttonWidth, priority: 1 },
        { id: 'bold', width: buttonWidth, priority: 2 },
        { id: 'italic', width: buttonWidth, priority: 2 },
        { id: 'code', width: buttonWidth, priority: 3 },
        { id: 'divider2', width: dividerWidth, priority: 3 },
        { id: 'orderedList', width: buttonWidth, priority: 4 },
        { id: 'unorderedList', width: buttonWidth, priority: 4 },
        { id: 'divider3', width: dividerWidth, priority: 5 },
        { id: 'table', width: buttonWidth, priority: 5 },
        { id: 'reference', width: buttonWidth, priority: 2 }, // Keep reference visible
        { id: 'block', width: buttonWidth, priority: 4 },
        { id: 'library', width: buttonWidth, priority: 6 },
        { id: 'comment', width: buttonWidth, priority: 7 },
        { id: 'coverage', width: commentButtonWidth, priority: 8 },
      ];

      let usedWidth = 0;
      const overflow: string[] = [];

      // Calculate which items overflow
      for (const button of buttons.sort((a, b) => b.priority - a.priority)) {
        if (usedWidth + button.width > availableWidth) {
          overflow.push(button.id);
        } else {
          usedWidth += button.width;
        }
      }

      setOverflowItems(overflow);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    // Also check after a short delay to account for layout shifts
    const timeout = setTimeout(checkOverflow, 100);

    return () => {
      window.removeEventListener("resize", checkOverflow);
      clearTimeout(timeout);
    };
  }, []);

  const handleInsertFromLibrary = (content: string) => {
    onInsertContent?.(content);
  };

  const shouldShow = (id: string) => !overflowItems.includes(id);
  const hasOverflow = overflowItems.length > 0;

  return (
    <TooltipProvider>
      <div
        ref={toolbarRef}
        className="flex items-center gap-0.5 px-2 py-1 border-b border-border bg-[#0f1114]"
        data-toolbar-items
      >
        {/* Autopilot - Always visible */}
        {shouldShow('autopilot') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                <Sparkles className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Autopilot - AI improve</p>
            </TooltipContent>
          </Tooltip>
        )}

        {shouldShow('divider1') && <div className="w-px h-4 bg-border mx-0.5 shrink-0" />}

        {/* Headings */}
        {shouldShow('heading') && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                    <Heading1 className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Insert Heading</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onInsertHeading(1)}>
                <Heading1 className="mr-2 h-4 w-4" />
                <span className="flex-1">Heading 1</span>
                <span className="text-xs text-muted-foreground ml-4">#</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onInsertHeading(2)}>
                <Heading2 className="mr-2 h-4 w-4" />
                <span className="flex-1">Heading 2</span>
                <span className="text-xs text-muted-foreground ml-4">##</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onInsertHeading(3)}>
                <Heading3 className="mr-2 h-4 w-4" />
                <span className="flex-1">Heading 3</span>
                <span className="text-xs text-muted-foreground ml-4">###</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Bold */}
        {shouldShow('bold') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onFormatBold}
                className="h-6 w-6 p-0 shrink-0"
              >
                <Bold className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bold</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Italic */}
        {shouldShow('italic') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onFormatItalic}
                className="h-6 w-6 p-0 shrink-0"
              >
                <Italic className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Italic</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Code Block */}
        {shouldShow('code') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onInsertCodeBlock}
                className="h-6 w-6 p-0 shrink-0"
              >
                <Code className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Code Block</p>
            </TooltipContent>
          </Tooltip>
        )}

        {shouldShow('divider2') && <div className="w-px h-4 bg-border mx-0.5 shrink-0" />}

        {/* Lists */}
        {shouldShow('orderedList') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onInsertOrderedList}
                className="h-6 w-6 p-0 shrink-0"
              >
                <ListOrdered className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ordered List</p>
            </TooltipContent>
          </Tooltip>
        )}

        {shouldShow('unorderedList') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onInsertUnorderedList}
                className="h-6 w-6 p-0 shrink-0"
              >
                <List className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Unordered List</p>
            </TooltipContent>
          </Tooltip>
        )}

        {shouldShow('divider3') && <div className="w-px h-4 bg-border mx-0.5 shrink-0" />}

        {/* Table */}
        {shouldShow('table') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onInsertTable}
                className="h-6 w-6 p-0 shrink-0"
              >
                <Table className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Insert Table</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Reference - Keep visible */}
        {shouldShow('reference') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onInsertReference}
                className="h-6 w-6 p-0 shrink-0"
              >
                <AtSign className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Insert Reference</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Insert Block */}
        {shouldShow('block') && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                    <LayoutGrid className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Insert Block</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => onInsertBlock("goal")}>
                Goal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onInsertBlock("role")}>
                Role
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onInsertBlock("constraints")}>
                Constraints
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onInsertBlock("output")}>
                Output
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onInsertBlock("examples")}>
                Examples
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {shouldShow('comment') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                <MessageSquare className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Comment</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Prompt Library */}
        {shouldShow('library') && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPromptLibrary(true)}
                className="h-6 w-6 p-0 shrink-0"
              >
                <BookOpen className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Prompt Library</p>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="flex-1 min-w-2" />

        {/* Coverage Mode */}
        {shouldShow('coverage') && onToggleCoverage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCoverage}
                className={cn(
                  "h-6 px-2 gap-1.5 shrink-0",
                  coverageMode && "bg-primary/20 text-primary"
                )}
              >
                <ShieldCheck className="h-3 w-3" />
                <span className="text-xs font-medium">Coverage</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Evaluations Coverage</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* More Menu - Only show when there's actual overflow */}
        {hasOverflow && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>More options</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              {!shouldShow('bold') && (
                <DropdownMenuItem onClick={onFormatBold}>
                  <Bold className="mr-2 h-4 w-4" />
                  Bold
                </DropdownMenuItem>
              )}
              {!shouldShow('italic') && (
                <DropdownMenuItem onClick={onFormatItalic}>
                  <Italic className="mr-2 h-4 w-4" />
                  Italic
                </DropdownMenuItem>
              )}
              {!shouldShow('code') && (
                <DropdownMenuItem onClick={onInsertCodeBlock}>
                  <Code className="mr-2 h-4 w-4" />
                  Code Block
                </DropdownMenuItem>
              )}
              {(!shouldShow('orderedList') || !shouldShow('unorderedList')) && <DropdownMenuSeparator />}
              {!shouldShow('orderedList') && (
                <DropdownMenuItem onClick={onInsertOrderedList}>
                  <ListOrdered className="mr-2 h-4 w-4" />
                  Ordered List
                </DropdownMenuItem>
              )}
              {!shouldShow('unorderedList') && (
                <DropdownMenuItem onClick={onInsertUnorderedList}>
                  <List className="mr-2 h-4 w-4" />
                  Unordered List
                </DropdownMenuItem>
              )}
              {!shouldShow('table') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onInsertTable}>
                    <Table className="mr-2 h-4 w-4" />
                    Table
                  </DropdownMenuItem>
                </>
              )}
              {!shouldShow('library') && (
                <DropdownMenuItem onClick={() => setShowPromptLibrary(true)}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Prompt Library
                </DropdownMenuItem>
              )}
              {!shouldShow('comment') && (
                <DropdownMenuItem onClick={() => {}}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Add Comment
                </DropdownMenuItem>
              )}
              {onToggleCoverage && !shouldShow('coverage') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onToggleCoverage}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {coverageMode ? "Exit Coverage" : "Coverage Mode"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Prompt Library Dialog */}
      {showPromptLibrary && (
        <PromptLibrary
          onClose={() => setShowPromptLibrary(false)}
          onInsert={handleInsertFromLibrary}
        />
      )}
    </TooltipProvider>
  );
}
