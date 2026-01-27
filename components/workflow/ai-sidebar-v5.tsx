"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  MessageSquare,
  FolderTree,
  LayoutGrid,
  X,
  Send,
  Loader2,
  Zap,
  Code,
  GitBranch,
  Play,
  ChevronRight,
  ChevronDown,
  FileCode,
  Workflow,
  Plus,
  Search,
  GitMerge,
  User,
  Settings,
  LogOut,
  Compass,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { WorkflowNode, Connection } from "@/lib/workflow-types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RunHistoryPanel } from "./run-history-panel"

type SidebarTab = "chat" | "explorer" | "catalog" | "sourceControl" | "evaluations" | "runs"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface CatalogItem {
  id: string
  type: WorkflowNode["type"]
  label: string
  description: string
  icon: React.ReactNode
}

const catalogItems: CatalogItem[] = [
  {
    id: "trigger-http",
    type: "trigger",
    label: "HTTP Trigger",
    description: "Trigger workflow via HTTP webhook",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: "trigger-schedule",
    type: "trigger",
    label: "Schedule Trigger",
    description: "Trigger workflow on a schedule",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: "function-transform",
    type: "function",
    label: "Transform Data",
    description: "Transform and map data fields",
    icon: <Code className="h-4 w-4" />,
  },
  {
    id: "function-filter",
    type: "function",
    label: "Filter Data",
    description: "Filter records based on conditions",
    icon: <Code className="h-4 w-4" />,
  },
  {
    id: "condition-branch",
    type: "condition",
    label: "Conditional Branch",
    description: "Branch based on conditions",
    icon: <GitBranch className="h-4 w-4" />,
  },
  {
    id: "action-email",
    type: "action",
    label: "Send Email",
    description: "Send email notifications",
    icon: <Play className="h-4 w-4" />,
  },
  {
    id: "action-database",
    type: "action",
    label: "Database Query",
    description: "Execute database operations",
    icon: <Play className="h-4 w-4" />,
  },
  {
    id: "action-api",
    type: "action",
    label: "API Request",
    description: "Make HTTP API calls",
    icon: <Play className="h-4 w-4" />,
  },
]

interface AISidebarV5Props {
  nodes: WorkflowNode[]
  connections: Connection[]
  selectedNode: WorkflowNode | null
  onNodeSelect: (node: WorkflowNode | null) => void
  onAddNode: (type: WorkflowNode["type"], label: string) => void
  onConnectNodes: (fromId: string, toId: string) => void
  onUpdateNodeCode: (nodeId: string, code: string) => void
  onBack?: () => void
  theme?: "dark" | "light"
  onTabChange?: (tab: SidebarTab) => void
  executionHistory?: Array<{
    id: string
    flowId: string
    status: 'pending' | 'running' | 'success' | 'error'
    startTime: Date
    duration?: number
    triggeredBy: string
    stepsCount?: number
  }>
  selectedRunId?: string
  onSelectRun?: (runId: string) => void
  onRerun?: (runId: string) => void
  onCompare?: (runId: string) => void
  onPlayback?: (runId: string) => void
}

