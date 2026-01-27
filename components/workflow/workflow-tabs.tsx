"use client"

interface WorkflowTab {
  id: string
  name: string
  isActive: boolean
  isDirty?: boolean
}

interface WorkflowTabsProps {
  tabs: WorkflowTab[]
  onTabSelect: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onTabAdd: () => void
  onBack?: () => void
}

export function WorkflowTabs({ tabs, onTabSelect, onTabClose, onTabAdd, onBack }: WorkflowTabsProps) {
  // Tabs are now hidden - returning null to remove them from the UI
  return null
}
