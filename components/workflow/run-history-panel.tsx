import { useState } from 'react';
import { format } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  RefreshCw,
  GitCompare,
  Play,
  History,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExecutionHistoryItem, ExecutionStatus } from '@/lib/execution-types';

interface RunHistoryPanelProps {
  history: ExecutionHistoryItem[];
  selectedRunId?: string;
  onSelectRun: (runId: string) => void;
  onRerun?: (runId: string) => void;
  onCompare?: (runId: string) => void;
  onPlayback?: (runId: string) => void;
}

const statusConfig: Record<ExecutionStatus, { icon: typeof CheckCircle2; className: string; label: string }> = {
  pending: { icon: Circle, className: 'text-orange-400', label: 'Pending' },
  running: { icon: Loader2, className: 'text-blue-400', label: 'Running' },
  success: { icon: CheckCircle2, className: 'text-green-400', label: 'Success' },
  error: { icon: XCircle, className: 'text-red-400', label: 'Failed' },
};

const formatDuration = (ms?: number) => {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
};

export const RunHistoryPanel = ({
  history,
  selectedRunId,
  onSelectRun,
  onRerun,
  onCompare,
  onPlayback,
}: RunHistoryPanelProps) => {
  const [hoveredRunId, setHoveredRunId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'all'>('all');

  // Filter runs by status
  const filteredHistory = statusFilter === 'all'
    ? history
    : history.filter(run => run.status === statusFilter);

  // Separate running and past runs
  const runningRuns = filteredHistory.filter(run => run.status === 'running');
  const pastRuns = filteredHistory.filter(run => run.status !== 'running');

  const RunItem = ({ run }: { run: ExecutionHistoryItem }) => {
    const config = statusConfig[run.status];
    const StatusIcon = config.icon;
    const isSelected = run.id === selectedRunId;
    const isHovered = run.id === hoveredRunId;

    return (
      <div
        className={cn(
          'relative cursor-pointer px-3 py-3 transition-colors',
          isSelected ? 'bg-[#1a1a1f]' : 'hover:bg-[#0f1114]'
        )}
        onClick={() => onSelectRun(run.id)}
        onMouseEnter={() => setHoveredRunId(run.id)}
        onMouseLeave={() => setHoveredRunId(null)}
      >
        <div className="flex items-start gap-2.5">
          <StatusIcon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', config.className)} />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              {format(run.startTime, 'MMM d, yyyy HH:mm')}
            </p>

            <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
              <span>{run.stepsCount || 6} steps</span>
              <span>•</span>
              <span>{formatDuration(run.duration)}</span>
            </div>

            <p className="mt-1 text-xs text-zinc-500 truncate">
              {run.triggeredBy}
            </p>
          </div>
        </div>

        {/* Hover actions */}
        {isHovered && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#0a0a0b]/95 backdrop-blur-sm rounded-md p-1 shadow-sm border border-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onRerun?.(run.id);
              }}
              title="Rerun"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onCompare?.(run.id);
              }}
              title="Compare"
            >
              <GitCompare className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onPlayback?.(run.id);
              }}
              title="Playback"
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col border-r border-zinc-800 bg-[#0a0a0b]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-3">
        <History className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-semibold text-white">Run History</h2>
        <span className="ml-auto text-xs text-zinc-500">{filteredHistory.length} runs</span>
      </div>

      {/* Filter Bar */}
      <div className="border-b border-zinc-800 px-3 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-full justify-start gap-2 border-zinc-800 bg-[#0f1114] hover:bg-[#1a1a1f] text-white">
              <Filter className="h-3.5 w-3.5" />
              {statusFilter === 'all' ? 'All Runs' : statusConfig[statusFilter].label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 bg-[#0f1114] border-zinc-800">
            <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-white hover:bg-[#1a1a1f]">All Runs</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('success')} className="text-white hover:bg-[#1a1a1f]">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-400" />
              Success
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('error')} className="text-white hover:bg-[#1a1a1f]">
              <XCircle className="h-3.5 w-3.5 mr-2 text-red-400" />
              Failed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('running')} className="text-white hover:bg-[#1a1a1f]">
              <Loader2 className="h-3.5 w-3.5 mr-2 text-blue-400" />
              Running
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('pending')} className="text-white hover:bg-[#1a1a1f]">
              <Circle className="h-3.5 w-3.5 mr-2 text-orange-400" />
              Pending
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Run list */}
      <ScrollArea className="flex-1">
        {/* Running Section */}
        {runningRuns.length > 0 && (
          <div>
            <div className="px-3 py-2 bg-[#0f1114] border-b border-zinc-800">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Running</p>
            </div>
            <div className="divide-y divide-zinc-800">
              {runningRuns.map((run) => (
                <RunItem key={run.id} run={run} />
              ))}
            </div>
          </div>
        )}

        {/* Past Runs Section */}
        {pastRuns.length > 0 && (
          <div>
            <div className="px-3 py-2 bg-[#0f1114] border-b border-zinc-800">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Past Runs</p>
            </div>
            <div className="divide-y divide-zinc-800">
              {pastRuns.map((run) => (
                <RunItem key={run.id} run={run} />
              ))}
            </div>
          </div>
        )}

        {filteredHistory.length === 0 && (
          <div className="flex items-center justify-center h-32 text-sm text-zinc-500">
            No runs found
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
