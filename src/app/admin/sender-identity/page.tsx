"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, CheckCircle2, XCircle, Loader2, Plus, Trash2, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";

interface SenderForm {
  from_name: string;
  from_email: string;
  domain: string;
}

export default function SenderIdentityPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SenderForm>();

  const { data: identities, isLoading } = useQuery({
    queryKey: ["sender-identities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sender_identities")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (values: SenderForm) => {
      const { error } = await supabase.from("sender_identities").insert({
        from_name: values.from_name,
        from_email: values.from_email,
        domain: values.domain,
        is_default: identities?.length === 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sender-identities"] });
      toast({ title: "Sender identity added", description: "You can now use this sender in campaigns." });
      reset();
      setOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Failed to add sender", description: err.message, variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("sender_identities").update({ is_default: false }).neq("id", id);
      const { error } = await supabase.from("sender_identities").update({ is_default: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sender-identities"] });
      toast({ title: "Default sender updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sender_identities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sender-identities"] });
      toast({ title: "Sender identity removed" });
    },
  });

  const onSubmit = (data: SenderForm) => addMutation.mutate(data);

  return (
    <CampaignLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sender Identity</h1>
            <p className="text-muted-foreground mt-1">Manage the "From" addresses used in your email campaigns.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Sender
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Sender Identity</DialogTitle>
                <DialogDescription>Set up an email address to send campaigns from.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input placeholder="e.g., Serenity Scrolls" {...register("from_name", { required: true })} />
                    {errors.from_name && <p className="text-xs text-destructive">Required</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>From Email</Label>
                    <Input type="email" placeholder="hello@serenityscrolls.com" {...register("from_email", { required: true })} />
                    {errors.from_email && <p className="text-xs text-destructive">Required</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Domain</Label>
                    <Input placeholder="serenityscrolls.com" {...register("domain", { required: true })} />
                    {errors.domain && <p className="text-xs text-destructive">Required</p>}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={addMutation.isPending}>
                    {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Identity"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* DKIM/SPF Info Banner */}
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800">
          <CardContent className="flex items-start gap-3 pt-5">
            <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-400 text-sm">Domain Authentication</p>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                For best deliverability, add DKIM and SPF records to your domain's DNS. Your email provider (e.g., Resend) will supply the values. Verification status is shown below.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Identities List */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : !identities || identities.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
            <UserPlus className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">No sender identities yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Add one to start sending campaigns.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {identities.map((identity: any) => (
              <Card key={identity.id} className="shadow-sm">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{identity.from_name}</p>
                      {identity.is_default && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{identity.from_email}</p>
                    <p className="text-xs text-muted-foreground">{identity.domain}</p>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="flex items-center gap-1 text-xs">
                        {identity.dkim_verified
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                        DKIM
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        {identity.spf_verified
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                        SPF
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!identity.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(identity.id)}
                        disabled={setDefaultMutation.isPending}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(identity.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CampaignLayout>
  );
}
