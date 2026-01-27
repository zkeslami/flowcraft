import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ExternalLink, X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface Instruction {
  id: string;
  text: string;
  lineStart: number;
  lineEnd: number;
  type: "directive" | "conditional" | "constraint" | "output" | "example";
  covered: boolean;
  hitCount: number;
  evaluations: string[];
}

interface CoverageOverlayProps {
  content: string;
  onExit: () => void;
}

// Generate mock coverage data based on content analysis
const generateCoverageData = (content: string): Instruction[] => {
  const lines = content.split("\n");
  const instructions: Instruction[] = [];
  
  let currentInstruction: Partial<Instruction> | null = null;
  let instructionStart = -1;

  const getInstructionType = (line: string): Instruction["type"] | null => {
    const trimmed = line.trim().toLowerCase();
    if (trimmed.startsWith("#")) return "directive";
    if (trimmed.includes("if ") || trimmed.includes("when ") || trimmed.includes("unless")) return "conditional";
    if (trimmed.includes("must") || trimmed.includes("should") || trimmed.includes("always") || trimmed.includes("never")) return "constraint";
    if (trimmed.startsWith("```") || trimmed.includes("example")) return "example";
    if (trimmed.includes("output") || trimmed.includes("respond") || trimmed.includes("return")) return "output";
    return null;
  };

  lines.forEach((line, index) => {
    const type = getInstructionType(line);
    const isEmpty = line.trim().length === 0;

    if (type && !currentInstruction) {
      instructionStart = index;
      currentInstruction = {
        id: `inst-${index}`,
        text: line,
        lineStart: index,
        type,
        covered: Math.random() > 0.35,
        hitCount: Math.floor(Math.random() * 20),
        evaluations: ["eval-1", "eval-2"].slice(0, Math.floor(Math.random() * 3)),
      };
    } else if (currentInstruction && (isEmpty || type)) {
      instructions.push({
        ...currentInstruction,
        lineEnd: index - 1,
      } as Instruction);
      
      if (type && !isEmpty) {
        instructionStart = index;
        currentInstruction = {
          id: `inst-${index}`,
          text: line,
          lineStart: index,
          type,
          covered: Math.random() > 0.35,
          hitCount: Math.floor(Math.random() * 20),
          evaluations: ["eval-1", "eval-2"].slice(0, Math.floor(Math.random() * 3)),
        };
      } else {
        currentInstruction = null;
      }
    } else if (currentInstruction && !isEmpty) {
      currentInstruction.text += "\n" + line;
    }
  });

  // Handle last instruction
  if (currentInstruction) {
    instructions.push({
      ...currentInstruction,
      lineEnd: lines.length - 1,
    } as Instruction);
  }

  return instructions;
};

const typeConfig: Record<Instruction["type"], { label: string; color: string }> = {
  directive: { label: "Directive", color: "text-chart-4" },
  conditional: { label: "Conditional", color: "text-chart-3" },
  constraint: { label: "Constraint", color: "text-chart-1" },
  output: { label: "Output", color: "text-primary" },
  example: { label: "Example", color: "text-muted-foreground" },
};

