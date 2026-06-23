import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical, Loader2, HelpCircle } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FAQFormData {
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

const initialFormData: FAQFormData = {
  question: "",
  answer: "",
  category: "",
  sort_order: 0,
  is_active: true,
};

export const FAQManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState<FAQFormData>(initialFormData);

  const { data: faqs, isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as FAQ[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FAQFormData) => {
      const { error } = await supabase.from("faqs").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast({ title: "FAQ created successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Failed to create FAQ", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FAQFormData }) => {
      const { error } = await supabase.from("faqs").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast({ title: "FAQ updated successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Failed to update FAQ", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      toast({ title: "FAQ deleted successfully" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Failed to delete FAQ", description: error.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("faqs").update({ is_active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Failed to update FAQ", description: error.message });
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingFAQ(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "",
      sort_order: faq.sort_order,
      is_active: faq.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFAQ) {
      updateMutation.mutate({ id: editingFAQ.id, data: formData });
    } else {
      // Auto-set sort_order to be last
      const maxOrder = faqs?.reduce((max, faq) => Math.max(max, faq.sort_order), 0) || 0;
      createMutation.mutate({ ...formData, sort_order: maxOrder + 1 });
    }
  };

  const handleNewFAQ = () => {
    setEditingFAQ(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              FAQ Management
            </CardTitle>
            <CardDescription>
              Add FAQs from keyword research to improve SEO. Active FAQs appear on the public site.
            </CardDescription>
          </div>
          <Button onClick={handleNewFAQ}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : faqs?.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-dashed p-12 text-center bg-muted/10">
              {/* Dotted grid background pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />
              <div className="relative z-10 max-w-sm mx-auto flex flex-col items-center">
                <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-4 ring-8 ring-indigo-500/5">
                  <HelpCircle className="h-8 w-8 animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No FAQs Configured Yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Add FAQs compiled from your keyword research to address common customer questions and improve your site's SEO score.
                </p>
                <Button onClick={handleNewFAQ} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all hover:shadow-indigo-500/20">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First FAQ
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[80px] font-semibold text-foreground">Order</TableHead>
                  <TableHead className="font-semibold text-foreground">Question</TableHead>
                  <TableHead className="font-semibold text-foreground">Category</TableHead>
                  <TableHead className="w-[100px] font-semibold text-foreground">Active</TableHead>
                  <TableHead className="text-right w-[120px] font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs?.map((faq) => (
                  <TableRow key={faq.id} className="hover:bg-muted/40 transition-colors group">
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />
                        {faq.sort_order}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[340px]">
                      <p className="font-semibold text-foreground truncate">{faq.question}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{faq.answer}</p>
                    </TableCell>
                    <TableCell>
                      {faq.category ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50 capitalize">
                          {faq.category}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={faq.is_active}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ id: faq.id, is_active: checked })
                        }
                        className="data-[state=checked]:bg-indigo-600"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50" onClick={() => handleEdit(faq)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this FAQ?")) {
                              deleteMutation.mutate(faq.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFAQ ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
            <DialogDescription>
              Add FAQs based on keyword research to improve search visibility.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="e.g., How do I start journaling with Scripture?"
                required
              />
              <p className="text-xs text-muted-foreground">
                Phrase as a question that people actually search for
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Answer *</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Provide a clear, helpful answer..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category (optional)</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Getting Started"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="is_active" className="font-medium">Active</Label>
                <p className="text-xs text-muted-foreground">Show on public FAQ section</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingFAQ ? "Update FAQ" : "Add FAQ"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
