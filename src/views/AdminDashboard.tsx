import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { BarChart3, ShoppingCart, Settings, Monitor, MousePointer, FileText, UserCheck, BookOpen, HelpCircle, Mail } from "lucide-react";
import { TrafficAnalytics } from "@/components/admin/TrafficAnalytics";
import { AmazonAnalytics } from "@/components/admin/AmazonAnalytics";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { DevicesAnalytics } from "@/components/admin/DevicesAnalytics";
import { UserBehaviorAnalytics } from "@/components/admin/UserBehaviorAnalytics";
import { PagesAnalytics } from "@/components/admin/PagesAnalytics";
import { AccessRequestsManagement } from "@/components/admin/AccessRequestsManagement";
import { BlogManagement } from "@/components/admin/BlogManagement";
import { FAQManagement } from "@/components/admin/FAQManagement";

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/admin/login");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;

      if (!roleData) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have admin privileges.",
        });
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
    toast({
      title: "Syncing Inventory",
      description: "Fetching live FBA quantities from Amazon SP-API...",
    });

    try {
      const { data, error } = await supabase.functions.invoke("sync-amazon-inventory");
      
      if (error) throw error;
      
      toast({
        title: "Sync Complete!",
        description: data?.message || "Successfully aligned local database with FBA warehouse levels.",
      });
    } catch (error: any) {
      console.error("FBA Sync Error:", error);
      toast({
        title: "Sync Failed",
        description: error.message || "Could not synchronize with Amazon FBA.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Analytics and insights for Serenity Scrolls
          </p>
        </div>

        <Tabs defaultValue="traffic" className="space-y-6">
          <TabsList className="flex flex-wrap justify-center mx-auto gap-1 mb-8 bg-zinc-100/50 dark:bg-zinc-900/50 p-2 rounded-xl">
            {/* Core */}
            <TabsTrigger value="traffic" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            
            {/* E-commerce & Marketing */}
            <TabsTrigger value="amazon" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Amazon FBA
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2 text-primary font-semibold">
              <Mail className="h-4 w-4" />
              Email Marketing
            </TabsTrigger>
            
            {/* CRM & Content */}
            <TabsTrigger value="access" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              App Access
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Blog / Content
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>

            {/* Deep Analytics */}
            <TabsTrigger value="pages" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pages Data
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Behavior
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Devices
            </TabsTrigger>
            
            {/* System */}
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="traffic" className="space-y-6">
            <TrafficAnalytics />
          </TabsContent>

          <TabsContent value="amazon" className="space-y-6">
            <div className="flex justify-between items-center bg-card p-6 rounded-lg border border-border shadow-sm">
              <div>
                <h3 className="text-lg font-semibold">FBA Inventory Alignment</h3>
                <p className="text-sm text-muted-foreground">Pull live stock quantities from Amazon to prevent out-of-stock orders.</p>
              </div>
              <Button onClick={handleSyncInventory} disabled={isSyncing} className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                {isSyncing ? "Syncing..." : "Sync FBA Inventory"}
              </Button>
            </div>
            <AmazonAnalytics />
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-zinc-50 dark:bg-zinc-900 shadow-sm">
              <Mail className="w-12 h-12 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Serenity Scrolls Marketing Suite</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Enter the dedicated email platform to synthesize 5-stage AI funnels, manage complex client segmentations, and dispatch one-off broadcasts.
              </p>
              <Button size="lg" onClick={() => router.push('/admin/campaigns/dashboard')}>
                Enter Email Platform
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <AccessRequestsManagement />
          </TabsContent>

          <TabsContent value="blog" className="space-y-6">
            <BlogManagement />
          </TabsContent>

          <TabsContent value="faq" className="space-y-6">
            <FAQManagement />
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <PagesAnalytics timeRange="7d" />
          </TabsContent>

          <TabsContent value="behavior" className="space-y-6">
            <UserBehaviorAnalytics timeRange="7d" />
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            <DevicesAnalytics timeRange="7d" />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <AdminUserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
