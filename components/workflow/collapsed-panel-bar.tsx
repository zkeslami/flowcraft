"use client"

import type React from "react"

import { useState } from "react"
import { GitBranch, Zap, Code, GitFork, Play, Settings, Variable } from "lucide-react"
import { cn } from "@/lib/utils"

type TopLevelTab = "properties" | "variables"

interface CollapsedPanelBarProps {
  title: string
  subtitle: string
  nodeType?: "trigger" | "function" | "condition" | "action"
  onExpand: () => void
  onClose: () => void
  showTabControl?: boolean
  activeTab?: TopLevelTab
  onTabChange?: (tab: TopLevelTab) => void
}

export function CollapsedPanelBar({
  title,
  subtitle,
  nodeType,
  onExpand,
  onClose,
  showTabControl = false,
  activeTab = "properties",
  onTabChange,
}: CollapsedPanelBarProps) {
  const [internalTab, setInternalTab] = useState<TopLevelTab>(activeTab)

  const currentTab = onTabChange ? activeTab : internalTab

  const handleTabClick = (tab: TopLevelTab) => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalTab(tab)
    }
    onExpand()
  }

  const handleBarClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on a tab button (tab buttons handle their own expand)
    if ((e.target as HTMLElement).closest("[data-tab-button]")) return
    onExpand()
  }

  const getIcon = () => {
    if (!nodeType) return <GitBranch className="h-4 w-4" />
    switch (nodeType) {
      case "trigger":
        return <Zap className="h-4 w-4" />
      case "function":
        return <Code className="h-4 w-4" />
      case "condition":
        return <GitFork className="h-4 w-4" />
      case "action":
        return <Play className="h-4 w-4" />
    }
  }

  const getIconColor = () => {
    if (!nodeType) return "bg-primary/20 text-primary"
    switch (nodeType) {
      case "trigger":
        return "bg-chart-2/20 text-chart-2"
      case "function":
        return "bg-chart-3/20 text-chart-3"
      case "condition":
        return "bg-chart-4/20 text-chart-4"
      case "action":
        return "bg-primary/20 text-primary"
    }
  }

  return (
    <div className="absolute top-4 right-4 z-10">
      <div
        className="flex h-12 w-[600px] items-center gap-3 rounded-lg border border-border bg-card/95 px-4 shadow-lg backdrop-blur-sm cursor-pointer hover:bg-card transition-colors"
        onClick={handleBarClick}
      >
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", getIconColor())}>
          {getIcon()}
        </div>

        <div className="flex flex-1 flex-col min-w-0">
          <span className="text-sm font-medium text-foreground truncate">{title}</span>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>

        {showTabControl && (
          <>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center rounded-md bg-muted p-0.5">
              <button
                data-tab-button
                onClick={() => handleTabClick("properties")}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors",
                  currentTab === "properties"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Settings className="h-3 w-3" />
                Properties
              </button>
              <button
                data-tab-button
                onClick={() => handleTabClick("variables")}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors",
                  currentTab === "variables"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Variable className="h-3 w-3" />
                Variables
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