export function AISidebarV5({
  nodes,
  connections,
  selectedNode,
  onNodeSelect,
  onAddNode,
  onConnectNodes,
  onUpdateNodeCode,
  onBack,
  theme = "dark",
  onTabChange,
  executionHistory = [],
  selectedRunId,
  onSelectRun,
  onRerun,
  onCompare,
  onPlayback,
}: AISidebarV5Props) {
  const isLight = theme === "light"
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<SidebarTab>("chat")
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI workflow assistant. I can help you build and modify your workflow. Try asking me to:\n\n- Add a new node\n- Connect two nodes\n- Update node code\n- Explain the current workflow",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    triggers: true,
    functions: true,
    conditions: true,
    actions: true,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleIconClick = useCallback((tab: SidebarTab) => {
    setActiveTab(tab)
    setIsExpanded(true)
    onTabChange?.(tab)
  }, [onTabChange])

  const handleClosePanel = useCallback(() => {
    setIsExpanded(false)
  }, [])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX - 56
      setSidebarWidth(Math.max(240, Math.min(600, newWidth)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  const simulateAIResponse = useCallback(
    async (userMessage: string) => {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

      let response = ""
      const lowerMessage = userMessage.toLowerCase()

      if (lowerMessage.includes("add") && lowerMessage.includes("node")) {
        if (lowerMessage.includes("trigger")) {
          onAddNode("trigger", "New Trigger")
          response =
            "I've added a new Trigger node to your workflow. You can find it on the canvas and configure its properties."
        } else if (lowerMessage.includes("function") || lowerMessage.includes("transform")) {
          onAddNode("function", "New Function")
          response = "I've added a new Function node. Click on it to write your transformation logic."
        } else if (lowerMessage.includes("condition") || lowerMessage.includes("branch")) {
          onAddNode("condition", "New Condition")
          response = "I've added a Condition node for branching logic. Set up your conditions in the code editor."
        } else if (lowerMessage.includes("action")) {
          onAddNode("action", "New Action")
          response = "I've added an Action node. Configure it to perform your desired operation."
        } else {
          onAddNode("function", "New Node")
          response = "I've added a new node to your workflow. What type of logic should it contain?"
        }
      } else if (lowerMessage.includes("connect")) {
        const mentionedNodes = nodes.filter(
          (n) => lowerMessage.includes(n.label.toLowerCase()) || lowerMessage.includes(n.id),
        )
        if (mentionedNodes.length >= 2) {
          onConnectNodes(mentionedNodes[0].id, mentionedNodes[1].id)
          response = `I've connected "${mentionedNodes[0].label}" to "${mentionedNodes[1].label}".`
        } else {
          response = `To connect nodes, please specify which two nodes you'd like to connect. Your current nodes are: ${nodes.map((n) => n.label).join(", ")}`
        }
      } else if (lowerMessage.includes("explain") || lowerMessage.includes("describe")) {
        response = `Your workflow "${nodes.length > 0 ? "User Onboarding Flow" : "Empty Workflow"}" has ${nodes.length} nodes and ${connections.length} connections.\n\n`
        if (nodes.length > 0) {
          response += "Flow structure:\n"
          nodes.forEach((node, i) => {
            const outgoing = connections.filter((c) => c.from === node.id)
            response += `${i + 1}. ${node.label} (${node.type})${outgoing.length > 0 ? ` → connects to ${outgoing.length} node(s)` : ""}\n`
          })
        }
      } else if (
        selectedNode &&
        (lowerMessage.includes("update") || lowerMessage.includes("modify") || lowerMessage.includes("change"))
      ) {
        response = `I can help you update "${selectedNode.label}". What changes would you like to make to its code or configuration?`
      } else {
        response = `I understand you want to "${userMessage}". Here's what I can help with:\n\n- **Add nodes**: "Add a trigger node", "Add a function node"\n- **Connect nodes**: "Connect HTTP Trigger to Transform Data"\n- **Explain workflow**: "Explain the current workflow"\n- **Update nodes**: Select a node and ask me to update it\n\nWhat would you like to do?`
      }

      setIsLoading(false)
      return response
    },
    [nodes, connections, selectedNode, onAddNode, onConnectNodes],
  )

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    const response = await simulateAIResponse(userMessage.content)

    const assistantMessage: Message = {
      id: `assistant_${Date.now()}`,
      role: "assistant",
      content: response,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, assistantMessage])
  }, [inputValue, isLoading, simulateAIResponse])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage],
  )

  const toggleFolder = useCallback((folder: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }))
  }, [])

  const filteredCatalog = catalogItems.filter(
    (item) =>
      item.label.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(catalogSearch.toLowerCase()),
  )

  const groupedNodes = {
    triggers: nodes.filter((n) => n.type === "trigger"),
    functions: nodes.filter((n) => n.type === "function"),
    conditions: nodes.filter((n) => n.type === "condition"),
    actions: nodes.filter((n) => n.type === "action"),
  }

  const tabIcons = {
    chat: <MessageSquare className="h-5 w-5" />,
    explorer: <FolderTree className="h-5 w-5" />,
    catalog: <LayoutGrid className="h-5 w-5" />,
    sourceControl: <GitMerge className="h-5 w-5" />,
    evaluations: <Compass className="h-5 w-5" />,
    runs: <History className="h-5 w-5" />,
  }

