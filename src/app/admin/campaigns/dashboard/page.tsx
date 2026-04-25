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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4" style={{ color: "hsl(262 83% 65%)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "hsl(262 83% 65%)" }}>
                Overview
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Campaign Dashboard</h1>
            <p className="mt-1 text-sm" style={{ color: "hsl(240 10% 45%)" }}>
              Live view of your email marketing operations.
            </p>
          </div>
          <Link href="/admin/campaigns/new">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(280 70% 50%))",
                boxShadow: "0 0 20px hsl(262 83% 58% / 0.3)",
              }}
            >
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
              className="rounded-xl p-5 relative overflow-hidden"
              style={{
                background: "hsl(240 10% 8%)",
                border: "1px solid hsl(240 8% 13%)",
              }}
            >
              {/* Background glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-60`}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-medium tracking-wide uppercase" style={{ color: "hsl(240 10% 45%)" }}>
                    {stat.name}
                  </p>
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ background: "hsl(240 10% 12%)" }}
                  >
                    <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                </div>
                {stat.value === null ? (
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: "hsl(240 10% 40%)" }} />
                ) : (
                  <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                )}
                <p className="text-xs mt-1" style={{ color: "hsl(240 10% 40%)" }}>
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Sends */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "hsl(240 10% 8%)",
            border: "1px solid hsl(240 8% 13%)",
          }}
        >
          {/* Panel Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid hsl(240 8% 12%)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{ background: "hsl(213 90% 58% / 0.15)" }}
              >
                <CalendarClock className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Upcoming Sends</p>
                <p className="text-xs" style={{ color: "hsl(240 10% 40%)" }}>
                  Scheduled emails pending dispatch
                </p>
              </div>
            </div>
            <Link
              href="/admin/campaigns"
              className="flex items-center gap-1 text-xs transition-colors hover:text-white"
              style={{ color: "hsl(240 10% 45%)" }}
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Panel Body */}
          <div className="px-6 py-4">
            {loadingSchedules ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "hsl(240 10% 35%)" }} />
              </div>
            ) : !upcomingSchedules || upcomingSchedules.length === 0 ? (
              <div className="text-center py-12">
                <div
                  className="h-12 w-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "hsl(240 10% 11%)" }}
                >
                  <CalendarClock className="h-6 w-6" style={{ color: "hsl(240 10% 30%)" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "hsl(240 10% 50%)" }}>
                  No upcoming sends
                </p>
                <p className="text-xs mt-1 mb-5" style={{ color: "hsl(240 10% 35%)" }}>
                  Schedule a campaign to see it here.
                </p>
                <Link href="/admin/campaigns">
                  <button
                    className="text-xs px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
                    style={{
                      background: "hsl(240 10% 12%)",
                      border: "1px solid hsl(240 8% 18%)",
                      color: "hsl(240 10% 60%)",
                    }}
                  >
                    Go to Campaigns
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {upcomingSchedules.map((schedule, idx) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between py-3 rounded-lg px-3 transition-colors"
                    style={
                      idx !== upcomingSchedules.length - 1
                        ? { borderBottom: "1px solid hsl(240 8% 11%)" }
                        : {}
                    }
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "hsl(240 10% 11%)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "hsl(262 83% 58% / 0.12)" }}
                      >
                        <Mail className="h-3.5 w-3.5" style={{ color: "hsl(270 90% 70%)" }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {schedule.email_templates?.subject ?? "Untitled Email"}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "hsl(240 10% 40%)" }}>
                          {schedule.email_campaigns?.name ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Clock className="h-3 w-3" style={{ color: "hsl(240 10% 40%)" }} />
                          <p className="text-xs font-medium" style={{ color: "hsl(240 10% 60%)" }}>
                            {format(new Date(schedule.scheduled_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          background: "hsl(213 90% 58% / 0.12)",
                          color: "hsl(213 90% 72%)",
                        }}
                      >
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
