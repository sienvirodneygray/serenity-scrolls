"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Calendar,
  Users,
  Layers,
  Loader2,
  CalendarClock,
  Plus,
  TrendingUp,
  ArrowRight,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function CampaignDashboardPage() {
  const { data: totalSent, isLoading: loadingSent } = useQuery({
    queryKey: ["dashboard-total-sent"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("email_sends")
        .select("id", { count: "exact", head: true })
        .eq("status", "sent");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: upcomingSchedules, isLoading: loadingSchedules } = useQuery({
    queryKey: ["dashboard-upcoming-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_schedules")
        .select(`
          id, scheduled_at, status,
          email_templates ( subject ),
          email_campaigns ( name )
        `)
        .eq("status", "pending")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        scheduled_at: string;
        status: string;
        email_templates: { subject: string } | null;
        email_campaigns: { name: string } | null;
      }>;
    },
  });

  const { data: customerCount, isLoading: loadingCustomers } = useQuery({
    queryKey: ["dashboard-customer-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: groupCount, isLoading: loadingGroups } = useQuery({
    queryKey: ["dashboard-group-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("customer_groups")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const stats = [
    {
      name: "Total Sent",
      value: loadingSent ? null : (totalSent ?? 0).toLocaleString(),
      icon: Mail,
      description: "All-time delivered",
      gradient: "from-violet-500/20 to-purple-500/10",
      iconColor: "text-violet-400",
      accent: "hsl(262 83% 65%)",
    },
    {
      name: "Scheduled",
      value: loadingSchedules ? null : (upcomingSchedules?.length ?? 0).toString(),
      icon: Calendar,
      description:
        upcomingSchedules && upcomingSchedules.length > 0
          ? `Next: ${format(new Date(upcomingSchedules[0].scheduled_at), "MMM d, h:mm a")}`
          : "None pending",
      gradient: "from-blue-500/20 to-cyan-500/10",
      iconColor: "text-blue-400",
      accent: "hsl(213 90% 65%)",
    },
    {
      name: "Contacts",
      value: loadingCustomers ? null : (customerCount ?? 0).toLocaleString(),
      icon: Users,
      description: "CRM profiles",
      gradient: "from-emerald-500/20 to-teal-500/10",
      iconColor: "text-emerald-400",
      accent: "hsl(158 64% 52%)",
    },
    {
      name: "Segments",
      value: loadingGroups ? null : (groupCount ?? 0).toString(),
      icon: Layers,
      description: "Audience groups",
      gradient: "from-amber-500/20 to-orange-500/10",
      iconColor: "text-amber-400",
      accent: "hsl(38 92% 60%)",
    },
  ];

  return (
    <CampaignLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-primary" />
              <span className="text-xs font-semibold tracking-widest uppercase text-primary">
                Overview
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Campaign Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live view of your email marketing operations.
            </p>
          </div>
          <Link href="/admin/campaigns/new">
            <button className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm transition-all flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm hover:shadow-md">
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </Link>
        </div>

        {/* KPI Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-card border border-border/80 shadow-sm rounded-2xl p-5 relative overflow-hidden group hover:shadow-md transition-all"
            >
              {/* Subtle background glow */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/10 transition-all" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                    {stat.name}
                  </p>
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/50">
                    <stat.icon className={`h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400`} />
                  </div>
                </div>
                {stat.value === null ? (
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                ) : (
                  <p className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Sends */}
        <div className="bg-card border border-border/80 shadow-sm rounded-2xl overflow-hidden">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <CalendarClock className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Upcoming Sends</p>
                <p className="text-xs text-muted-foreground">
                  Scheduled emails pending dispatch
                </p>
              </div>
            </div>
            <Link
              href="/admin/campaigns"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Panel Body */}
          <div className="px-6 py-4">
            {loadingSchedules ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              </div>
            ) : !upcomingSchedules || upcomingSchedules.length === 0 ? (
              <div className="text-center py-12 bg-muted/5 rounded-xl border border-dashed border-border/80">
                <div className="h-12 w-12 rounded-xl mx-auto mb-4 flex items-center justify-center bg-muted">
                  <CalendarClock className="h-6 w-6 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-bold text-foreground">
                  No upcoming sends
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-5">
                  Schedule a campaign to see it here.
                </p>
                <Link href="/admin/campaigns">
                  <button className="text-xs px-4 py-2 rounded-xl font-medium border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm">
                    Go to Campaigns
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {upcomingSchedules.map((schedule, idx) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between py-3 rounded-xl px-4 transition-colors hover:bg-muted/40 border-b border-border/30 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                        <Mail className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {schedule.email_templates?.subject ?? "Untitled Email"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {schedule.email_campaigns?.name ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <p className="text-xs font-semibold text-muted-foreground">
                            {format(new Date(schedule.scheduled_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CampaignLayout>
  );
}
