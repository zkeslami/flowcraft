import { useState } from "react";
import { X, Search, Plus, Trash2, Edit3, Check, FileText, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: "template" | "fragment";
  createdAt: Date;
}

interface PromptLibraryProps {
  onClose: () => void;
  onInsert: (content: string) => void;
}

// Mock data - in real implementation this would come from storage
const initialTemplates: PromptTemplate[] = [
  {
    id: "1",
    name: "System Role Definition",
    description: "Standard system role template for AI assistants",
    content: "## Role\n\nYou are a helpful AI assistant that specializes in @domain. Your goal is to provide accurate, concise, and helpful responses.\n\n## Constraints\n\n- Always be truthful\n- Acknowledge uncertainty when present\n- Stay within your area of expertise",
    category: "template",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Output Format JSON",
    description: "JSON output formatting instructions",
    content: "## Output Format\n\nRespond with a valid JSON object following this structure:\n\n```json\n{\n  \"result\": \"your response here\",\n  \"confidence\": 0.95\n}\n```",
    category: "fragment",
    createdAt: new Date("2024-01-16"),
  },
  {
    id: "3",
    name: "Chain of Thought",
    description: "Reasoning chain prompt fragment",
    content: "Think through this step-by-step:\n1. First, understand the core question\n2. Break down into sub-problems\n3. Solve each sub-problem\n4. Combine for final answer",
    category: "fragment",
    createdAt: new Date("2024-01-17"),
  },
  {
    id: "4",
    name: "Error Handling",
    description: "Instructions for handling edge cases",
    content: "## Error Handling\n\nIf you encounter any of the following situations:\n- Invalid input: Respond with a clear error message\n- Ambiguous request: Ask for clarification\n- Out of scope: Politely decline and explain why",
    category: "fragment",
    createdAt: new Date("2024-01-18"),
  },
];

export function PromptLibrary({ onClose, onInsert }: PromptLibraryProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>(initialTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    content: "",
    category: "template" as "template" | "fragment",
  });

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleEdit = () => {
    if (!selectedTemplate) return;
    setEditForm({
      name: selectedTemplate.name,
      description: selectedTemplate.description,
      content: selectedTemplate.content,
      category: selectedTemplate.category,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedTemplate) return;
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === selectedTemplate.id
          ? { ...t, ...editForm }
          : t
      )
    );
    setSelectedTemplate({ ...selectedTemplate, ...editForm });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!selectedTemplate) return;
    setTemplates((prev) => prev.filter((t) => t.id !== selectedTemplate.id));
    setSelectedTemplate(null);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setEditForm({
      name: "",
      description: "",
      content: "",
      category: "template",
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleSaveNew = () => {
    const newTemplate: PromptTemplate = {
      id: Date.now().toString(),
      ...editForm,
      createdAt: new Date(),
    };
    setTemplates((prev) => [...prev, newTemplate]);
    setSelectedTemplate(newTemplate);
    setIsCreating(false);
  };

  const handleInsert = () => {
    if (selectedTemplate) {
      onInsert(selectedTemplate.content);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[60]">
      <div className="bg-card border border-border rounded-lg shadow-xl w-[800px] h-[560px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-accent/30">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Prompt Library</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Template List */}
          <div className="w-[260px] border-r border-border flex flex-col bg-accent/10">
            {/* Search */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm bg-background/50"
                />
              </div>
            </div>

            {/* Template List */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md transition-colors",
                      "hover:bg-accent",
                      selectedTemplate?.id === template.id && "bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[10px] uppercase font-medium px-1.5 py-0.5 rounded",
                          template.category === "template"
                            ? "bg-primary/20 text-primary"
                            : "bg-chart-3/20 text-chart-3"
                        )}
                      >
                        {template.category}
                      </span>
                    </div>
                    <div className="text-sm font-medium mt-1 truncate">
                      {template.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {template.description}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Add New Button */}
            <div className="p-3 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCreate}
                className="w-full"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New Template
              </Button>
            </div>
          </div>

          {/* Main Content - Template View/Edit */}
          <div className="flex-1 flex flex-col">
            {selectedTemplate && !isEditing && !isCreating && (
              <>
                {/* Template Header */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{selectedTemplate.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {selectedTemplate.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={handleEdit} className="h-7 w-7">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleDelete} className="h-7 w-7 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Template Content Preview */}
                <ScrollArea className="flex-1 p-4">
                  <pre className="text-sm font-mono whitespace-pre-wrap text-foreground/90">
                    {selectedTemplate.content}
                  </pre>
                </ScrollArea>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => {
                    navigator.clipboard.writeText(selectedTemplate.content);
                  }}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy
                  </Button>
                  <Button size="sm" onClick={handleInsert}>
                    Insert into Editor
                  </Button>
                </div>
              </>
            )}

            {(isEditing || isCreating) && (
              <>
                {/* Edit Form Header */}
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="font-medium">
                    {isCreating ? "Create New Template" : "Edit Template"}
                  </h3>
                </div>

                {/* Edit Form */}
                <div className="flex-1 p-4 space-y-4 overflow-auto">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Template name"
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description"
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Category</label>
                    <div className="flex gap-2">
                      <Button
                        variant={editForm.category === "template" ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setEditForm((prev) => ({ ...prev, category: "template" }))}
                      >
                        Template
                      </Button>
                      <Button
                        variant={editForm.category === "fragment" ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setEditForm((prev) => ({ ...prev, category: "fragment" }))}
                      >
                        Fragment
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="Prompt content..."
                      className="min-h-[180px] font-mono text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Edit Actions */}
                <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreating(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={isCreating ? handleSaveNew : handleSaveEdit}
                    disabled={!editForm.name || !editForm.content}
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    {isCreating ? "Create" : "Save"}
                  </Button>
                </div>
              </>
            )}

            {!selectedTemplate && !isCreating && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a template to preview</p>
                  <p className="text-xs mt-1">or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}