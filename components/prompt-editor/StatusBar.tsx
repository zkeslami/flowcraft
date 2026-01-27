import { FileCode2, History, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatusBarProps {
  line: number;
  column: number;
  tokenCount: number;
  lastSaved?: Date | null;
  isSaving?: boolean;
  onOpenHistory?: () => void;
  hasVersions?: boolean;
}

function formatLastSaved(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function StatusBar({
  line,
  column,
  tokenCount,
  lastSaved,
  isSaving,
  onOpenHistory,
  hasVersions,
}: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1 border-t border-border bg-[#0f1114] text-xs font-mono shrink-0">
      <div className="flex items-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <FileCode2 className="h-3 w-3" />
          <span>Prompt</span>
        </div>

        {/* Auto-save Status */}
        <div className="flex items-center gap-1.5">
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <Check className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">
                Saved {formatLastSaved(lastSaved)}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-4 text-muted-foreground">
        {/* Version History Button */}
        {onOpenHistory && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenHistory}
                className="h-5 px-1.5 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <History className="h-3 w-3" />
                <span>History</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View version history</p>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="h-3 w-px bg-border" />

        <div className="flex items-center gap-3">
          <span>Ln {line}</span>
          <span>Col {column}</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <span>~{tokenCount} tokens</span>
      </div>
    </div>
  );
}
