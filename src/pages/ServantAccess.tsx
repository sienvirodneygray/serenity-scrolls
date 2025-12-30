import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { CheckCircle, Clock, Send, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

type RequestStatus = "idle" | "submitting" | "pending" | "approved" | "denied";

const ServantAccess = () => {
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if email is in URL (from approval email link)
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
      checkExistingRequest(emailParam);
    }
  }, [searchParams]);

  const checkExistingRequest = async (emailToCheck: string) => {
    try {
      const { data, error } = await supabase
        .from("access_requests")
        .select("*")
        .eq("email", emailToCheck.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingRequest(data);
        if (data.status === "approved") {
          setStatus("approved");
        } else if (data.status === "pending") {
          setStatus("pending");
        } else if (data.status === "denied") {
          setStatus("denied");
        }
      }
    } catch (error) {
      console.error("Error checking request:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      // Check if already has an approved request
      const { data: existing } = await supabase
        .from("access_requests")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("status", "approved")
        .maybeSingle();

      if (existing) {
        setStatus("approved");
        setExistingRequest(existing);
        return;
      }

      // Check for pending request
      const { data: pendingReq } = await supabase
        .from("access_requests")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("status", "pending")
        .maybeSingle();

      if (pendingReq) {
        setStatus("pending");
        setExistingRequest(pendingReq);
        toast({
          title: "Request Already Submitted",
          description: "Your request is still being reviewed. We'll email you once approved!",
        });
        return;
      }

      // Submit new request
      const { data, error } = await supabase
        .from("access_requests")
        .insert({
          email: email.toLowerCase(),
          order_id: orderId,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      setExistingRequest(data);
      setStatus("pending");

      toast({
        title: "Request Submitted! 🙏",
        description: "We'll review your purchase and email you once approved.",
      });
    } catch (error: any) {
      console.error("Error submitting request:", error);
      setStatus("idle");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit request",
      });
    }
  };

  const handleAccessServant = async () => {
    // Create a temporary session for approved users
    try {
      const timestamp = Date.now();
      const tempEmail = `approved-${email.replace("@", "-at-")}-${timestamp}@serenityscrolls.temp`;
      const tempPassword = `approved-${timestamp}`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
      });

      if (authError) throw authError;

      // Update profile with access
      if (authData.user) {
        await supabase
          .from("profiles")
          .update({
            has_access: true,
            access_granted_at: new Date().toISOString(),
          })
          .eq("id", authData.user.id);
      }

      toast({
        title: "Access Granted! ✨",
        description: "Welcome to your AI Servant",
      });

      navigate("/servant");
    } catch (error: any) {
      console.error("Error creating session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create session. Please try again.",
      });
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
              Verify your purchase to unlock your spiritual companion
            </p>
          </div>

          {status === "approved" ? (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-green-600">Access Approved!</CardTitle>
                <CardDescription>
                  Your purchase has been verified. Click below to access your AI Servant.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleAccessServant} className="w-full" size="lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enter AI Servant
                </Button>
              </CardContent>
            </Card>
          ) : status === "pending" ? (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
                <CardTitle className="text-yellow-600">Request Pending</CardTitle>
                <CardDescription>
                  We're reviewing your purchase verification. You'll receive an email at <strong>{email}</strong> once approved.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  This usually takes less than 24 hours.
                </p>
              </CardContent>
            </Card>
          ) : status === "denied" ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-destructive">Request Not Approved</CardTitle>
                <CardDescription>
                  We couldn't verify your purchase. Please contact support or try again with the correct order details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => setStatus("idle")} className="w-full">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Verify Your Purchase</CardTitle>
                <CardDescription>
                  Enter your email and order ID from your purchase to request access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The email you used to purchase
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="orderId">Order ID / Confirmation Number</Label>
                    <Input
                      id="orderId"
                      type="text"
                      placeholder="e.g., 123-4567890-1234567"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      required
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Found in your order confirmation email
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={status === "submitting"}
                  >
                    {status === "submitting" ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit for Verification
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Have an access code instead?
                  </p>
                  <Button
                    variant="link"
                    onClick={() => navigate("/auth")}
                    className="px-0"
                  >
                    Enter Access Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServantAccess;
