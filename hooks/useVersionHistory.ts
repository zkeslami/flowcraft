import { useState, useEffect, useCallback, useRef } from "react";

export interface Version {
  id: string;
  content: string;
  timestamp: number;
  label?: string;
}

interface UseVersionHistoryOptions {
  storageKey: string;
  maxVersions?: number;
  autoSaveDelay?: number;
}

export function useVersionHistory(
  content: string,
  options: UseVersionHistoryOptions
) {
  const { storageKey, maxVersions = 50, autoSaveDelay = 2000 } = options;
  
  const [versions, setVersions] = useState<Version[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>(content);

  // Load versions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Version[];
        setVersions(parsed);
        if (parsed.length > 0) {
          setLastSaved(new Date(parsed[0].timestamp));
        }
      } catch (e) {
        console.error("Failed to parse stored versions:", e);
      }
    }
  }, [storageKey]);

  // Save versions to localStorage
  const persistVersions = useCallback((newVersions: Version[]) => {
    localStorage.setItem(storageKey, JSON.stringify(newVersions));
  }, [storageKey]);

  // Create a new version
  const saveVersion = useCallback((contentToSave: string, label?: string) => {
    const newVersion: Version = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: contentToSave,
      timestamp: Date.now(),
      label,
    };

    setVersions((prev) => {
      // Don't save if content is identical to the last version
      if (prev.length > 0 && prev[0].content === contentToSave) {
        return prev;
      }

      const updated = [newVersion, ...prev].slice(0, maxVersions);
      persistVersions(updated);
      return updated;
    });

    setLastSaved(new Date());
    setIsSaving(false);
    lastContentRef.current = contentToSave;
  }, [maxVersions, persistVersions]);

  // Auto-save with debounce
  useEffect(() => {
    // Don't save if content hasn't changed
    if (content === lastContentRef.current) {
      return;
    }

    // Don't save empty content
    if (!content.trim()) {
      return;
    }

    setIsSaving(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveVersion(content);
    }, autoSaveDelay);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, autoSaveDelay, saveVersion]);

  // Manual save
  const save = useCallback((label?: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveVersion(content, label);
  }, [content, saveVersion]);

  // Delete a version
  const deleteVersion = useCallback((versionId: string) => {
    setVersions((prev) => {
      const updated = prev.filter((v) => v.id !== versionId);
      persistVersions(updated);
      return updated;
    });
  }, [persistVersions]);

  // Clear all versions
  const clearHistory = useCallback(() => {
    setVersions([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    versions,
    lastSaved,
    isSaving,
    save,
    deleteVersion,
    clearHistory,
  };
}
