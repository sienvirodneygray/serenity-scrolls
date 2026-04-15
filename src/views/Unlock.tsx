import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, BookOpen, HelpCircle, Sparkles, Mail, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

type UnlockStatus = "idle" | "verifying" | "success" | "error";
type PageMode = "new" | "returning" | "magic-sent";

const Unlock = () => {
    const [orderId, setOrderId] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<UnlockStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [errorHint, setErrorHint] = useState("");
    const [daysRemaining, setDaysRemaining] = useState(30);
    const [mode, setMode] = useState<PageMode>("new");
    const [checkingSession, setCheckingSession] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    // Pre-fill from checkout success redirect
    useEffect(() => {
        const prefillOrder = searchParams?.get("prefill_order");
        const prefillEmail = searchParams?.get("prefill_email");
        if (prefillOrder) setOrderId(prefillOrder);
        if (prefillEmail) setEmail(prefillEmail);
    }, [searchParams]);

    // Handle custom magic token from branded email login
    useEffect(() => {
        const handleMagicToken = async () => {
            if (typeof window === 'undefined') return;

            const params = new URLSearchParams(window.location.search);
            const token = params.get("magic_token");
            if (token) {
                setCheckingSession(true);
                try {
                    const { error } = await supabase.auth.verifyOtp({
                        type: "magiclink",
                        token_hash: token,
                    });

                    if (!error) {
                        router.push("/servant");
                    } else {
                        router.replace("/unlock");
                        toast({
                            title: "Link Expired",
                            description: "Your login link has expired or is invalid. Please request a new one.",
                            variant: "destructive",
                        });
                    }
                } catch (e) {
                    router.replace("/unlock");
                }
                setCheckingSession(false);
            }
        };
        handleMagicToken();
    }, [router, toast]);

    // Auto-redirect if user already has an active session with access
    useEffect(() => {
        const checkExistingSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("has_access, access_expires_at, subscription_status")
                        .eq("id", session.user.id)
                        .single();

                    if (profile?.has_access) {
                        const isExpired = profile.access_expires_at
                            && new Date(profile.access_expires_at) < new Date()
                            && profile.subscription_status !== "active";

                        if (!isExpired) {
                            router.push("/servant");
                            return;
                        }
                    }
                }
            } catch (e) {
                // Silently continue to unlock page
            }
            setCheckingSession(false);
        };
        checkExistingSession();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("verifying");
        setErrorMessage("");
        setErrorHint("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify-order`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
                    },
                    body: JSON.stringify({
                        orderId: orderId.trim(),
                        email: email.trim().toLowerCase(),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setStatus("error");
                setErrorMessage(data.error || "Verification failed. Please try again.");
                setErrorHint(data.hint || "");
                return;
            }

            // Success — sign in the user seamlessly
            if (data.email && data.token) {
                const { error: authError } = await supabase.auth.verifyOtp({
                    type: "magiclink",
                    token_hash: data.token,
                });

                if (authError) {
                    console.error("Seamless auto-login failed. User will need to login manually:", authError);
                }
            }

            setDaysRemaining(data.daysRemaining || 30);
            setStatus("success");

            toast({
                title: "Access Granted! 🎉",
                description: "Your 30-day free trial has started.",
            });
        } catch (error) {
            console.error("Verification error:", error);
            setStatus("error");
            setErrorMessage("Something went wrong. Please try again.");
        }
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("verifying");
        setErrorMessage("");

        try {
            const trimmedEmail = email.trim().toLowerCase();

            // Step 1: Verify this email belongs to a real customer with active access
            const checkRes = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify-order`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
                    },
                    body: JSON.stringify({
                        email: trimmedEmail,
                        mode: "check-email",
                    }),
                }
            );

            const checkData = await checkRes.json();

            if (!checkRes.ok || !checkData.verified) {
                setStatus("error");
                setErrorMessage(checkData.error || "Could not verify this email. Please use the 'New User' tab.");
                return;
            }

            // Step 2: Email is confirmed — now send the custom magic link
            const sendRes = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-magic-link`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
                    },
                    body: JSON.stringify({
                        email: trimmedEmail,
                        origin: window.location.origin,
                    }),
                }
            );

            if (!sendRes.ok) {
                setStatus("error");
                setErrorMessage("Could not send login link. Please try again.");
                return;
            }

            setMode("magic-sent");
            setStatus("idle");
        } catch (error) {
            console.error("Magic link error:", error);
            setStatus("error");
            setErrorMessage("Something went wrong. Please try again.");
        }
    };

    // Show loading while checking session
    if (checkingSession) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Logo + Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img src={logo.src} alt="Serenity Scrolls" className="h-16 w-auto" />
                    </div>
                    <h1 className="text-2xl font-bold mb-1">
                        {mode === "returning" || mode === "magic-sent" ? "Welcome Back" : "Unlock Your AI Servant"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {mode === "returning"
                            ? "Sign in with your email to continue where you left off"
                            : mode === "magic-sent"
                                ? "Check your inbox for the login link"
                                : "Enter your Order ID to start your free 30-day access"}
                    </p>
                </div>

                {status === "success" ? (
                    /* Success State */
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <CardTitle className="text-green-600">Access Granted!</CardTitle>
                            <CardDescription>
                                Your 30-day free trial has started. You have <strong>{daysRemaining} days</strong> of access to Servant 1.0.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Quick Guide */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                                    <BookOpen className="h-4 w-4" />
                                    How to Use Your Servant
                                </h3>
                                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                                    <li><strong>Draw a scroll</strong> from your tube based on your mood or color.</li>
                                    <li><strong>Tell the Servant</strong> your mood, scroll name, or color.</li>
                                    <li><strong>Receive</strong> a Scripture Snapshot, reflection, journal prompts, and one small step.</li>
                                    <li><strong>Journal your thoughts</strong> using the prompts provided.</li>
                                </ol>
                            </div>

                            <Button onClick={() => router.push("/servant")} className="w-full" size="lg">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Enter Servant 1.0
                            </Button>

                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-center">
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    <Sparkles className="w-3 h-3 inline mr-1" />
                                    Want deeper reflections? Upgrade to <strong>Servant+</strong> for EQ-informed insights.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : mode === "magic-sent" ? (
                    /* Magic Link Sent State */
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <Mail className="w-8 h-8 text-blue-600" />
                            </div>
                            <CardTitle className="text-blue-600">Check Your Email</CardTitle>
                            <CardDescription>
                                We sent a login link to <strong>{email}</strong>. Click the link to sign in and access your Servant.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted/50 rounded-lg p-4">
                                <p className="text-sm text-muted-foreground text-center">
                                    Didn't receive the email? Check your spam folder or try again in a few minutes.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => { setMode("returning"); setStatus("idle"); }}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Mode Toggle */}
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 mb-6">
                            <button
                                onClick={() => { setMode("new"); setStatus("idle"); setErrorMessage(""); }}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${mode === "new"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                New User
                            </button>
                            <button
                                onClick={() => { setMode("returning"); setStatus("idle"); setErrorMessage(""); }}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${mode === "returning"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Mail className="h-3.5 w-3.5" />
                                Welcome Back
                            </button>
                        </div>

                        {mode === "new" ? (
                            /* New User — Order ID Verification */
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Verify Your Purchase</CardTitle>
                                    <CardDescription>
                                        Enter your Order ID and email to unlock access
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
                                                disabled={status === "verifying"}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="orderId">Order ID</Label>
                                            <Input
                                                id="orderId"
                                                type="text"
                                                placeholder="SS-20260416-1234 or 123-4567890-1234567"
                                                value={orderId}
                                                onChange={(e) => setOrderId(e.target.value)}
                                                required
                                                className="font-mono"
                                                disabled={status === "verifying"}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                                                <HelpCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                                Found in your order confirmation email (SS-... for website orders, 123-... for Amazon)
                                            </p>
                                        </div>

                                        {/* Error Display */}
                                        {status === "error" && (
                                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                                <p className="text-sm text-destructive font-medium">{errorMessage}</p>
                                                {errorHint && (
                                                    <p className="text-xs text-muted-foreground mt-1">{errorHint}</p>
                                                )}
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            size="lg"
                                            disabled={status === "verifying"}
                                        >
                                            {status === "verifying" ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                "Unlock Access"
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        ) : (
                            /* Returning User — Magic Link */
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Sign Back In</CardTitle>
                                    <CardDescription>
                                        Enter your email and we'll send you a link to access your Servant instantly
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleMagicLink} className="space-y-4">
                                        <div>
                                            <Label htmlFor="returning-email">Email Address</Label>
                                            <Input
                                                id="returning-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                disabled={status === "verifying"}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Use the same email you used when you first unlocked access.
                                            </p>
                                        </div>

                                        {status === "error" && (
                                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                                <p className="text-sm text-destructive font-medium">{errorMessage}</p>
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            size="lg"
                                            disabled={status === "verifying"}
                                        >
                                            {status === "verifying" ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Mail className="w-4 h-4 mr-2" />
                                                    Send Login Link
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {/* Footer */}
                <div className="text-center mt-6 space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Need help?{" "}
                        <a href="mailto:support@serenityscrolls.com" className="underline hover:text-foreground">
                            Contact Support
                        </a>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        By unlocking access, you agree to our terms of service.
                        Each Order ID can only be redeemed once.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Unlock;

