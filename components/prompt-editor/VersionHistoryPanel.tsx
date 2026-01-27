import { useState, useEffect } from "react";
import { History, Eye, RotateCcw, Trash2, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Version } from "@/hooks/useVersionHistory";

interface VersionHistoryPanelProps {
  versions?: Version[];
  currentContent: string;
  onRevert: (content: string) => void;
  onDeleteVersion?: (versionId: string) => void;
  onClose: () => void;
  standalone?: boolean;
  storageKey?: string;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function VersionHistoryPanel({
  versions: externalVersions,
  currentContent,
  onRevert,
  onDeleteVersion: externalOnDeleteVersion,
  onClose,
  standalone = false,
  storageKey = "prompt-versions",
}: VersionHistoryPanelProps) {
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);
  const [versionToDelete, setVersionToDelete] = useState<Version | null>(null);
  const [versionToRevert, setVersionToRevert] = useState<Version | null>(null);
  const [loadedVersions, setLoadedVersions] = useState<Version[]>([]);

  useEffect(() => {
    if (standalone && storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Version[];
          setLoadedVersions(parsed);
        } catch (e) {
          console.error("Failed to parse stored versions:", e);
        }
      }
    }
  }, [standalone, storageKey]);

  const versions = standalone ? loadedVersions : (externalVersions || []);

  const handleDeleteVersion = (versionId: string) => {
    if (standalone) {
      const updated = versions.filter((v) => v.id !== versionId);
      setLoadedVersions(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } else if (externalOnDeleteVersion) {
      externalOnDeleteVersion(versionId);
    }
    setVersionToDelete(null);
  };

  const handleRevert = (version: Version) => {
    onRevert(version.content);
    setVersionToRevert(null);
    onClose();
  };

  return (
    <>
      <div className={cn(
        "flex flex-col h-full bg-[#0a0a0b]",
        !standalone && "border-l border-border w-80"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Version History</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Version List */}
        <ScrollArea className="flex-1">
          <div className="p-2 w-full min-w-0 overflow-x-hidden">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No saved versions yet</p>
                <p className="text-xs mt-1">Changes are auto-saved as you type</p>
              </div>
            ) : (
              <div className="space-y-1 w-full min-w-0">
                {versions.map((version, index) => {
                  const isCurrentVersion = version.content === currentContent;
                  const previewLength = 60;
                  const preview = version.content.length > previewLength
                    ? version.content.substring(0, previewLength).replace(/\n/g, " ") + "..."
                    : version.content.replace(/\n/g, " ");

                  return (
                    <div
                      key={version.id}
                      className={cn(
                        "group w-full min-w-0 p-2 rounded-md border border-transparent transition-colors cursor-pointer overflow-hidden",
                        "hover:bg-accent/50 hover:border-border",
                        isCurrentVersion && "bg-primary/10 border-primary/30"
                      )}
                      onClick={() => setPreviewVersion(version)}
                    >
                      {/* Header row with time and badges */}
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                          {formatRelativeTime(version.timestamp)}
                        </span>
                        {index === 0 && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary font-medium shrink-0">
                            Latest
                          </span>
                        )}
                        {isCurrentVersion && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/20 text-green-400 font-medium shrink-0">
                            Current
                          </span>
                        )}
                      </div>

                      {/* Preview text */}
                      <p className="text-[11px] text-muted-foreground/80 mt-1 font-mono truncate max-w-full min-w-0">
                        {preview || "(empty)"}
                      </p>

                      {/* Hover Actions */}
                      <div className="flex items-center gap-1 mt-2 flex-wrap opacity-0 group-hover:opacity-100 transition-opacity min-w-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewVersion(version);
                          }}
                          className="h-6 px-2 text-[10px] gap-1 shrink-0"
                        >
                          <Eye className="h-3 w-3" />
                          Preview
                        </Button>
                        {!isCurrentVersion && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVersionToRevert(version);
                            }}
                            className="h-6 px-2 text-[10px] gap-1 shrink-0"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Use
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVersionToDelete(version);
                          }}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive ml-auto shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          {versions.length} version{versions.length !== 1 ? "s" : ""} saved
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Version Preview
              {previewVersion && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  {formatDateTime(previewVersion.timestamp)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <pre className="p-4 bg-accent/30 rounded-md text-sm font-mono whitespace-pre-wrap">
              {previewVersion?.content || "(empty)"}
            </pre>
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPreviewVersion(null)}>
              Close
            </Button>
            {previewVersion && previewVersion.content !== currentContent && (
              <Button onClick={() => {
                handleRevert(previewVersion);
                setPreviewVersion(null);
              }}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Revert to this version
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!versionToDelete} onOpenChange={() => setVersionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this version? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (versionToDelete) {
                  handleDeleteVersion(versionToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revert Confirmation */}
      <AlertDialog open={!!versionToRevert} onOpenChange={() => setVersionToRevert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert to Version</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current content with this saved version. Your current changes will be saved as a new version before reverting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (versionToRevert) {
                  handleRevert(versionToRevert);
                }
              }}
            >
              Revert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
