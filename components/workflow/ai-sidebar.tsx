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
  GripVertical,
  GitMerge,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { WorkflowNode, Connection } from "@/lib/workflow-types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type SidebarTab = "chat" | "explorer" | "catalog" | "sourceControl"

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

interface AISidebarProps {
  nodes: WorkflowNode[]
  connections: Connection[]
  selectedNode: WorkflowNode | null
  onNodeSelect: (node: WorkflowNode | null) => void
  onAddNode: (type: WorkflowNode["type"], label: string) => void
  onConnectNodes: (fromId: string, toId: string) => void
  onUpdateNodeCode: (nodeId: string, code: string) => void
}

export function AISidebar({
  nodes,
  connections,
  selectedNode,
  onNodeSelect,
  onAddNode,
  onConnectNodes,
  onUpdateNodeCode,
}: AISidebarProps) {
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
  }, [])

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

  // ... existing code for simulateAIResponse, handleSendMessage, handleKeyDown, toggleFolder ...

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
  }

  const tabLabels = {
    chat: "AI Chat",
    explorer: "Explorer",
    catalog: "Catalog",
    sourceControl: "Source Control",
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={sidebarRef}
        className={cn(
          "relative z-20 flex h-full border-r border-border bg-card transition-all",
          isResizing ? "transition-none" : "duration-300",
        )}
        style={{ width: isExpanded ? sidebarWidth + 56 : 56 }}
      >
        {/* Collapsed icons with tooltips */}
        <div className="flex w-14 flex-col items-center border-r border-border py-3 gap-1">
          {(["chat", "explorer", "catalog", "sourceControl"] as SidebarTab[]).map((tab) => (
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

        {/* Expanded content */}
        <div
          className={cn(
            "flex flex-1 flex-col overflow-hidden transition-opacity duration-200",
            isExpanded ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          style={{ width: sidebarWidth }}
        >
          <div className="flex h-12 items-center justify-between border-b border-border px-4">
            <span className="font-medium text-foreground">{tabLabels[activeTab]}</span>
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
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn("flex flex-col gap-1", message.role === "user" ? "items-end" : "items-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[90%] rounded-lg px-3 py-2 text-sm",
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
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

                {/* Input */}
                <div className="border-t border-border p-3">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me to help build your flow..."
                      className="flex-1 bg-muted/50"
                      disabled={isLoading}
                    />
                    <Button size="icon" onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "explorer" && (
              <div className="h-full overflow-y-auto p-3">
                <div className="space-y-1">
                  {Object.entries(groupedNodes).map(([folder, folderNodes]) => (
                    <div key={folder}>
                      <button
                        onClick={() => toggleFolder(folder)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {expandedFolders[folder] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="capitalize">{folder}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{folderNodes.length}</span>
                      </button>
                      {expandedFolders[folder] && (
                        <div className="ml-4 mt-1 space-y-0.5">
                          {folderNodes.map((node) => (
                            <button
                              key={node.id}
                              onClick={() => onNodeSelect(node)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                                selectedNode?.id === node.id
                                  ? "bg-primary/10 text-primary"
                                  : "text-foreground hover:bg-muted",
                              )}
                            >
                              <FileCode className="h-4 w-4" />
                              <span className="truncate">{node.label}</span>
                            </button>
                          ))}
                          {folderNodes.length === 0 && (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground italic">No {folder}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                    <Workflow className="h-4 w-4" />
                    <span>{connections.length} connections</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "catalog" && (
              <div className="h-full overflow-y-auto">
                <div className="p-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Search components..."
                      className="pl-8 bg-muted/50"
                    />
                  </div>
                </div>

                <div className="px-3 pb-3 space-y-2">
                  {filteredCatalog.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onAddNode(item.type, item.label)}
                      className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-md",
                          item.type === "trigger" && "bg-chart-1/10 text-chart-1",
                          item.type === "function" && "bg-chart-2/10 text-chart-2",
                          item.type === "condition" && "bg-chart-3/10 text-chart-3",
                          item.type === "action" && "bg-chart-4/10 text-chart-4",
                        )}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{item.label}</span>
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                    </button>
                  ))}
                  {filteredCatalog.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No components match your search
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "sourceControl" && (
              <div className="h-full overflow-y-auto p-3">
                <div className="space-y-4">
                  {/* Changes Section */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Changes
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted">
                        <span className="h-2 w-2 rounded-full bg-chart-2" />
                        <span className="flex-1 truncate">workflow.json</span>
                        <span className="text-xs text-muted-foreground">M</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="flex-1 truncate">nodes/transform-data.js</span>
                        <span className="text-xs text-muted-foreground">A</span>
                      </div>
                    </div>
                  </div>

                  {/* Commit Section */}
                  <div className="border-t border-border pt-4">
                    <Input placeholder="Commit message..." className="mb-2 bg-muted/50" />
                    <Button size="sm" className="w-full gap-2">
                      <GitMerge className="h-3.5 w-3.5" />
                      Commit Changes
                    </Button>
                  </div>

                  {/* Recent Commits */}
                  <div className="border-t border-border pt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Recent Commits
                    </h4>
                    <div className="space-y-2">
                      {[
                        { hash: "a1b2c3d", message: "Added email notification action", time: "2 hours ago" },
                        { hash: "e4f5g6h", message: "Updated transform logic", time: "5 hours ago" },
                        { hash: "i7j8k9l", message: "Initial workflow setup", time: "1 day ago" },
                      ].map((commit) => (
                        <div key={commit.hash} className="rounded-md border border-border bg-secondary/20 p-2">
                          <div className="flex items-center gap-2">
                            <code className="text-[10px] text-primary">{commit.hash}</code>
                            <span className="text-xs text-muted-foreground">{commit.time}</span>
                          </div>
                          <p className="text-xs text-foreground mt-1 truncate">{commit.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resize Handle */}
          <div
            className="absolute right-0 top-0 z-10 h-full w-1 cursor-ew-resize hover:bg-primary/50 active:bg-primary"
            onMouseDown={handleResizeStart}
          >
            <div className="absolute right-0 top-1/2 flex h-12 w-4 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded bg-border opacity-0 hover:opacity-100">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
