import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Lock, Sparkles, ArrowRight, BookOpen, Loader2, Zap, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const ServantExpired = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params set by email links:
  //   ?plan=monthly&offer=true  → 7-day exclusive (10% off monthly + annual)
  //   ?plan=annual              → annual plan only
  //   ?plan=monthly             → 3-day (standard monthly, no offer)
  //   (none)                    → show both standard options
  const planParam = searchParams.get("plan") as "monthly" | "annual" | null;
  const hasOffer = searchParams.get("offer") === "true";
  const isTrialMode = searchParams.get("mode") === "trial";

  const [subscribing, setSubscribing] = useState<"monthly" | "annual" | null>(null);
  const [email, setEmail] = useState("");
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      if (session?.user?.email) setEmail(session.user.email);
    });
  }, []);

  const handleSubscribe = async (plan: "monthly" | "annual") => {
    if (!email || !email.includes("@")) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter a valid email address to continue.",
      });
      return;
    }

    setSubscribing(plan);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || "";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            email,
            userId,
            plan,
            // Apply coupon only when coming from 7-day exclusive offer + monthly
            coupon: hasOffer && plan === "monthly" ? "SERENITY10" : undefined,
            tier: isTrialMode ? "plus" : undefined,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create checkout session");
      if (data.url) window.location.href = data.url;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Subscription Error",
        description: error.message || "Could not start checkout. Please try again.",
      });
    } finally {
      setSubscribing(null);
    }
  };

  // Determine what to render based on URL params
  // showBoth: no plan param, or unexpected → show both plan cards (standard)
  const showBoth = !planParam && !isTrialMode;
  // showOffer: ?offer=true with ?plan=monthly → show discounted monthly + annual
  const showExclusiveOffer = hasOffer && planParam === "monthly";
  // showMonthlyOnly: ?plan=monthly without offer → just monthly standard
  const showMonthlyOnly = planParam === "monthly" && !hasOffer;
  // showAnnualOnly: ?plan=annual → just annual
  const showAnnualOnly = planParam === "annual";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={logo.src} alt="Serenity Scrolls" className="h-16 w-auto" />
            </div>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                {isTrialMode ? (
                  <Sparkles className="w-8 h-8 text-amber-600" />
                ) : (
                  <Lock className="w-8 h-8 text-amber-600" />
                )}
              </div>
              <CardTitle>
                {isTrialMode
                  ? "Start Your 7-Day Free Trial"
                  : showExclusiveOffer
                  ? "🎁 Your Exclusive Offer"
                  : "Your Free Trial Has Ended"}
              </CardTitle>
              <CardDescription>
                {isTrialMode
                  ? "Unlock advanced emotional intelligence, deeper theological insights, and full AI Servant capabilities."
                  : showExclusiveOffer
                  ? "You've unlocked a special deal — valid only while your trial is active."
                  : "Subscribe to continue your spiritual reflection journey with the Serenity Scrolls Servant."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* What's included */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">What's included with every subscription:</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Servant 1.0</strong> — Scripture Snapshots, reflections, journal prompts, and daily guidance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                    <span><strong>Servant+ 2.0</strong> — EQ-informed reflections, virtue mapping, and the Serenity Leadership Framework</span>
                  </li>
                </ul>
              </div>

              {/* ── EXCLUSIVE OFFER: 7-day — discounted monthly + annual ── */}
              {showExclusiveOffer && (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {/* Monthly 10% off */}
                    <div className="bg-gradient-to-b from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 rounded-xl border border-amber-200 dark:border-amber-700 p-4 flex flex-col gap-2">
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Monthly — 10% Off</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-muted-foreground line-through">$19.99</span>
                        <span className="text-2xl font-bold">$17.99</span>
                        <span className="text-xs text-muted-foreground">/mo</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Cancel anytime</p>
                      <Button
                        className="mt-auto w-full bg-amber-600 hover:bg-amber-700 text-white"
                        size="sm"
                        onClick={() => handleSubscribe("monthly")}
                        disabled={subscribing !== null || !email}
                      >
                        {subscribing === "monthly" ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Loading...</>
                        ) : (
                          <>Claim 10% Off <ArrowRight className="h-3.5 w-3.5 ml-1" /></>
                        )}
                      </Button>
                    </div>

                    {/* Annual — 4 months free */}
                    <div className="bg-gradient-to-b from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 rounded-xl border-2 border-amber-400 dark:border-amber-600 p-4 flex flex-col gap-2 relative">
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">BEST VALUE</span>
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Annual — 4 Months Free</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-muted-foreground line-through">$239.88</span>
                        <span className="text-2xl font-bold">$19.99</span>
                        <span className="text-xs text-muted-foreground">/mo</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Billed $159.92/yr · Save $79.96</p>
                      <Button
                        className="mt-auto w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        size="sm"
                        onClick={() => handleSubscribe("annual")}
                        disabled={subscribing !== null || !email}
                      >
                        {subscribing === "annual" ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Loading...</>
                        ) : (
                          <>Get Annual <Zap className="h-3.5 w-3.5 ml-1" /></>
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">
                    ⏳ Exclusive pricing — only valid while your trial is active
                  </p>
                </div>
              )}

              {/* ── MONTHLY ONLY: 3-day no-discount ── */}
              {showMonthlyOnly && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-5 text-center space-y-3">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Continue your journey</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">$19.99</span>
                    <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-full font-medium">/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Cancel anytime · Billed monthly</p>
                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    size="lg"
                    onClick={() => handleSubscribe("monthly")}
                    disabled={subscribing !== null || !email}
                  >
                    {subscribing === "monthly" ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Setting up checkout...</>
                    ) : (
                      <>Subscribe Now <ArrowRight className="h-4 w-4 ml-1" /></>
                    )}
                  </Button>
                </div>
              )}

              {/* ── ANNUAL ONLY ── */}
              {showAnnualOnly && (
                <div className="bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-5 text-center space-y-3 relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-amber-500 text-white px-3 py-0.5 rounded-full">4 MONTHS FREE</span>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Annual Plan</p>
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-0.5">
                      <span className="text-sm text-muted-foreground line-through">$239.88/yr</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-3xl font-bold text-amber-700 dark:text-amber-300">$19.99</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Billed as $159.92/year · Save $79.96</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      "Full access to Servant 1.0 & 2.0",
                      "Save $79.96 vs monthly",
                      "Priority support",
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-left">
                        <CheckCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    size="lg"
                    onClick={() => handleSubscribe("annual")}
                    disabled={subscribing !== null || !email}
                  >
                    {subscribing === "annual" ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Setting up checkout...</>
                    ) : (
                      <>Get Annual Plan <Zap className="h-4 w-4 ml-1" /></>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">Or{" "}
                    <button
                      onClick={() => handleSubscribe("monthly")}
                      className="underline underline-offset-2 text-amber-600 hover:text-amber-800"
                    >
                      subscribe monthly at $19.99/mo
                    </button>
                  </p>
                </div>
              )}

              {/* ── BOTH: default / trial mode ── */}
              {(showBoth || isTrialMode) && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                      {isTrialMode ? "Start for free today" : "Continue your journey"}
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {!isTrialMode && <span className="text-sm text-muted-foreground line-through">$39.99</span>}
                      <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                        {isTrialMode ? "$29.99" : "$19.99"}
                      </span>
                      <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-full font-medium">/mo</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {isTrialMode ? "Nothing billed for 7 days. Cancel anytime." : "Cancel anytime"}
                    </p>
                    <Button
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                      size="lg"
                      onClick={() => handleSubscribe("monthly")}
                      disabled={subscribing !== null || !email}
                    >
                      {subscribing === "monthly" ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Setting up checkout...</>
                      ) : (
                        <>{isTrialMode ? "Start Free Trial" : "Subscribe Now"} <ArrowRight className="h-4 w-4 ml-1" /></>
                      )}
                    </Button>
                  </div>
                  {!isTrialMode && (
                    <button
                      onClick={() => handleSubscribe("annual")}
                      disabled={subscribing !== null || !email}
                      className="w-full text-sm text-center text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 underline underline-offset-2 transition-colors py-1"
                    >
                      {subscribing === "annual" ? "Loading..." : "Or save with Annual — $159.92/yr (4 months free)"}
                    </button>
                  )}
                </div>
              )}

              {/* Email input for unauthenticated users */}
              {hasSession === false && (
                <div className="space-y-1.5">
                  <label htmlFor="subscribe-email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <input
                    id="subscribe-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/unlock")}
                >
                  {isTrialMode ? "Did you buy the Serenity Scrolls?" : "Enter a New Order ID"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Questions?{" "}
            <a href="mailto:support@serenityscrolls.com" className="underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServantExpired;
