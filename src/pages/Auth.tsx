import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

const Auth = () => {
  const [productCode, setProductCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleProductCodeAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if code exists and is not redeemed
      const { data: codeData, error: codeError } = await supabase
        .from("access_codes")
        .select("*")
        .eq("code", productCode)
        .eq("is_redeemed", false)
        .single();

      if (codeError || !codeData) {
        throw new Error("Invalid or already redeemed product code");
      }

      // Create account with product code
      const tempEmail = `${productCode}@serenityscrolls.temp`;
      const tempPassword = `${productCode}-${Date.now()}`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
      });

      if (authError) throw authError;

      // Mark code as redeemed
      await supabase
        .from("access_codes")
        .update({
          is_redeemed: true,
          redeemed_by: authData.user?.id,
          redeemed_at: new Date().toISOString(),
        })
        .eq("code", productCode);

      // Update profile
      await supabase
        .from("profiles")
        .update({
          has_access: true,
          access_granted_at: new Date().toISOString(),
        })
        .eq("id", authData.user?.id);

      await supabase.from("analytics_events").insert({
        event_name: "code_redeemed",
        properties: { code: productCode },
      });

      toast({
        title: "Access granted! ✨",
        description: "Your product code has been activated.",
      });

      navigate("/servant");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-hero)]">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Serenity Scrolls" className="h-20 w-auto" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Access AI Servant</h1>
            <p className="text-muted-foreground">
              Enter your product code to unlock your spiritual companion
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Enter Product Code</CardTitle>
              <CardDescription>
                Find your unique code inside your Serenity Scrolls Reflection Journal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProductCodeAuth} className="space-y-4">
                <div>
                  <Label htmlFor="product-code">Access Code</Label>
                  <Input
                    id="product-code"
                    type="text"
                    placeholder="Enter your code"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value.toUpperCase())}
                    required
                    className="text-center text-lg font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Your code can be found in your journal or tube product
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Activate Access"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Don't have a product yet?
                </p>
                <Button
                  variant="link"
                  onClick={() => navigate("/")}
                  className="px-0"
                >
                  Shop Serenity Scrolls
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
