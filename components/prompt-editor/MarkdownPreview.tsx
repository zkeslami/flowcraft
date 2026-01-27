import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Variable, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownPreviewProps {
  content: string;
}

// Mock argument values - in real implementation this would come from context
const mockArgumentValues: Record<string, string> = {
  argumentName: "user_input_data",
  toolName: "search_database",
  domain: "software engineering",
  username: "john_doe",
  query: "SELECT * FROM users",
};

interface ArgumentDisplayProps {
  name: string;
  showValues: boolean;
}

function ArgumentDisplay({ name, showValues }: ArgumentDisplayProps) {
  const value = mockArgumentValues[name] || "undefined";

  if (showValues) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-chart-3/15 border border-chart-3/30 text-sm font-mono mx-0.5 align-middle">
        <Variable className="h-3 w-3 text-chart-3 flex-shrink-0" />
        <span className="text-chart-3">{value}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 border border-primary/30 text-primary text-xs font-mono font-medium mx-0.5 align-middle cursor-default">
      <Variable className="h-3 w-3 flex-shrink-0" />
      <span>{name}</span>
    </span>
  );
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const [showValues, setShowValues] = useState(false);

  // Parse content and replace @references with components
  const processedContent = useMemo(() => {
    const parts: Array<{ type: "text" | "argument"; content: string }> = [];
    const regex = /@(\w+)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
      }
      parts.push({ type: "argument", content: match[1] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: "text", content: content.slice(lastIndex) });
    }

    return parts;
  }, [content]);

  return (
    <div className="h-full flex flex-col">
      {/* Toggle Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-accent/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span>Preview</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
              !showValues ? "bg-primary/15 text-primary" : "text-muted-foreground"
            )}
          >
            <Variable className="h-3 w-3" />
            Variables
          </div>
          <Switch
            id="show-values"
            checked={showValues}
            onCheckedChange={setShowValues}
            className="data-[state=checked]:bg-chart-3"
          />
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
              showValues ? "bg-chart-3/15 text-chart-3" : "text-muted-foreground"
            )}
          >
            Values
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-code:text-primary prose-code:bg-accent/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-accent prose-pre:border prose-pre:border-border">
          {processedContent.map((part, index) => {
            if (part.type === "argument") {
              return (
                <ArgumentDisplay
                  key={index}
                  name={part.content}
                  showValues={showValues}
                />
              );
            }
            return (
              <ReactMarkdown key={index} remarkPlugins={[remarkGfm]}>
                {part.content}
              </ReactMarkdown>
            );
          })}
        </div>
      </div>
    </div>
  );
}