import { Variable } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ArgumentPillProps {
  name: string;
  value?: string;
  showValue?: boolean;
}

export function ArgumentPill({ name, value, showValue = false }: ArgumentPillProps) {
  const displayValue = showValue && value;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {displayValue ? (
            // Show value mode - inline value with variable indicator
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-chart-3/15 border border-chart-3/30 text-sm font-mono mx-0.5">
              <Variable className="h-3 w-3 text-chart-3 flex-shrink-0" />
              <span className="text-chart-3">{value}</span>
            </span>
          ) : (
            // Show variable name mode - pill style
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 border border-primary/30 text-primary text-xs font-mono font-medium mx-0.5 cursor-default">
              <Variable className="h-3 w-3 flex-shrink-0" />
              <span>{name}</span>
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Variable</span>
              <span className="font-mono text-xs font-medium">{name}</span>
            </div>
            {value && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Value</span>
                <span className="font-mono text-xs">{value}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}