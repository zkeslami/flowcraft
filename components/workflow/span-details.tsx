import { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Circle, Clock, Cpu, Database, RefreshCw, Maximize2, Minimize2, Plus, MoreVertical, Download, Copy, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExecutionSpan, ExecutionStatus } from '@/lib/execution-types';

interface SpanDetailsProps {
  span: ExecutionSpan | null;
  onAddToEvaluation?: (spanId: string) => void;
  showFullscreenToggle?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const statusConfig: Record<ExecutionStatus, { icon: typeof CheckCircle2; label: string; className: string }> = {
  pending: { icon: Circle, label: 'Pending', className: 'bg-orange-500/10 text-orange-400 border-orange-500' },
  running: { icon: Loader2, label: 'Running', className: 'bg-blue-500/10 text-blue-400 border-blue-500' },
  success: { icon: CheckCircle2, label: 'Success', className: 'bg-green-500/10 text-green-400 border-green-500' },
  error: { icon: XCircle, label: 'Failed', className: 'bg-red-500/10 text-red-400 border-red-500' },
};

const formatDuration = (ms?: number) => {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour12: false });
};

const JsonViewer = ({ data, label }: { data: unknown; label: string }) => {
  if (!data) {
    return (
      <div className="rounded-md border border-zinc-800 bg-[#0f1114] p-4 text-center text-sm text-zinc-500">
        No {label.toLowerCase()} data available
      </div>
    );
  }
  return (
    <pre className="rounded-md border border-zinc-800 bg-[#0f1114] p-4 text-sm overflow-auto text-white">
      <code>{JSON.stringify(data, null, 2)}</code>
    </pre>
  );
};

export const SpanDetails = ({
  span,
  onAddToEvaluation,
  showFullscreenToggle,
  isFullscreen,
  onToggleFullscreen
}: SpanDetailsProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!span) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Select a span to view details
      </div>
    );
  }

  const config = statusConfig[span.status];
  const StatusIcon = config.icon;

  return (
    <div className="flex h-full flex-col bg-[#0a0a0b]">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-[#0a0a0b] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">{span.nodeName}</h3>
            <p className="text-sm text-zinc-400 capitalize">{span.nodeType}</p>
          </div>
          <div className="flex items-center gap-2">
            {showFullscreenToggle && onToggleFullscreen && (
              <Button variant="ghost" size="icon" onClick={onToggleFullscreen} className="h-8 w-8 text-zinc-400 hover:text-white">
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}
            <Badge variant="outline" className={cn('gap-1.5', config.className)}>
              <StatusIcon className="h-3.5 w-3.5" />
              {config.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-white"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0f1114] border-zinc-800">
                <DropdownMenuItem
                  onClick={() => onAddToEvaluation?.(span.id)}
                  className="text-white hover:bg-[#1a1a1f] cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Eval Set
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-[#1a1a1f] cursor-pointer">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save to Memory
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="text-white hover:bg-[#1a1a1f] cursor-pointer">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-[#1a1a1f] cursor-pointer">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-3 w-fit bg-[#0f1114] border border-zinc-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#1a1a1f] text-zinc-400 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="input" className="data-[state=active]:bg-[#1a1a1f] text-zinc-400 data-[state=active]:text-white">Input</TabsTrigger>
          <TabsTrigger value="output" className="data-[state=active]:bg-[#1a1a1f] text-zinc-400 data-[state=active]:text-white">Output</TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-[#1a1a1f] text-zinc-400 data-[state=active]:text-white">
            Logs
            {span.logs.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 bg-zinc-800 text-white">
                {span.logs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="metrics" className="data-[state=active]:bg-[#1a1a1f] text-zinc-400 data-[state=active]:text-white">Metrics</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 overflow-hidden">
          <TabsContent value="overview" className="h-full m-0 p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-zinc-800 bg-[#0f1114] p-3">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium">Start Time</span>
                  </div>
                  <p className="text-sm font-medium text-white">{formatTime(span.startTime)}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-[#0f1114] p-3">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium">End Time</span>
                  </div>
                  <p className="text-sm font-medium text-white">{span.endTime ? formatTime(span.endTime) : '-'}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-[#0f1114] p-3">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium">Duration</span>
                  </div>
                  <p className="text-sm font-medium text-white">{formatDuration(span.duration)}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-[#0f1114] p-3">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Database className="h-4 w-4" />
                    <span className="text-xs font-medium">Span ID</span>
                  </div>
                  <p className="text-sm font-medium font-mono text-white">{span.id}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="input" className="h-full m-0 p-4 overflow-auto">
            <JsonViewer data={span.inputs} label="Input" />
          </TabsContent>

          <TabsContent value="output" className="h-full m-0 p-4 overflow-auto">
            <JsonViewer data={span.outputs} label="Output" />
          </TabsContent>

          <TabsContent value="logs" className="h-full m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {span.logs.length === 0 ? (
                  <div className="text-center text-zinc-500 text-sm py-8">
                    No logs available
                  </div>
                ) : (
                  span.logs.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        'rounded-md border px-3 py-2 text-sm',
                        log.level === 'error' && 'border-red-500/30 bg-red-500/5',
                        log.level === 'warn' && 'border-yellow-500/30 bg-yellow-500/5',
                        log.level === 'info' && 'border-zinc-800 bg-[#0f1114]',
                        log.level === 'debug' && 'border-zinc-800 bg-[#0f1114] opacity-70'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] uppercase px-1.5',
                            log.level === 'error' && 'border-red-500 text-red-400',
                            log.level === 'warn' && 'border-yellow-500 text-yellow-400',
                            log.level === 'info' && 'border-blue-500 text-blue-400',
                            log.level === 'debug' && 'border-zinc-600 text-zinc-400'
                          )}
                        >
                          {log.level}
                        </Badge>
                        <span className="text-xs text-zinc-500">
                          {formatTime(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-white">{log.message}</p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="metrics" className="h-full m-0 p-4">
            {span.metrics ? (
              <div className="grid grid-cols-2 gap-4">
                {span.metrics.cpuTime !== undefined && (
                  <div className="rounded-lg border border-zinc-800 bg-[#0f1114] p-3">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <Cpu className="h-4 w-4" />
                      <span className="text-xs font-medium">CPU Time</span>
                    </div>
                    <p className="text-sm font-medium text-white">{span.metrics.cpuTime}ms</p>
                  </div>
                )}
                {span.metrics.memoryUsage !== undefined && (
                  <div className="rounded-lg border border-zinc-800 bg-[#0f1114] p-3">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <Database className="h-4 w-4" />
                      <span className="text-xs font-medium">Memory Usage</span>
                    </div>
                    <p className="text-sm font-medium text-white">{span.metrics.memoryUsage}MB</p>
                  </div>
                )}
                {span.metrics.retryCount !== undefined && (
                  <div className="rounded-lg border border-zinc-800 bg-[#0f1114] p-3">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <RefreshCw className="h-4 w-4" />
                      <span className="text-xs font-medium">Retry Count</span>
                    </div>
                    <p className="text-sm font-medium text-white">{span.metrics.retryCount}</p>
                  </div>
                )}
                {span.metrics.itemsProcessed !== undefined && (
                  <div className="rounded-lg border border-zinc-800 bg-[#0f1114] p-3">
                    <div className="flex items-center gap-2 text-zinc-400 mb-1">
                      <Database className="h-4 w-4" />
                      <span className="text-xs font-medium">Items Processed</span>
                    </div>
                    <p className="text-sm font-medium text-white">{span.metrics.itemsProcessed}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-zinc-500 text-sm py-8">
                No metrics available
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
