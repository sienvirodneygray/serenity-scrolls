import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";

interface BacklogItem {
  id: string;
  topic: string;
  cluster_id: string | null;
  priority: number;
  status: string;
  format_type: string | null;
  primary_keyword: string | null;
  notes: string | null;
  created_at: string;
}

export const TopicBacklogManager = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<BacklogItem | null>(null);
  const [form, setForm] = useState({
    topic: "",
    cluster_id: "",
    priority: 3,
    format_type: "",
    primary_keyword: "",
    notes: "",
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["topic-backlog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topic_backlog")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data as BacklogItem[];
    },
  });

  const { data: clusters } = useQuery({
    queryKey: ["topic-clusters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("topic_clusters").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        topic: data.topic,
        cluster_id: data.cluster_id || null,
        priority: data.priority,
        format_type: data.format_type || null,
        primary_keyword: data.primary_keyword || null,
        notes: data.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from("topic_backlog").update(payload as any).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("topic_backlog").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic-backlog"] });
      toast({ title: editing ? "Topic updated" : "Topic added" });
      resetForm();
    },
    onError: (err) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("topic_backlog").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic-backlog"] });
      toast({ title: "Topic removed" });
    },
  });

  const resetForm = () => {
    setForm({ topic: "", cluster_id: "", priority: 3, format_type: "", primary_keyword: "", notes: "" });
    setEditing(null);
    setIsOpen(false);
  };

  const handleEdit = (item: BacklogItem) => {
    setEditing(item);
    setForm({
      topic: item.topic,
      cluster_id: item.cluster_id || "",
      priority: item.priority,
      format_type: item.format_type || "",
      primary_keyword: item.primary_keyword || "",
      notes: item.notes || "",
    });
    setIsOpen(true);
  };

  const priorityColors: Record<number, string> = {
    1: "bg-muted text-muted-foreground",
    2: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    3: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    4: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    5: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Topic Backlog</CardTitle>
        <Button size="sm" onClick={() => { resetForm(); setIsOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Topic
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !items?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">No topics in backlog. The engine will auto-generate topics when needed.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topic</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium max-w-[250px] truncate">{item.topic}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[item.priority] || ""}`}>
                      P{item.priority}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize text-sm">{item.format_type || "—"}</TableCell>
                  <TableCell className="capitalize text-sm">{item.status}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Remove this topic?")) deleteMutation.mutate(item.id); }}>
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Topic" : "Add Topic to Backlog"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Topic *</Label>
              <Input value={form.topic} onChange={(e) => setForm(f => ({ ...f, topic: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority (1-5)</Label>
                <Select value={String(form.priority)} onValueChange={(v) => setForm(f => ({ ...f, priority: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>P{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format</Label>
                <Select value={form.format_type} onValueChange={(v) => setForm(f => ({ ...f, format_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="how-to">How-to</SelectItem>
                    <SelectItem value="list">List / Checklist</SelectItem>
                    <SelectItem value="problem-solution">Problem-Solution</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Cluster</Label>
              <Select value={form.cluster_id} onValueChange={(v) => setForm(f => ({ ...f, cluster_id: v }))}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {clusters?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Primary Keyword</Label>
              <Input value={form.primary_keyword} onChange={(e) => setForm(f => ({ ...f, primary_keyword: e.target.value }))} placeholder="Optional" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {editing ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
