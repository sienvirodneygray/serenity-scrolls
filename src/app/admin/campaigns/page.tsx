"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, CalendarClock, MoreHorizontal, Mail, Loader2, Sparkles } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function CampaignsListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns", statusFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("email_campaigns")
        .select(`
          id, name, status, campaign_type, created_at,
          email_templates (count),
          campaign_target_groups (count),
          campaign_target_customers (count)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      sending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      completed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return map[status] || map.draft;
  };

  const groupCampaigns = campaigns?.filter(c => c.campaign_type === "ai_funnel" || !c.name.startsWith("Scheduled:")) || [];
  const individualEmails = campaigns?.filter(c => c.name.startsWith("Scheduled:")) || [];

  const CampaignCard = ({ campaign }: { campaign: any }) => (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-bold line-clamp-1 mr-4">
          <Link href={`/admin/campaigns/${campaign.id}`} className="hover:underline">
            {campaign.name}
          </Link>
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
               <Link href={`/admin/campaigns/${campaign.id}`}>View Details</Link>
            </DropdownMenuItem>
            {campaign.status === 'draft' && (
              <DropdownMenuItem asChild>
                <Link href={`/admin/campaigns/${campaign.id}/setup`}>Continue Setup</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Delete Campaign</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4 mt-1">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(campaign.status)}`}>
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </span>
          {campaign.campaign_type === "ai_funnel" && (
            <span className="inline-flex flex-row items-center gap-1.5 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
              <Sparkles className="w-3 h-3"/> AI Sequence
            </span>
          )}
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
             <Mail className="w-4 h-4"/> 
             {campaign.email_templates[0]?.count || 0} Emails
          </div>
          <div className="flex items-center gap-1">
             <CalendarClock className="w-4 h-4"/>
             {new Date(campaign.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <CampaignLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground mt-1">Manage and track your automated marketing funnels.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/compose">
                New Broadcast Email
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/campaigns/new">
                <Plus className="w-4 h-4 mr-2" />
                AI Sequence Creator
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 py-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="groups" className="space-y-6">
          <TabsList>
            <TabsTrigger value="groups">Funnels & Multi-part Campaigns</TabsTrigger>
            <TabsTrigger value="individual">One-Off Broadcasts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="groups">
            {isLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : groupCampaigns.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No campaigns found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">Get started by creating an AI sequence or manual multi-part funnel.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupCampaigns.map((camp) => (
                  <CampaignCard key={camp.id} campaign={camp} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="individual">
            {isLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : individualEmails.length === 0 ? (
               <div className="text-center py-12 border border-dashed rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
               <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
               <h3 className="mt-4 text-lg font-semibold">No broadcasts found</h3>
               <p className="text-muted-foreground max-w-sm mx-auto mt-2">Write and schedule a one-off broadcast to your users.</p>
             </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {individualEmails.map((camp) => (
                  <CampaignCard key={camp.id} campaign={camp} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </CampaignLayout>
  );
}
