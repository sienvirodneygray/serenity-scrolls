import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, ShieldCheck, ShieldAlert, Trash2, Users, Clock, CheckCircle, Sparkles } from "lucide-react";

interface Redemption {
  id: string;
  email: string;
  order_id: string | null;
  status?: string;
  verification_method: string | null;
  redemption_count: number | null;
  max_redemptions?: number | null;
  activated_at: string | null;
  access_expires_at?: string | null;
  subscription_status?: string | null;
  offer_7day_sent_at?: string | null;
  access_granted_at?: string | null;
  created_at?: string;
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function VerificationBadge({ method }: { method: string | null }) {
  if (method === "sp-api")
    return <Badge className="bg-green-600 text-white gap-1"><ShieldCheck className="w-3 h-3" /> SP-API</Badge>;
  if (method === "promo-code")
    return <Badge className="bg-purple-600 hover:bg-purple-700 text-white gap-1"><Sparkles className="w-3 h-3" /> Promo Code</Badge>;
  if (method === "format-only")
    return <Badge variant="secondary" className="gap-1"><ShieldAlert className="w-3 h-3" /> Format Only</Badge>;
  return <Badge variant="outline">Unknown</Badge>;
}

function TrialBadge({ expiresAt, subscriptionStatus }: { expiresAt: string | null | undefined; subscriptionStatus: string | null | undefined }) {
  if (subscriptionStatus === "active")
    return <Badge className="bg-blue-600 text-white">Subscribed</Badge>;
  const days = daysUntil(expiresAt);
  if (days === null) return <Badge variant="outline">—</Badge>;
  if (days < 0) return <Badge variant="destructive">Expired {Math.abs(days)}d ago</Badge>;
  if (days <= 3) return <Badge className="bg-orange-500 text-white">{days}d left</Badge>;
  return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{days}d left</Badge>;
}

export function AccessRequestsManagement() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-servant-users`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load users");
      setRedemptions(json.users as Redemption[]);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to load redemptions" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (r: Redemption) => {
    if (!r.order_id) {
      toast({ variant: "destructive", title: "Cannot delete", description: "No access_requests record for this user — remove via Supabase dashboard." });
      return;
    }
    if (!confirm(`Delete redemption for ${r.email}?\nThis allows the order ID to be reused.`)) return;
    setDeletingId(r.id);
    try {
      const { error } = await supabase.from("access_requests").delete().eq("id", r.id);
      if (error) throw error;
      toast({ title: "Deleted", description: `Redemption for ${r.email} removed.` });
      load();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  const real = redemptions.filter(r => r.verification_method === "sp-api");
  const manual = redemptions.filter(r => r.verification_method === "manual");
  const promos = redemptions.filter(r => r.verification_method === "promo-code");
  const tests = redemptions.filter(r => r.verification_method === "format-only");

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
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6" /> Servant Redemptions</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Amazon order verifications and trial access tracking</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{real.length + manual.length + promos.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Active Users</p>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{redemptions.filter(r => r.subscription_status === "active").length}</p>
          <p className="text-xs text-muted-foreground mt-1">Subscribed</p>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-orange-500">{redemptions.filter(r => { const d = daysUntil(r.access_expires_at); return d !== null && d >= 0 && d <= 7 && r.subscription_status !== "active"; }).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Expiring Soon</p>
        </div>
      </div>

      {/* Real Redemptions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="w-4 h-4 text-green-600" /> Active Users ({real.length + manual.length + promos.length})
          </CardTitle>
          <CardDescription>All users with active Servant access</CardDescription>
        </CardHeader>
        <CardContent>
          {(real.length + manual.length + promos.length) === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">No active users yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 px-3 font-medium">Customer</th>
                    <th className="text-left py-2 px-3 font-medium">Order ID</th>
                    <th className="text-left py-2 px-3 font-medium">Verified</th>
                    <th className="text-left py-2 px-3 font-medium">Trial</th>
                    <th className="text-left py-2 px-3 font-medium">Offer Sent</th>
                    <th className="text-left py-2 px-3 font-medium">Activated</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {[...real, ...manual, ...promos].map(r => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3">
                        <p className="font-medium">{r.email}</p>
                        <span className="text-[10px] text-green-600 font-medium">● active</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{r.order_id ?? <span className="italic">manual</span>}</td>
                      <td className="py-3 px-3"><VerificationBadge method={r.verification_method} /></td>
                      <td className="py-3 px-3"><TrialBadge expiresAt={r.access_expires_at} subscriptionStatus={r.subscription_status ?? null} /></td>
                      <td className="py-3 px-3">
                        {r.offer_7day_sent_at
                          ? <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Sent</span>
                          : <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>}
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground">
                        {r.activated_at ? new Date(r.activated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="py-3 px-3">
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === r.id}
                          onClick={() => handleDelete(r)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test / Format-only */}
      {tests.length > 0 && (
        <Card className="border-dashed opacity-70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
              <ShieldAlert className="w-4 h-4" /> Test / Format-Only Records ({tests.length})
            </CardTitle>
            <CardDescription>Format-only verification — not confirmed real orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tests.map(r => (
                <div key={r.id} className="flex items-center justify-between border rounded-lg px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-4">
                    <VerificationBadge method={r.verification_method} />
                    <div>
                      <p className="font-medium">{r.email}</p>
                      <p className="text-xs font-mono text-muted-foreground">{r.order_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</span>
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      disabled={deletingId === r.id}
                      onClick={() => handleDelete(r)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
