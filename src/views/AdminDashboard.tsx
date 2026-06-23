import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { BarChart3, ShoppingCart, Settings, UserCheck, BookOpen, Mail, Sparkles, HelpCircle, Users, TrendingUp, Percent, Layers, ArrowRight, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { TrafficAnalytics } from "@/components/admin/TrafficAnalytics";
import { AmazonAnalytics } from "@/components/admin/AmazonAnalytics";
import { AmazonOrdersAnalytics } from "@/components/admin/AmazonOrdersAnalytics";
import { FbaInventoryTable } from "@/components/admin/FbaInventoryTable";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { DevicesAnalytics } from "@/components/admin/DevicesAnalytics";
import { UserBehaviorAnalytics } from "@/components/admin/UserBehaviorAnalytics";
import { PagesAnalytics } from "@/components/admin/PagesAnalytics";
import { AccessRequestsManagement } from "@/components/admin/AccessRequestsManagement";
import { BlogManagement } from "@/components/admin/BlogManagement";
import { FAQManagement } from "@/components/admin/FAQManagement";
import { CourseManagement } from "@/components/admin/CourseManagement";
import { ServantUsersManagement } from "@/components/admin/ServantUsersManagement";

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");
  const router = useRouter();

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["campaign-stats"],
    queryFn: async () => {
      // 1. Get total subscribers (customers)
      const { count: subscribersCount, error: subError } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

      // 2. Get active funnels
      const { count: funnelsCount, error: funnelsError } = await supabase
        .from("email_campaigns")
        .select("*", { count: "exact", head: true })
        .eq("campaign_type", "ai_funnel")
        .eq("status", "active");

      // 3. Get total sends
      const { count: totalSends, error: sendsError } = await supabase
        .from("email_sends")
        .select("*", { count: "exact", head: true })
        .in("status", ["sent", "delivered"]);

      // 4. Get total opens
      const { count: totalOpens, error: opensError } = await supabase
        .from("customer_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "open");

      // 5. Get total clicks
      const { count: totalClicks, error: clicksError } = await supabase
        .from("customer_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "click");

      if (subError) console.error("Error fetching subscribers count:", subError);
      if (funnelsError) console.error("Error fetching funnels count:", funnelsError);
      if (sendsError) console.error("Error fetching sends count:", sendsError);
      if (opensError) console.error("Error fetching opens count:", opensError);
      if (clicksError) console.error("Error fetching clicks count:", clicksError);

      const sends = totalSends || 0;
      const opens = totalOpens || 0;
      const clicks = totalClicks || 0;

      const openRate = sends > 0 ? (opens / sends) * 100 : 0;
      const clickRate = sends > 0 ? (clicks / sends) * 100 : 0;

      return {
        subscribers: subscribersCount || 0,
        activeFunnels: funnelsCount || 0,
        openRate: openRate.toFixed(1) + "%",
        clickRate: clickRate.toFixed(1) + "%",
      };
    },
    enabled: isAdmin
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/admin/login"); return; }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;

      if (!roleData) {
        toast({ variant: "destructive", title: "Access Denied", description: "You do not have admin privileges." });
        router.push("/");
        return;
      }
      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push("/admin/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncInventory = async () => {
    setIsSyncing(true);
    toast({ title: "Syncing Inventory", description: "Fetching live FBA quantities from Amazon SP-API..." });
    try {
      const { data, error } = await supabase.functions.invoke("sync-amazon-inventory");
      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);
      toast({ title: "Sync Complete!", description: data?.message || "Successfully aligned local database with FBA warehouse levels." });
    } catch (error: any) {
      toast({ title: "Sync Failed", description: error.message || "Could not synchronize with Amazon FBA.", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const tabs = [
    { id: "analytics",  label: "Core Analytics",  icon: <BarChart3 className="w-5 h-5" /> },
    { id: "ecommerce",  label: "E-Commerce",       icon: <ShoppingCart className="w-5 h-5" /> },
    { id: "servant",    label: "Servant Users",    icon: <Sparkles className="w-5 h-5" /> },
    { id: "marketing",  label: "Marketing",        icon: <Mail className="w-5 h-5" /> },
    { id: "lms",        label: "Learning (LMS)",   icon: <BookOpen className="w-5 h-5" /> },
    { id: "crm",        label: "CRM & System",     icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden pt-24">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/20 flex flex-col overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-1">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Serenity Scrolls</p>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-zinc-50/50 dark:bg-black/10">
          <div className="max-w-6xl mx-auto space-y-8">

            {activeTab === "analytics" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Core Analytics</h2>
                  <p className="text-muted-foreground">Traffic, pages, devices, and behavior tracking</p>
                </div>
                <TrafficAnalytics />
                <div className="grid lg:grid-cols-2 gap-6">
                  <PagesAnalytics timeRange="7d" />
                  <DevicesAnalytics timeRange="7d" />
                </div>
                <UserBehaviorAnalytics timeRange="7d" />
              </div>
            )}

            {activeTab === "ecommerce" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">E-Commerce & Inventory</h2>
                  <p className="text-muted-foreground">Amazon FBA sync and sales activity</p>
                </div>
                <div className="flex justify-between items-center bg-card border p-6 rounded-xl shadow-sm">
                  <div>
                    <h3 className="text-lg font-semibold">FBA Inventory Alignment</h3>
                    <p className="text-sm text-muted-foreground">Pull live stock quantities from Amazon to prevent out-of-stock orders.</p>
                  </div>
                  <Button onClick={handleSyncInventory} disabled={isSyncing} className="gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    {isSyncing ? "Syncing..." : "Sync FBA Inventory"}
                  </Button>
                </div>
                <FbaInventoryTable />
                <AmazonOrdersAnalytics />
                <AmazonAnalytics />
              </div>
            )}

            {activeTab === "servant" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ServantUsersManagement />
              </div>
            )}

            {activeTab === "marketing" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">Marketing & Content Hub</h2>
                    <p className="text-muted-foreground text-sm">
                      Synthesize AI-powered blogs, manage public FAQs, and launch high-converting email funnels.
                    </p>
                  </div>
                </div>

                <Tabs defaultValue="blog" className="w-full space-y-6">
                  <TabsList className="inline-flex h-11 items-center justify-start rounded-xl bg-muted/60 p-1 text-muted-foreground backdrop-blur-sm border border-border/40">
                    <TabsTrigger 
                      value="blog" 
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
                      SEAL Blog Engine
                    </TabsTrigger>
                    <TabsTrigger 
                      value="faq"
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <HelpCircle className="w-4 h-4 mr-2 text-indigo-500" />
                      FAQ Manager
                    </TabsTrigger>
                    <TabsTrigger 
                      value="email"
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <Mail className="w-4 h-4 mr-2 text-indigo-500" />
                      Email Campaigns
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="blog" className="space-y-6 outline-none animate-in fade-in duration-300">
                    <div className="bg-card rounded-2xl border p-6 shadow-sm">
                      <BlogManagement />
                    </div>
                  </TabsContent>

                  <TabsContent value="faq" className="space-y-6 outline-none animate-in fade-in duration-300">
                    <div className="bg-card rounded-2xl border p-6 shadow-sm">
                      <FAQManagement />
                    </div>
                  </TabsContent>

                  <TabsContent value="email" className="space-y-6 outline-none animate-in fade-in duration-300">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Metric 1 */}
                      <div className="bg-card rounded-xl border p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Subscribers</p>
                          <h3 className="text-2xl font-bold mt-1 group-hover:text-primary transition-colors">
                            {isLoadingStats ? (
                              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            ) : (
                              stats?.subscribers
                            )}
                          </h3>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            Total audience size
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                          <Users className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div className="bg-card rounded-xl border p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Avg. Open Rate</p>
                          <h3 className="text-2xl font-bold mt-1 group-hover:text-primary transition-colors">
                            {isLoadingStats ? (
                              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            ) : (
                              stats?.openRate
                            )}
                          </h3>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            Based on campaign sends
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div className="bg-card rounded-xl border p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Click Rate</p>
                          <h3 className="text-2xl font-bold mt-1 group-hover:text-primary transition-colors">
                            {isLoadingStats ? (
                              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            ) : (
                              stats?.clickRate
                            )}
                          </h3>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            Link clicks across dispatches
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                          <Percent className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Metric 4 */}
                      <div className="bg-card rounded-xl border p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Active Funnels</p>
                          <h3 className="text-2xl font-bold mt-1 group-hover:text-primary transition-colors">
                            {isLoadingStats ? (
                              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            ) : (
                              stats?.activeFunnels
                            )}
                          </h3>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            Active automated sequences
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                          <Layers className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Promo Banner CTA */}
                    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-8 md:p-10 shadow-lg">
                      <div className="absolute top-0 right-0 w-[40%] h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_70%)] pointer-events-none" />
                      <div className="relative z-10 max-w-2xl">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/25 border border-indigo-400/20 text-indigo-200 mb-4">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-300" /> Direct Integration Active
                        </span>
                        <h3 className="text-3xl font-bold tracking-tight mb-3">
                          Serenity Scrolls Marketing Suite
                        </h3>
                        <p className="text-indigo-100/80 text-base mb-6 leading-relaxed">
                          Synthesize high-converting 5-stage AI funnels, manage complex client segmentations based on user journal reflections, and dispatch one-off broadcasts to your audience.
                        </p>
                        
                        <div className="grid sm:grid-cols-2 gap-4 mb-8">
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span className="text-sm text-indigo-100/90">Automated course-progress triggers</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span className="text-sm text-indigo-100/90">AI newsletter copywriting assistant</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span className="text-sm text-indigo-100/90">Deep subscriber behavior analytics</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span className="text-sm text-indigo-100/90">Visual A/B sequence builder</span>
                          </div>
                        </div>

                        <Button 
                          size="lg" 
                          className="bg-white hover:bg-slate-100 text-indigo-950 font-semibold shadow-md group hover:shadow-indigo-500/20 transition-all gap-2"
                          onClick={() => router.push('/admin/campaigns/dashboard')}
                        >
                          Launch Campaign Console
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeTab === "lms" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Learning & Curriculum</h2>
                  <p className="text-muted-foreground">Manage courses, modules, and lessons</p>
                </div>
                <CourseManagement />
              </div>
            )}

            {activeTab === "crm" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">CRM & System Engine</h2>
                  <p className="text-muted-foreground">Admin control panel and user management</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" /> Admin Settings
                  </h3>
                  <AdminUserManagement />
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
