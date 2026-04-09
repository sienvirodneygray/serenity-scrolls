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
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : faqs?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No FAQs yet. Add your first FAQ from keyword research!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Order</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[100px]">Active</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs?.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        {faq.sort_order}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="font-medium truncate">{faq.question}</p>
                      <p className="text-xs text-muted-foreground truncate">{faq.answer.slice(0, 80)}...</p>
                    </TableCell>
                    <TableCell>
                      {faq.category ? (
                        <span className="px-2 py-1 bg-muted rounded text-xs">{faq.category}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={faq.is_active}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ id: faq.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(faq)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
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
