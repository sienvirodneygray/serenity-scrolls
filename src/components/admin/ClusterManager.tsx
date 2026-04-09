import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Network } from "lucide-react";

interface Cluster {
  id: string;
  name: string;
  description: string | null;
  pillar_post_id: string | null;
  goals: string | null;
  notes: string | null;
}

interface ClusterWithPosts extends Cluster {
  posts: { id: string; title: string; post_type: string | null }[];
}

export const ClusterManager = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Cluster | null>(null);
  const [form, setForm] = useState({ name: "", description: "", goals: "", notes: "" });

  const { data: clusters, isLoading } = useQuery({
    queryKey: ["topic-clusters-full"],
    queryFn: async () => {
      const { data: clusterData, error } = await supabase.from("topic_clusters").select("*").order("created_at", { ascending: false });
      if (error) throw error;

      const { data: posts } = await supabase.from("blog_posts").select("id, title, post_type, cluster_id").not("cluster_id", "is", null);

      return (clusterData || []).map((c: Cluster): ClusterWithPosts => ({
        ...c,
        posts: (posts || []).filter((p: any) => p.cluster_id === c.id),
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { name: data.name, description: data.description || null, goals: data.goals || null, notes: data.notes || null };
      if (editing) {
        const { error } = await supabase.from("topic_clusters").update(payload as any).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("topic_clusters").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic-clusters-full"] });
      queryClient.invalidateQueries({ queryKey: ["topic-clusters"] });
      toast({ title: editing ? "Cluster updated" : "Cluster created" });
      resetForm();
    },
    onError: (err) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("topic_clusters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic-clusters-full"] });
      queryClient.invalidateQueries({ queryKey: ["topic-clusters"] });
      toast({ title: "Cluster deleted" });
    },
  });

  const resetForm = () => {
    setForm({ name: "", description: "", goals: "", notes: "" });
    setEditing(null);
    setIsOpen(false);
  };

  const handleEdit = (c: Cluster) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || "", goals: c.goals || "", notes: c.notes || "" });
    setIsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Network className="h-5 w-5" /> Cluster Map
        </h3>
        <Button size="sm" onClick={() => { resetForm(); setIsOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Cluster
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : !clusters?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No clusters yet. Create one to organize your content strategy.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {clusters.map((cluster) => {
            const pillar = cluster.posts.find(p => p.post_type === "pillar");
            const spokes = cluster.posts.filter(p => p.post_type !== "pillar");

            return (
              <Card key={cluster.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{cluster.name}</CardTitle>
                      {cluster.description && <p className="text-xs text-muted-foreground mt-1">{cluster.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(cluster)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this cluster?")) deleteMutation.mutate(cluster.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Pillar:</span>
                    {pillar ? (
                      <Badge variant="default" className="ml-2 text-xs">{pillar.title}</Badge>
                    ) : (
                      <Badge variant="destructive" className="ml-2 text-xs">Missing</Badge>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Spokes ({spokes.length}/6):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {spokes.map(s => (
                        <Badge key={s.id} variant="secondary" className="text-xs">{s.title.substring(0, 30)}{s.title.length > 30 ? "…" : ""}</Badge>
                      ))}
                      {spokes.length < 6 && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">+{6 - spokes.length} needed</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Cluster" : "New Topic Cluster"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Goals</Label>
              <Input value={form.goals} onChange={(e) => setForm(f => ({ ...f, goals: e.target.value }))} placeholder="e.g., Rank for 'guided journal prompts'" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
