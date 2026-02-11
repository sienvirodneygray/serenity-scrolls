import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { BarChart3, ShoppingCart, Settings, Monitor, MousePointer, FileText, UserCheck, BookOpen, HelpCircle, Rocket } from "lucide-react";
import { TrafficAnalytics } from "@/components/admin/TrafficAnalytics";
import { AmazonAnalytics } from "@/components/admin/AmazonAnalytics";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { DevicesAnalytics } from "@/components/admin/DevicesAnalytics";
import { UserBehaviorAnalytics } from "@/components/admin/UserBehaviorAnalytics";
import { PagesAnalytics } from "@/components/admin/PagesAnalytics";
import { AccessRequestsManagement } from "@/components/admin/AccessRequestsManagement";
import { BlogManagement } from "@/components/admin/BlogManagement";
import { FAQManagement } from "@/components/admin/FAQManagement";
import { SEOAuthorityEngine } from "@/components/admin/SEOAuthorityEngine";

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin/login");
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
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/admin/login");
    } finally {
      setIsLoading(false);
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
          <TabsList className="flex flex-wrap justify-center mx-auto gap-1">
            <TabsTrigger value="traffic" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="access" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Access
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Devices
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Behavior
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="amazon" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Amazon
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Website SEAL
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="seo-engine" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              SEO Engine
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="traffic" className="space-y-6">
            <TrafficAnalytics />
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <AccessRequestsManagement />
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            <DevicesAnalytics timeRange="7d" />
          </TabsContent>

          <TabsContent value="behavior" className="space-y-6">
            <UserBehaviorAnalytics timeRange="7d" />
          </TabsContent>

          <TabsContent value="pages" className="space-y-6">
            <PagesAnalytics timeRange="7d" />
          </TabsContent>

          <TabsContent value="amazon" className="space-y-6">
            <AmazonAnalytics />
          </TabsContent>

          <TabsContent value="blog" className="space-y-6">
            <BlogManagement />
          </TabsContent>

          <TabsContent value="faq" className="space-y-6">
            <FAQManagement />
          </TabsContent>

          <TabsContent value="seo-engine" className="space-y-6">
            <SEOAuthorityEngine />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <AdminUserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
