import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
      if (data && !data.success) throw new Error(data.message);
      
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

        <Accordion type="single" collapsible defaultValue="analytics" className="w-full space-y-6">
          
          {/* Analytics Bucket */}
          <AccordionItem value="analytics" className="border rounded-xl bg-card shadow-sm px-6">
            <AccordionTrigger className="hover:no-underline py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">Core Analytics</h3>
                  <p className="text-sm text-muted-foreground font-normal">Traffic, pages, devices, and behavior tracking</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-8">
              <TrafficAnalytics />
              <div className="grid lg:grid-cols-2 gap-6">
                <PagesAnalytics timeRange="7d" />
                <DevicesAnalytics timeRange="7d" />
              </div>
              <UserBehaviorAnalytics timeRange="7d" />
            </AccordionContent>
          </AccordionItem>

          {/* E-Commerce Bucket */}
          <AccordionItem value="ecommerce" className="border rounded-xl bg-card shadow-sm px-6">
            <AccordionTrigger className="hover:no-underline py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">E-Commerce & Inventory</h3>
                  <p className="text-sm text-muted-foreground font-normal">Amazon FBA sync and sales activity</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-6">
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 border p-6 rounded-lg shadow-sm">
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
            </AccordionContent>
          </AccordionItem>

          {/* Marketing & Content Bucket */}
          <AccordionItem value="marketing" className="border rounded-xl bg-card shadow-sm px-6">
            <AccordionTrigger className="hover:no-underline py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-full">
                  <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">Marketing & Content</h3>
                  <p className="text-sm text-muted-foreground font-normal">Email campaigns, blog posts, and FAQs</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-8">
              <div className="flex flex-col items-center justify-center p-10 text-center border rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm mb-6">
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
            </AccordionContent>
          </AccordionItem>

          {/* CRM & System Bucket */}
          <AccordionItem value="crm" className="border rounded-xl bg-card shadow-sm px-6">
            <AccordionTrigger className="hover:no-underline py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-500/10 rounded-full">
                  <Settings className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">CRM & System Engine</h3>
                  <p className="text-sm text-muted-foreground font-normal">App access requests and admin control panel</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-8">
              <AccessRequestsManagement />
              <div className="border-t pt-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Admin Settings
                </h3>
                <AdminUserManagement />
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </div>
  );
}