export function CoverageOverlay({ content, onExit }: CoverageOverlayProps) {
  const instructions = useMemo(() => generateCoverageData(content), [content]);
  const lines = content.split("\n");

  const coveredCount = instructions.filter((i) => i.covered).length;
  const uncoveredCount = instructions.length - coveredCount;
  const coveragePercent = instructions.length > 0
    ? Math.round((coveredCount / instructions.length) * 100)
    : 0;

  // Map line index to instruction
  const lineInstructionMap = useMemo(() => {
    const map = new Map<number, Instruction>();
    instructions.forEach((inst) => {
      for (let i = inst.lineStart; i <= inst.lineEnd; i++) {
        map.set(i, inst);
      }
    });
    return map;
  }, [instructions]);

  return (
    <div className="flex flex-col h-full">
      {/* Summary Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-accent/50 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span className="text-muted-foreground">Covered:</span>
            <span className="font-mono font-medium text-success">{coveredCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-muted-foreground">Uncovered:</span>
            <span className="font-mono font-medium text-destructive">{uncoveredCount}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="text-sm">
            <span className="font-mono font-medium">{coveragePercent}%</span>
            <span className="text-muted-foreground ml-1">coverage</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
            <Sparkles className="h-3 w-3" />
            Improve
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
            <ExternalLink className="h-3 w-3" />
            Evals
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={onExit} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content with highlighting */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers with Coverage Indicators */}
        <div className="w-14 editor-gutter border-r border-border py-4 text-right text-sm font-mono select-none flex flex-col">
          {lines.map((_, i) => {
            const instruction = lineInstructionMap.get(i);
            const isFirstLine = instruction?.lineStart === i;
            
            return (
              <div key={i} className="leading-6 h-6 flex items-center justify-end pr-2 gap-1">
                {isFirstLine && instruction && (
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      instruction.covered ? "bg-success" : "bg-destructive"
                    )}
                  />
                )}
                <span className="text-muted-foreground">{i + 1}</span>
              </div>
            );
          })}
        </div>

        {/* Highlighted Content */}
        <div className="flex-1 overflow-auto py-4 font-mono text-sm">
          {lines.map((line, lineIndex) => {
            const instruction = lineInstructionMap.get(lineIndex);
            const isEmpty = line.trim().length === 0;
            const isFirstLine = instruction?.lineStart === lineIndex;

            if (isEmpty) {
              return (
                <div key={lineIndex} className="leading-6 h-6 px-4">
                  &nbsp;
                </div>
              );
            }

            const lineContent = (
              <div
                className={cn(
                  "leading-6 px-4 transition-colors relative",
                  instruction && instruction.covered && "bg-success/10",
                  instruction && !instruction.covered && "bg-destructive/10",
                  !instruction && "hover:bg-accent/30"
                )}
              >
                {/* Coverage bar on the left */}
                {instruction && (
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-0.5",
                      instruction.covered ? "bg-success" : "bg-destructive"
                    )}
                  />
                )}
                <span className="whitespace-pre">{line}</span>
              </div>
            );

            if (instruction && isFirstLine) {
              return (
                <HoverCard key={lineIndex} openDelay={100} closeDelay={50}>
                  <HoverCardTrigger asChild>
                    <div className="cursor-pointer">{lineContent}</div>
                  </HoverCardTrigger>
                  <HoverCardContent 
                    side="right" 
                    align="start" 
                    className="w-64 p-3"
                  >
                    <div className="space-y-3">
                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {instruction.covered ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-success bg-success/15 px-2 py-1 rounded">
                            <CheckCircle2 className="h-3 w-3" />
                            Covered
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-destructive bg-destructive/15 px-2 py-1 rounded">
                            <AlertCircle className="h-3 w-3" />
                            Uncovered
                          </div>
                        )}
                        <div className={cn(
                          "text-xs font-medium px-2 py-1 rounded bg-accent",
                          typeConfig[instruction.type].color
                        )}>
                          {typeConfig[instruction.type].label}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Hit Count</span>
                          <span className="font-mono font-medium">{instruction.hitCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Lines</span>
                          <span className="font-mono font-medium">
                            {instruction.lineStart + 1}–{instruction.lineEnd + 1}
                          </span>
                        </div>
                      </div>

                      {/* Evaluations */}
                      {instruction.evaluations.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <div className="text-xs text-muted-foreground mb-1.5">Evaluations</div>
                          <div className="flex flex-wrap gap-1">
                            {instruction.evaluations.map((evalId) => (
                              <span
                                key={evalId}
                                className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono"
                              >
                                {evalId}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            }

            return <div key={lineIndex}>{lineContent}</div>;
          })}
        </div>
      </div>
    </div>
  );
}