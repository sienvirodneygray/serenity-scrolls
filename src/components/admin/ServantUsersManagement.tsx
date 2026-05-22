import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  RefreshCw, ShieldCheck, ShieldAlert, Users, MessageSquare,
  Clock, TrendingUp, Sparkles, Mail, ChevronDown, ChevronUp,
} from "lucide-react";

interface UsageStats {
  total_messages: number;
  user_messages: number;
  assistant_messages: number;
  session_count: number;
  first_message_at: string | null;
  last_active_at: string | null;
}

interface ServantUser {
  id: string;
  email: string;
  access_expires_at: string | null;
  subscription_status: string | null;
  offer_7day_sent_at: string | null;
  offer_3day_sent_at: string | null;
  offer_expiry_sent_at: string | null;
  order_id: string | null;
  verification_method: string | null;
  activated_at: string | null;
  usage: UsageStats | null;
}

interface Totals {
  active_users: number;
  total_messages: number;
  total_sessions: number;
  active_last_7d: number;
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function TrialBadge({ expiresAt, subscriptionStatus }: { expiresAt: string | null | undefined; subscriptionStatus: string | null | undefined }) {
  if (subscriptionStatus === "active")
    return <Badge className="bg-blue-600 text-white text-[10px]">Subscribed</Badge>;
  const days = daysUntil(expiresAt);
  if (days === null) return <Badge variant="outline" className="text-[10px]">—</Badge>;
  if (days < 0) return <Badge variant="destructive" className="text-[10px]">Expired</Badge>;
  if (days <= 3) return <Badge className="bg-orange-500 text-white text-[10px]">{days}d left ⚠️</Badge>;
  return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px]">{days}d left</Badge>;
}

function VerifiedBadge({ method }: { method: string | null }) {
  if (method === "sp-api") return <Badge className="bg-green-600 text-white text-[10px] gap-1"><ShieldCheck className="w-2.5 h-2.5" />SP-API</Badge>;
  if (method === "promo-code") return <Badge className="bg-purple-600 text-white text-[10px] gap-1"><Sparkles className="w-2.5 h-2.5" />Promo Code</Badge>;
  if (method === "manual") return <Badge variant="secondary" className="text-[10px]">Manual</Badge>;
  return <Badge variant="outline" className="text-[10px]">Format-only</Badge>;
}

function ActivityBar({ messages }: { messages: number }) {
  const max = 50;
  const pct = Math.min(100, (messages / max) * 100);
  const color = messages === 0 ? "bg-muted" : messages < 10 ? "bg-amber-400" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{messages}</span>
    </div>
  );
}

export function ServantUsersManagement() {
  const [users, setUsers] = useState<ServantUser[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-servant-users`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setUsers(json.users);
      setTotals(json.totals);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" /> Servant Users
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">Trial access, redemption history & chat usage</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{totals.active_users}</p>
                  <p className="text-xs text-muted-foreground">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totals.total_messages}</p>
                  <p className="text-xs text-muted-foreground">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{totals.total_sessions}</p>
                  <p className="text-xs text-muted-foreground">Chat Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{totals.active_last_7d}</p>
                  <p className="text-xs text-muted-foreground">Active This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Cards */}
      <div className="space-y-3">
        {users.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              No active Servant users yet
            </CardContent>
          </Card>
        ) : (
          users.map(u => {
            const days = daysUntil(u.access_expires_at);
            const isExpanded = expandedId === u.id;
            const hasUsage = u.usage && u.usage.user_messages > 0;

            return (
              <Card
                key={u.id}
                className={`transition-all ${isExpanded ? "ring-1 ring-primary/30" : ""}`}
              >
                {/* Main row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/20 rounded-xl transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : u.id)}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {u.email[0].toUpperCase()}
                  </div>

                  {/* Email + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{u.email}</p>
                      <VerifiedBadge method={u.verification_method} />
                      <TrialBadge expiresAt={u.access_expires_at} subscriptionStatus={u.subscription_status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Activated {u.activated_at ? new Date(u.activated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      {u.order_id && <span className="font-mono ml-2 opacity-60">· {u.order_id}</span>}
                    </p>
                  </div>

                  {/* Usage summary */}
                  <div className="hidden md:flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-bold">{u.usage?.user_messages ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Messages</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{u.usage?.session_count ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Sessions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{u.usage?.last_active_at ? timeAgo(u.usage.last_active_at) : "—"}</p>
                      <p className="text-[10px] text-muted-foreground">Last Active</p>
                    </div>
                  </div>

                  {/* Expand */}
                  <div className="text-muted-foreground shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t px-5 py-4 bg-muted/10 rounded-b-xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Messages Sent</p>
                        <p className="text-xl font-bold">{u.usage?.user_messages ?? 0}</p>
                        <ActivityBar messages={u.usage?.user_messages ?? 0} />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">AI Responses</p>
                        <p className="text-xl font-bold">{u.usage?.assistant_messages ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Sessions</p>
                        <p className="text-xl font-bold">{u.usage?.session_count ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">First Used</p>
                        <p className="text-sm font-medium">
                          {u.usage?.first_message_at
                            ? new Date(u.usage.first_message_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            : "Never used"}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Trial Expires</p>
                        <p>{u.access_expires_at ? new Date(u.access_expires_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Emails Sent</p>
                        <div className="flex gap-2 mt-0.5 flex-wrap">
                          {u.offer_7day_sent_at
                            ? <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">7-day ✓</span>
                            : <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">7-day pending</span>}
                          {u.offer_3day_sent_at
                            ? <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full">3-day ✓</span>
                            : <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">3-day pending</span>}
                          {u.offer_expiry_sent_at
                            ? <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">Expiry ✓</span>
                            : null}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Subscription</p>
                        <p className="capitalize">{u.subscription_status ?? "Trial"}</p>
                      </div>
                    </div>

                    {!hasUsage && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        This user has not started a conversation yet.
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