const tabLabels = {
  chat: "Autopilot",
  explorer: "Explorer",
  catalog: "Catalog",
  sourceControl: "Source Control",
  evaluations: "Evaluations",
  runs: "Runs",
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={sidebarRef}
        className={cn(
          "relative z-20 flex h-full border-r border-border bg-card transition-all",
          isLight ? "shadow-[4px_0_20px_rgba(0,0,0,0.08)]" : "shadow-[4px_0_20px_rgba(0,0,0,0.3)]",
          isResizing ? "transition-none" : "duration-300",
        )}
        style={{ width: isExpanded ? sidebarWidth + 56 : 56 }}
      >
        {/* Collapsed icons with logo at top and profile at bottom */}
        <div className={cn(
          "flex w-14 flex-col items-center bg-secondary/40",
          !isExpanded && "border-r border-border"
        )}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onBack}
                className="flex h-14 w-full items-center justify-center border-b border-border hover:bg-muted transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5 text-primary-foreground"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
              </button>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right">
                <p className="font-semibold">Flow</p>
                <p className="text-xs text-muted-foreground">Back to Launcher</p>
              </TooltipContent>
            )}
          </Tooltip>

          {/* Tab icons */}
          <div className="flex flex-1 flex-col items-center py-3 gap-1">
            {(["chat", "explorer", "catalog", "sourceControl", "evaluations", "runs"] as SidebarTab[]).map((tab) => (
              <Tooltip key={tab}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleIconClick(tab)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      activeTab === tab && isExpanded
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {tabIcons[tab]}
                  </button>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right">
                    <p>{tabLabels[tab]}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>

          <div className="border-border py-3 border-t-0">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors mx-auto">
                      <User className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right">
                    <p>Profile</p>
                  </TooltipContent>
                )}
              </Tooltip>
              <DropdownMenuContent side="right" align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-muted-foreground">john@example.com</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Expanded content */}
        <div
          className={cn(
            "flex flex-1 flex-col overflow-hidden transition-opacity duration-200 bg-secondary/40",
            isExpanded ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          style={{ width: sidebarWidth }}
        >
          <div className="flex h-14 items-center justify-between border-border px-4 border-b-0">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="font-semibold text-foreground hover:text-primary transition-colors">
                Flow
              </button>
              <span className="text-muted-foreground text-sm">/ {tabLabels[activeTab]}</span>
            </div>
            <button
              onClick={handleClosePanel}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "chat" && (
              <div className="flex h-full flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col justify-end">
                  {messages.map((message, index) => {
                    const isFirstMessage = index === 0
                    const isLastAssistantMessage = message.role === "assistant" && 
                      messages.slice(index + 1).every(m => m.role !== "assistant")
                    const showFeedback = isFirstMessage || isLastAssistantMessage
                    
                    return (
                      <div
                        key={message.id}
                        className={cn("flex flex-col gap-1", message.role === "user" ? "items-end" : "items-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[90%] rounded-2xl px-4 py-4 font-sans text-sm",
                            message.role === "user" 
                              ? "bg-primary text-primary-foreground" 
                              : isFirstMessage 
                                ? "text-foreground" 
                                : "bg-muted text-foreground",
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {/* Feedback controls */}
                          {showFeedback && message.role === "assistant" && (
                            <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/50">
                              <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                </svg>
                              </button>
                              <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                                </svg>
                              </button>
                              <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                              </button>
                              <button className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 4v6h6M23 20v-6h-6" />
                                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        {!isFirstMessage && (
                          <span className="text-[10px] text-muted-foreground">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {isLoading && (
                    <div className="flex items-start gap-2">
                      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input with subtle hover/focus highlight */}
                <div className={cn(
                  "mx-3 mb-6 rounded-[28px] border p-4 transition-all duration-200",
                  isLight 
                    ? "border-border bg-white hover:border-white/30 focus-within:border-white/40 focus-within:bg-black/5" 
                    : "border-[#3a3a3f] bg-[#0a0b0e] hover:border-white/20 hover:bg-black focus-within:border-white/30 focus-within:bg-black"
                )}>
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me to help build your Flow"
                    className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[24px] max-h-[120px]"
                    rows={1}
                    disabled={isLoading}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors",
                          isLight ? "bg-muted" : "bg-[#2a2a2e]"
                        )}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors",
                          isLight ? "bg-muted" : "bg-[#2a2a2e]"
                        )}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                        inputValue.trim() && !isLoading
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : isLight ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-[#2a2a2e] text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "explorer" && (
              <div className="h-full overflow-y-auto p-3">
                <div className="space-y-2">
                  {/* Wireframe placeholder boxes */}
                  <div className="h-8 rounded-md bg-muted/50" />
                  <div className="ml-4 space-y-1.5">
                    <div className="h-6 rounded bg-muted/40" />
                    <div className="h-6 rounded bg-muted/40" />
                  </div>
                  <div className="h-8 rounded-md bg-muted/50" />
                  <div className="ml-4 space-y-1.5">
                    <div className="h-6 rounded bg-muted/40" />
                    <div className="h-6 rounded bg-muted/40" />
                    <div className="h-6 rounded bg-muted/40" />
                  </div>
                  <div className="h-8 rounded-md bg-muted/50" />
                  <div className="ml-4 space-y-1.5">
                    <div className="h-6 rounded bg-muted/40" />
                  </div>
                  <div className="h-8 rounded-md bg-muted/50" />
                  <div className="ml-4 space-y-1.5">
                    <div className="h-6 rounded bg-muted/40" />
                    <div className="h-6 rounded bg-muted/40" />
                  </div>
                </div>
                <div className="mt-4 border-t border-border pt-4">
                  <div className="h-5 w-32 rounded bg-muted/40" />
                </div>
              </div>
            )}

            {activeTab === "catalog" && (
              <div className="h-full overflow-y-auto">
                <div className="p-3">
                  {/* Search wireframe */}
                  <div className="h-9 rounded-md bg-muted/50" />
                </div>

                <div className="px-3 pb-3 space-y-2">
                  {/* Catalog item wireframes */}
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3"
                    >
                      <div className="h-8 w-8 rounded-md bg-muted/50 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-24 rounded bg-muted/50" />
                        <div className="h-3 w-full rounded bg-muted/40" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "sourceControl" && (
              <div className="h-full overflow-y-auto p-3">
                <div className="space-y-4">
                  {/* Staged Changes wireframe */}
                  <div>
                    <div className="h-4 w-28 rounded bg-muted/40 mb-2" />
                    <div className="space-y-1">
                      <div className="h-8 rounded-md bg-muted/50" />
                    </div>
                  </div>

                  {/* Commit Input wireframe */}
                  <div className="space-y-2">
                    <div className="h-9 rounded-md bg-muted/50" />
                    <div className="h-8 rounded-md bg-muted/50" />
                  </div>

                  {/* Recent Commits wireframe */}
                  <div>
                    <div className="h-4 w-28 rounded bg-muted/40 mb-2" />
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-2 rounded-md px-2 py-1.5">
                          <div className="h-4 w-14 rounded bg-muted/50 shrink-0" />
                          <div className="flex-1 space-y-1">
                            <div className="h-4 w-full rounded bg-muted/40" />
                            <div className="h-3 w-12 rounded bg-muted/30" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "evaluations" && (
              <div className="flex h-full items-center justify-center p-6">
                <div className="text-center text-muted-foreground">
                  <Compass className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Evaluations</p>
                  <p className="text-xs mt-1 opacity-70">Coming soon</p>
                </div>
              </div>
            )}

            {activeTab === "runs" && (
              <RunHistoryPanel
                history={executionHistory}
                selectedRunId={selectedRunId}
                onSelectRun={onSelectRun || (() => {})}
                onRerun={onRerun}
                onCompare={onCompare}
                onPlayback={onPlayback}
              />
            )}
          </div>

          
        </div>

        {/* Resize handle */}
        {isExpanded && (
          <div
            onMouseDown={handleResizeStart}
            className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 transition-colors group"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-1 h-6 bg-primary/30 rounded-full" />
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
