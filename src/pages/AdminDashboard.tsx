import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { BarChart3, Users, MousePointerClick, Clock, TrendingUp, ShoppingCart } from "lucide-react";
import { TrafficAnalytics } from "@/components/admin/TrafficAnalytics";
import { AmazonAnalytics } from "@/components/admin/AmazonAnalytics";

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
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="traffic" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Traffic Analytics
            </TabsTrigger>
            <TabsTrigger value="amazon" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Amazon Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="traffic" className="space-y-6">
            <TrafficAnalytics />
          </TabsContent>

          <TabsContent value="amazon" className="space-y-6">
            <AmazonAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
