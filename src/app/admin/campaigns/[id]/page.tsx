"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Loader2,
  Play,
  Pause,
  Trash2,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
  XCircle,
  FileText
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // 1. Fetch campaign general details
  const { data: campaign, isLoading: loadingCampaign, refetch: refetchCampaign } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // 2. Fetch email templates (sequence steps)
  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ["campaign-templates", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("campaign_id", id)
        .order("sequence_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  // 3. Fetch live email sends history
  const { data: sends, isLoading: loadingSends, refetch: refetchSends } = useQuery({
    queryKey: ["campaign-sends", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_sends")
        .select(`
          id, status, sent_at,
          customers ( email, first_name, last_name )
        `)
        .eq("campaign_id", id)
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!id,
  });

  // Status mutation (Pause/Activate)
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: "active" | "paused" | "draft") => {
      const { error } = await supabase
        .from("email_campaigns")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Campaign set to ${variables}!`);
      refetchCampaign();
    },
    onError: (err: any) => {
      toast.error(`Failed to update status: ${err.message}`);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("email_campaigns")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campaign deleted successfully.");
      router.push("/admin/campaigns");
    },
    onError: (err: any) => {
      toast.error(`Delete failed: ${err.message}`);
    }
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/60";
      case "paused":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800/60";
      case "completed":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/60";
      case "sending":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60";
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800";
    }
  };

  if (loadingCampaign || loadingTemplates) {
    return (
      <CampaignLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading campaign details...</p>
        </div>
      </CampaignLayout>
    );
  }

  if (!campaign) {
    return (
      <CampaignLayout>
        <div className="text-center py-20 space-y-4">
          <h2 className="text-xl font-bold">Campaign Not Found</h2>
          <p className="text-sm text-muted-foreground">This campaign does not exist or has been deleted.</p>
          <Button asChild>
            <Link href="/admin/campaigns">Back to Campaigns</Link>
          </Button>
        </div>
      </CampaignLayout>
    );
  }

  // Calculate metrics
  const totalSent = sends?.length ?? 0;
  const deliveredCount = sends?.filter(s => s.status === "delivered").length ?? 0;
  const bounceCount = sends?.filter(s => s.status === "bounced").length ?? 0;
  const deliveryRate = totalSent > 0 ? (deliveredCount / totalSent) * 100 : 0;

  return (
    <CampaignLayout>
      <div className="space-y-8">
        {/* Back and Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
          <div className="space-y-1">
            <Link
              href="/admin/campaigns"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1.5 transition-colors font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Campaigns
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{campaign.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeColor(campaign.status)}`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
              {campaign.campaign_type === "ai_funnel" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-950/40 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800/60">
                  <Sparkles className="w-3 h-3" /> AI Sequence
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Created on {format(new Date(campaign.created_at), "PPP")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {campaign.status === "active" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatusMutation.mutate("paused")}
                disabled={updateStatusMutation.isPending}
                className="gap-1.5 text-yellow-600 border-yellow-200 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-900 dark:hover:bg-yellow-950/20"
              >
                <Pause className="w-4 h-4" /> Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatusMutation.mutate("active")}
                disabled={updateStatusMutation.isPending}
                className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-950/20"
              >
                <Play className="w-4 h-4" /> Activate
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to permanently delete this campaign and all its emails?")) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              className="gap-1.5 text-destructive border-destructive/20 hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Total Emails Sent
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSent}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Logs recorded</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Delivered
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveredCount}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {deliveryRate.toFixed(1)}% delivery rate
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Bounced
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bounceCount}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Undelivered emails</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Sequence Length
              </CardTitle>
              <FileText className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Sequence templates</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Sequence Steps */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Email Sequence</h2>
              <p className="text-xs text-muted-foreground">List of emails dispatched in this campaign.</p>
            </div>

            <div className="space-y-4">
              {templates.map((tmpl) => (
                <Card key={tmpl.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-3 px-5 py-4 border-b border-border/50 bg-muted/5">
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex-shrink-0">
                      {tmpl.sequence_order}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-bold text-foreground truncate">
                        {tmpl.subject}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Step {tmpl.sequence_order} of {templates.length}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-muted-foreground overflow-y-auto max-h-40 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-lg border"
                      dangerouslySetInnerHTML={{ __html: tmpl.content_html }}
                    />
                  </CardContent>
                </Card>
              ))}

              {templates.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-2xl bg-muted/5">
                  <Mail className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
                  <p className="text-sm font-bold text-foreground">No templates configured</p>
                  <p className="text-xs text-muted-foreground mt-1">This campaign has no email steps.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Sends Logs */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Activity History</h2>
              <p className="text-xs text-muted-foreground">Latest email dispatches for this campaign.</p>
            </div>

            <Card className="shadow-sm max-h-[500px] overflow-y-auto">
              <CardContent className="p-4">
                {loadingSends ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : !sends || sends.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    No dispatches recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sends.map((send) => (
                      <div
                        key={send.id}
                        className="flex items-start justify-between p-3 rounded-xl hover:bg-muted/40 transition-colors border border-border/30 bg-muted/5"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {send.customers?.email || "Unknown Recipient"}
                          </p>
                          {send.customers?.first_name && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {send.customers.first_name} {send.customers.last_name || ""}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground font-medium">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            {format(new Date(send.sent_at), "MMM d, h:mm a")}
                          </div>
                        </div>

                        <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          send.status === "delivered"
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400"
                            : send.status === "bounced"
                            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400"
                            : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
                        }`}>
                          {send.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CampaignLayout>
  );
}
