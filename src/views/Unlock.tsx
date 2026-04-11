import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, BookOpen, HelpCircle, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

type UnlockStatus = "idle" | "verifying" | "success" | "error";

const Unlock = () => {
    const [orderId, setOrderId] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<UnlockStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [errorHint, setErrorHint] = useState("");
    const [daysRemaining, setDaysRemaining] = useState(30);
    const router = useRouter();
    const { toast } = useToast();

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

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Logo + Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img src={logo.src} alt="Serenity Scrolls" className="h-16 w-auto" />
                    </div>
                    <h1 className="text-2xl font-bold mb-1">Unlock Your AI Servant</h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your Amazon Order ID to start your free 30-day access
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
                ) : (
                    /* Input State */
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Verify Your Purchase</CardTitle>
                            <CardDescription>
                                Enter your Amazon Order ID and email to unlock access
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
                                    <Label htmlFor="orderId">Amazon Order ID</Label>
                                    <Input
                                        id="orderId"
                                        type="text"
                                        placeholder="123-4567890-1234567"
                                        value={orderId}
                                        onChange={(e) => setOrderId(e.target.value)}
                                        required
                                        className="font-mono"
                                        disabled={status === "verifying"}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                                        <HelpCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                        Found in your Amazon order confirmation email or under Your Orders
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

                            <div className="mt-6 text-center text-sm text-muted-foreground">
                                <p>
                                    Need help?{" "}
                                    <a href="mailto:support@serenityscrolls.com" className="underline hover:text-foreground">
                                        Contact Support
                                    </a>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground text-center mt-4">
                    By unlocking access, you agree to our terms of service.
                    Each Amazon Order ID can only be redeemed once.
                </p>
            </div>
        </div>
    );
};

export default Unlock;
