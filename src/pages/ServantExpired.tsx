import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Lock, Sparkles, ArrowRight, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const ServantExpired = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isTrialMode = searchParams.get("mode") === "trial";
    const [subscribing, setSubscribing] = useState(false);
    const [email, setEmail] = useState("");
    const [hasSession, setHasSession] = useState<boolean | null>(null);
    const { toast } = useToast();

    // Check if user is signed in on mount
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setHasSession(!!session);
            if (session?.user?.email) setEmail(session.user.email);
        });
    }, []);

    const handleSubscribe = async () => {
        if (!email || !email.includes("@")) {
            toast({
                variant: "destructive",
                title: "Email Required",
                description: "Please enter a valid email address to continue.",
            });
            return;
        }

        setSubscribing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || "";

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    },
                    body: JSON.stringify({
                        email: email,
                        userId: userId,
                        tier: isTrialMode ? "plus" : undefined,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create checkout session");
            }

            // Redirect to Stripe Checkout
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            console.error("Subscribe error:", error);
            toast({
                variant: "destructive",
                title: "Subscription Error",
                description: error.message || "Could not start checkout. Please try again.",
            });
        } finally {
            setSubscribing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 pt-32 pb-20">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <img src={logo} alt="Serenity Scrolls" className="h-16 w-auto" />
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
                                {isTrialMode ? "Start Your 7-Day Free Trial" : "Your Free Trial Has Ended"}
                            </CardTitle>
                            <CardDescription>
                                {isTrialMode 
                                    ? "Unlock advanced emotional intelligence, deeper theological insights, and full AI Servant capabilities."
                                    : "Your 30-day free access to Serenity Scrolls Servant has expired. Subscribe to continue your spiritual reflection journey."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* What you had access to */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                <h3 className="font-semibold text-sm">What you'll get with a subscription:</h3>
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

                            {/* Pricing */}
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
                                <p className="text-xs text-muted-foreground">
                                    {isTrialMode ? "Nothing billed for 7 days. Cancel anytime." : "Cancel anytime"}
                                </p>
                            </div>

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

                            <Button
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                                size="lg"
                                onClick={handleSubscribe}
                                disabled={subscribing || !email}
                            >
                                {subscribing ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Setting up checkout...</>
                                ) : (
                                    <>{isTrialMode ? "Start Free Trial" : "Subscribe Now"} <ArrowRight className="h-4 w-4 ml-1" /></>
                                )}
                            </Button>

                            <div className="text-center space-y-2">
                                <p className="text-xs text-muted-foreground">or</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate("/unlock")}
                                >
                                    {isTrialMode ? "Did you buy the Serenity Scrolls?" : "Enter a New Order ID"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <p className="text-xs text-muted-foreground text-center mt-4">
                        Questions? <a href="mailto:support@serenityscrolls.com" className="underline">Contact Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ServantExpired;
