"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Calendar, Users, Briefcase, Loader2, CalendarClock, Plus } from "lucide-react";
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
      name: "Total Emails Sent",
      value: loadingSent ? null : (totalSent ?? 0).toLocaleString(),
      icon: Mail,
      description: "All-time delivered sends",
    },
    {
      name: "Scheduled Pending",
      value: loadingSchedules ? null : (upcomingSchedules?.length ?? 0).toString(),
      icon: Calendar,
      description:
        upcomingSchedules && upcomingSchedules.length > 0
          ? `Next: ${format(new Date(upcomingSchedules[0].scheduled_at), "MMM d, h:mm a")}`
          : "No sends scheduled",
    },
    {
      name: "Customer Profiles",
      value: loadingCustomers ? null : (customerCount ?? 0).toLocaleString(),
      icon: Users,
      description: "Active contacts in CRM",
    },
    {
      name: "Customer Groups",
      value: loadingGroups ? null : (groupCount ?? 0).toString(),
      icon: Briefcase,
      description: "Segmentation pools",
    },
  ];

  return (
    <CampaignLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campaign Dashboard</h1>
            <p className="text-muted-foreground mt-1">Live overview of your email marketing operations.</p>
          </div>
          <Button asChild>
            <Link href="/admin/campaigns/new">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Link>
          </Button>
        </div>

        {/* KPI Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {stat.value === null ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upcoming Sends */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Upcoming Sends
            </CardTitle>
            <CardDescription>Scheduled emails pending dispatch.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSchedules ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !upcomingSchedules || upcomingSchedules.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground font-medium">No upcoming sends</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Schedule a campaign to see it here.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/admin/campaigns">Go to Campaigns</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {schedule.email_templates?.subject ?? "Untitled Email"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Campaign: {schedule.email_campaigns?.name ?? "—"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-medium">
                        {format(new Date(schedule.scheduled_at), "MMM d, h:mm a")}
                      </p>
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mt-1 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/30">
                        Scheduled
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CampaignLayout>
  );
}
