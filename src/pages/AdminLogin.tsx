import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

const DEFAULT_EMAIL = "admin@serenityscrolls.com";
const DEFAULT_PASSWORD = "Admin123!";

export default function AdminLogin() {
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if any admin exists
    const checkAdminExists = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("id")
        .eq("role", "admin")
        .limit(1);
      
      if (!error && (!data || data.length === 0)) {
        setIsSetupMode(true);
      }
      setCheckingSetup(false);
    };
    
    checkAdminExists();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign up the admin user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: DEFAULT_EMAIL,
        password: DEFAULT_PASSWORD,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/login`
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create admin account");
      }

      // Add admin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "admin"
        });

      if (roleError) throw roleError;

      toast({
        title: "Admin account created!",
        description: "Signing you in...",
      });

      // Sign in immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: DEFAULT_EMAIL,
        password: DEFAULT_PASSWORD,
      });

      if (signInError) throw signInError;

      setIsSetupMode(false);
      navigate("/admin");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) throw roleError;

      if (!roleData) {
        await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have admin privileges.",
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "Redirecting to admin dashboard...",
      });
      
      navigate("/admin");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">
            {isSetupMode ? "Admin Setup" : "Admin Login"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSetupMode 
              ? "Create your admin account to get started"
              : "Enter your admin credentials to access the dashboard"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSetupMode ? (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Default Admin Credentials:</p>
                <p className="text-sm text-muted-foreground">Email: {DEFAULT_EMAIL}</p>
                <p className="text-sm text-muted-foreground">Password: {DEFAULT_PASSWORD}</p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating admin account..." : "Create Admin Account"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
