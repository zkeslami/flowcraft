"use client"

import { Play, Square, Bug, RotateCcw, StepForward, Pause, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

interface CanvasToolbarProps {
  isRunning: boolean
  isPaused?: boolean
  onRun: () => void
  onStop: () => void
  onPause?: () => void
  onStepForward?: () => void
  onReset?: () => void
  onTest?: () => void
  hasSelectedNode?: boolean
}

export function CanvasToolbar({
  isRunning,
  isPaused = false,
  onRun,
  onStop,
  onPause,
  onStepForward,
  onReset,
  onTest,
  hasSelectedNode = false,
}: CanvasToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 rounded-xl border border-border bg-card/95 backdrop-blur-sm px-2 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.5),0_4px_15px_rgba(0,0,0,0.3)]">
          {/* Play/Pause controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRun}
                disabled={isRunning && !isPaused}
                className={cn("h-9 w-9 p-0", !isRunning && "text-primary hover:text-primary hover:bg-primary/10")}
              >
                <Play className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Run Workflow</p>
            </TooltipContent>
          </Tooltip>

          {onPause && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onPause} disabled={!isRunning} className="h-9 w-9 p-0">
                  <Pause className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Pause</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onStop}
                disabled={!isRunning}
                className={cn(
                  "h-9 w-9 p-0",
                  isRunning && "text-destructive hover:text-destructive hover:bg-destructive/10",
                )}
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Stop</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Step controls */}
          {onStepForward && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onStepForward} disabled={!isPaused} className="h-9 w-9 p-0">
                  <StepForward className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Step Forward</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onReset && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onReset} className="h-9 w-9 p-0">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Reset</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Test/Debug controls */}
          {onTest && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={onTest} disabled={isRunning} className="h-9 w-9 p-0">
                  <Bug className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Debug Mode</p>
              </TooltipContent>
            </Tooltip>
          )}

          {hasSelectedNode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRun}
                  disabled={isRunning}
                  className="h-9 w-9 p-0 text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Zap className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Run Selected Node</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
  )
}
