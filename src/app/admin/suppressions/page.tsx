"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Loader2, Plus, Trash2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";

interface SuppressionForm {
  email: string;
  reason: "bounce" | "complaint" | "unsubscribe" | "manual";
  notes: string;
}

const REASON_LABELS: Record<string, string> = {
  bounce: "Bounce",
  complaint: "Spam Complaint",
  unsubscribe: "Unsubscribe",
  manual: "Manual",
};

const REASON_COLORS: Record<string, string> = {
  bounce: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  complaint: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  unsubscribe: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  manual: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function SuppressionsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<SuppressionForm>({
    defaultValues: { reason: "manual", notes: "" },
  });

  const { data: suppressions, isLoading } = useQuery({
    queryKey: ["suppressions", search],
    queryFn: async () => {
      let query = supabase
        .from("suppressions")
        .select("*")
        .order("created_at", { ascending: false });
      if (search) query = query.ilike("email", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: SuppressionForm) => {
      const { error } = await supabase.from("suppressions").upsert(
        { email: values.email, reason: values.reason, notes: values.notes || null },
        { onConflict: "email" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppressions"] });
      toast({ title: "Address suppressed", description: "This email will be excluded from all future sends." });
      reset();
      setOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppressions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppressions"] });
      toast({ title: "Suppression removed", description: "Address can now receive emails again." });
    },
  });

  const onSubmit = (data: SuppressionForm) => addMutation.mutate(data);

  return (
    <CampaignLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suppressions</h1>
            <p className="text-muted-foreground mt-1">
              Email addresses blocked from receiving any future campaigns.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Plus className="w-4 h-4 mr-2" />
                Suppress Address
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Suppress an Email Address</DialogTitle>
                <DialogDescription>
                  This address will be permanently excluded from all campaign sends.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      {...register("email", { required: true })}
                    />
                    {errors.email && <p className="text-xs text-destructive">Required</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Select
                      value={watch("reason")}
                      onValueChange={(v) => setValue("reason", v as SuppressionForm["reason"])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="unsubscribe">Unsubscribe</SelectItem>
                        <SelectItem value="bounce">Bounce</SelectItem>
                        <SelectItem value="complaint">Spam Complaint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea placeholder="Any context..." {...register("notes")} rows={2} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="destructive" disabled={addMutation.isPending}>
                    {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Suppression"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <Card className="shadow-sm">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !suppressions || suppressions.length === 0 ? (
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShieldAlert className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-muted-foreground">No suppressions found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {search ? "Try a different search." : "All addresses are eligible to receive emails."}
              </p>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppressions.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium font-mono text-sm">{s.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${REASON_COLORS[s.reason] ?? ""}`}>
                        {REASON_LABELS[s.reason] ?? s.reason}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                      {s.notes || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(s.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeMutation.mutate(s.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </CampaignLayout>
  );
}
