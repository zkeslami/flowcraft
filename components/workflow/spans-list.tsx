import { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Circle, List, BarChart3, Filter, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExecutionSpan, ExecutionStatus } from '@/lib/execution-types';

interface SpansListProps {
  spans: ExecutionSpan[];
  selectedSpanId?: string;
  onSelectSpan: (spanId: string) => void;
  viewMode: 'list' | 'timeline';
  onViewModeChange: (mode: 'list' | 'timeline') => void;
}

const statusConfig: Record<ExecutionStatus, { icon: typeof CheckCircle2; className: string }> = {
  pending: { icon: Circle, className: 'text-orange-400' },
  running: { icon: Loader2, className: 'text-blue-400' },
  success: { icon: CheckCircle2, className: 'text-green-400' },
  error: { icon: XCircle, className: 'text-red-400' },
};

const formatDuration = (ms?: number) => {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

interface SpanItemProps {
  span: ExecutionSpan;
  selectedSpanId?: string;
  onSelectSpan: (spanId: string) => void;
  depth?: number;
  expandedSpans: Set<string>;
  onToggleExpand: (spanId: string) => void;
}

const SpanItem = ({ span, selectedSpanId, onSelectSpan, depth = 0, expandedSpans, onToggleExpand }: SpanItemProps) => {
  const config = statusConfig[span.status];
  const StatusIcon = config.icon;
  const hasChildren = span.children && span.children.length > 0;
  const isExpanded = expandedSpans.has(span.id);

  return (
    <>
      <button
        onClick={() => onSelectSpan(span.id)}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#0f1114]',
          selectedSpanId === span.id && 'bg-[#1a1a1f]'
        )}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(span.id);
            }}
            className="flex-shrink-0 p-0.5 hover:bg-[#0f1114] rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <StatusIcon className={cn('h-4 w-4 flex-shrink-0', config.className)} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-white truncate">{span.nodeName}</p>
          <p className="text-xs text-zinc-500">{span.nodeType}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-white">{formatDuration(span.duration)}</p>
          <p className="text-xs text-zinc-500">{formatTime(span.startTime)}</p>
        </div>
      </button>
      {hasChildren && isExpanded && span.children!.map((child) => (
        <SpanItem
          key={child.id}
          span={child}
          selectedSpanId={selectedSpanId}
          onSelectSpan={onSelectSpan}
          depth={depth + 1}
          expandedSpans={expandedSpans}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </>
  );
};

export const SpansList = ({
  spans,
  selectedSpanId,
  onSelectSpan,
  viewMode,
  onViewModeChange,
}: SpansListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'all'>('all');
  const [expandedSpans, setExpandedSpans] = useState<Set<string>>(new Set(['span-2', 'span-3']));

  const matchesFilter = (span: ExecutionSpan): boolean => {
    const matchesSearch = span.nodeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || span.status === statusFilter;
    return matchesSearch && matchesStatus;
  };

  const filterSpans = (spans: ExecutionSpan[]): ExecutionSpan[] => {
    return spans.filter(matchesFilter).map(span => ({
      ...span,
      children: span.children ? filterSpans(span.children) : undefined,
    }));
  };

  const filteredSpans = filterSpans(spans);

  const handleToggleExpand = (spanId: string) => {
    setExpandedSpans(prev => {
      const next = new Set(prev);
      if (next.has(spanId)) {
        next.delete(spanId);
      } else {
        next.add(spanId);
      }
      return next;
    });
  };

  // Calculate timeline metrics (flatten all spans including children)
  const flattenSpans = (spans: ExecutionSpan[]): ExecutionSpan[] => {
    return spans.flatMap(span => [span, ...(span.children ? flattenSpans(span.children) : [])]);
  };

  const allSpans = flattenSpans(spans);
  const minTime = allSpans.length > 0 ? Math.min(...allSpans.map((s) => s.startTime.getTime())) : Date.now();
  const maxTime = allSpans.length > 0 ? Math.max(...allSpans.map((s) => (s.endTime?.getTime() || s.startTime.getTime()))) : Date.now();
  const totalDuration = maxTime - minTime;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-[#0a0a0b] px-3 py-2">
        <Input
          placeholder="Search spans..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 w-48 bg-[#0f1114] border-zinc-800 text-white placeholder:text-zinc-500"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2 border-zinc-800 bg-[#0f1114] hover:bg-[#1a1a1f] text-white">
              <Filter className="h-3.5 w-3.5" />
              {statusFilter === 'all' ? 'All Status' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#0f1114] border-zinc-800">
            <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-white hover:bg-[#1a1a1f]">All Status</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('success')} className="text-white hover:bg-[#1a1a1f]">Success</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('error')} className="text-white hover:bg-[#1a1a1f]">Failed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('running')} className="text-white hover:bg-[#1a1a1f]">Running</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('pending')} className="text-white hover:bg-[#1a1a1f]">Pending</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        <div className="flex items-center rounded-md border border-zinc-800 bg-[#0f1114] p-0.5">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(
              'h-7 w-7 p-0',
              viewMode === 'list' ? 'bg-[#1a1a1f] text-white' : 'text-zinc-400 hover:text-white hover:bg-transparent'
            )}
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(
              'h-7 w-7 p-0',
              viewMode === 'timeline' ? 'bg-[#1a1a1f] text-white' : 'text-zinc-400 hover:text-white hover:bg-transparent'
            )}
            onClick={() => onViewModeChange('timeline')}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'list' ? (
          <div className="divide-y divide-zinc-800">
            {filteredSpans.map((span) => (
              <SpanItem
                key={span.id}
                span={span}
                selectedSpanId={selectedSpanId}
                onSelectSpan={onSelectSpan}
                expandedSpans={expandedSpans}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </div>
        ) : (
          <div className="p-3 space-y-1">
            {flattenSpans(filteredSpans).map((span) => {
              const startOffset = totalDuration > 0 ? ((span.startTime.getTime() - minTime) / totalDuration) * 100 : 0;
              const width = totalDuration > 0 ? ((span.duration || 0) / totalDuration) * 100 : 0;

              return (
                <button
                  key={span.id}
                  onClick={() => onSelectSpan(span.id)}
                  className={cn(
                    'w-full rounded-md p-2 text-left transition-colors hover:bg-[#0f1114]',
                    selectedSpanId === span.id && 'bg-[#1a1a1f]'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate text-white">{span.nodeName}</span>
                    <span className="text-xs text-zinc-500">{formatDuration(span.duration)}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-[#0f1114] overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        span.status === 'success' && 'bg-green-500',
                        span.status === 'error' && 'bg-red-500',
                        span.status === 'running' && 'bg-blue-500',
                        span.status === 'pending' && 'bg-orange-500'
                      )}
                      style={{
                        marginLeft: `${startOffset}%`,
                        width: `${Math.max(width, 2)}%`,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
