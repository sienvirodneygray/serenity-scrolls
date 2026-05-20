import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { BarChart3, ShoppingCart, Settings, UserCheck, BookOpen, Mail, Sparkles } from "lucide-react";
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

      <div className="flex-1 flex overflow-hidden pt-[72px]">
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
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Marketing & Content</h2>
                  <p className="text-muted-foreground">Email campaigns, blog posts, and FAQs</p>
                </div>
                <div className="flex flex-col items-center justify-center p-10 text-center border rounded-xl bg-card shadow-sm mb-6">
                  <Mail className="w-12 h-12 text-indigo-500 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Serenity Scrolls Marketing Suite</h2>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Enter the dedicated email platform to synthesize 5-stage AI funnels, manage complex client segmentations, and dispatch one-off broadcasts.
                  </p>
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => router.push('/admin/campaigns/dashboard')}>
                    Enter Email Platform
                  </Button>
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                  <BlogManagement />
                  <FAQManagement />
                </div>
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
                  <p className="text-muted-foreground">App access requests and admin control panel</p>
                </div>
                <AccessRequestsManagement />
                <div className="border-t pt-8">
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
