import { useState, useRef, useEffect } from "react";
import { renderMarkdown } from "@/components/ChatMarkdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import {
    Send, Loader2, Sparkles, BookOpen, ArrowRight, Lock, Clock,
    CheckCircle, HelpCircle, ChevronRight, CreditCard, Star
} from "lucide-react";
import logo from "@/assets/logo.png";

type Message = {
    role: "user" | "assistant";
    content: string;
};

type Phase = "unlock" | "servant" | "upgrade" | "expired";

const ServantTestFlow = () => {
    // Phase state
    const [phase, setPhase] = useState<Phase>("unlock");

    // Unlock state
    const [orderId, setOrderId] = useState("");
    const [email, setEmail] = useState("");
    const [unlockStatus, setUnlockStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
    const [unlockError, setUnlockError] = useState("");
    const [upsellDismissed, setUpsellDismissed] = useState(false);
    const [unlockHint, setUnlockHint] = useState("");
    const [upgradeStatus, setUpgradeStatus] = useState<"idle" | "processing" | "success">("idle");

    // Servant state
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [version, setVersion] = useState<"1.0" | "2.0">("1.0");
    const [daysRemaining, setDaysRemaining] = useState(30);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const userMessageCount = messages.filter(m => m.role === "user").length;

    // --- UNLOCK ---
    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setUnlockStatus("verifying");
        setUnlockError("");
        setUnlockHint("");

        const pattern = /^\d{3}-\d{7}-\d{7}$/;
        if (!pattern.test(orderId.trim())) {
            setUnlockStatus("error");
            setUnlockError("Invalid Order ID format. Amazon Order IDs look like: 123-4567890-1234567");
            setUnlockHint("You can find your Order ID in your Amazon order confirmation email.");
            return;
        }

        if (!email.trim()) {
            setUnlockStatus("error");
            setUnlockError("Please enter your email address.");
            return;
        }

        // Simulate verification delay
        await new Promise(r => setTimeout(r, 1800));
        setUnlockStatus("success");
        toast.success("Access granted! Your 30-day free trial has started.");
    };

    // --- CHAT ---
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput("");
        const updatedMessages = [...messages, { role: "user" as const, content: userMsg }];
        setMessages(updatedMessages);
        setLoading(true);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    },
                    body: JSON.stringify({
                        messages: updatedMessages,
                        message: userMsg,
                        version,
                    }),
                }
            );

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error("Chat error:", response.status, errData);
                toast.error(`Chat error: ${errData.error || response.status}`);
                setLoading(false);
                return;
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";

            setMessages(prev => [...prev, { role: "assistant", content: "" }]);

            if (reader) {
                let buffer = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const dataStr = line.slice(6).trim();
                            if (!dataStr || dataStr === "[DONE]") continue;
                            try {
                                const data = JSON.parse(dataStr);
                                if (data.type === "done") continue;
                                const text = data.content || data.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (text) {
                                    assistantContent += text;
                                    setMessages(prev => {
                                        const updated = [...prev];
                                        updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                                        return updated;
                                    });
                                }
                            } catch {
                                // skip unparseable chunks
                            }
                        }
                    }
                }
            }

            // If streaming produced no content, check for non-streaming response
            if (!assistantContent) {
                try {
                    const text = await response.text();
                    if (text) {
                        setMessages(prev => {
                            const updated = [...prev];
                            updated[updated.length - 1] = { role: "assistant", content: text };
                            return updated;
                        });
                    }
                } catch { }
            }
        } catch (error) {
            console.error("Chat error:", error);
            toast.error("An error occurred. Please try again.");
        }

        setLoading(false);
    };

    // --- TEST BANNER ---
    const TestBanner = () => (
        <div className="bg-amber-500 text-white text-center py-1.5 text-xs font-semibold tracking-wide fixed top-0 left-0 right-0 z-[100]">
            ⚠️ TEST MODE — This is a preview of the complete customer journey
            <button
                onClick={() => { setPhase("unlock"); setUnlockStatus("idle"); setMessages([]); setDaysRemaining(30); }}
                className="ml-3 underline hover:no-underline"
            >
                Reset
            </button>
        </div>
    );

    // ===== UNLOCK PAGE =====
    if (phase === "unlock") {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900">
                <TestBanner />
                <div className="flex items-center justify-center min-h-screen px-4 py-8">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-8">
                            <div className="flex justify-center mb-4">
                                <img src={logo} alt="Serenity Scrolls" className="h-16 w-auto" />
                            </div>
                            <h1 className="text-2xl font-bold mb-1">Unlock Your AI Servant</h1>
                            <p className="text-sm text-muted-foreground">
                                Enter your Amazon Order ID to start your free 30-day access
                            </p>
                        </div>

                        {unlockStatus === "success" ? (
                            <Card>
                                <CardHeader className="text-center">
                                    <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <CardTitle className="text-green-600">Access Granted!</CardTitle>
                                    <CardDescription>
                                        Your 30-day free trial has started. You have <strong>30 days</strong> of access to Servant 1.0.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                        <h3 className="font-semibold text-sm flex items-center gap-1.5">
                                            <BookOpen className="h-4 w-4" />
                                            How to Use Servant 1.0 with Your Scrolls
                                        </h3>
                                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                                            <li><strong>Draw a scroll</strong> from your Serenity Scrolls tube based on your mood or color.</li>
                                            <li><strong>Tell the Servant</strong> your mood, your scroll's name, or the color you drew.</li>
                                            <li><strong>Receive guidance</strong> — a Scripture Snapshot, reflection, journal prompts, and one small step.</li>
                                            <li><strong>Journal your thoughts</strong> using the prompts provided.</li>
                                            <li><strong>Come back anytime</strong> — the Servant remembers your conversation within each session.</li>
                                        </ol>
                                    </div>

                                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-center">
                                        <p className="text-xs text-amber-700 dark:text-amber-400">
                                            <Sparkles className="w-3 h-3 inline mr-1" />
                                            <strong>Tip:</strong> Inside the Servant, you can upgrade to <strong>Servant+</strong> for deeper EQ-informed reflections at a special discount.
                                        </p>
                                    </div>

                                    <Button onClick={() => setPhase("servant")} className="w-full" size="lg">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Enter Servant 1.0
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Verify Your Purchase</CardTitle>
                                    <CardDescription>
                                        Enter your Amazon Order ID and email to unlock access
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleUnlock} className="space-y-4">
                                        <div>
                                            <Label htmlFor="test-email">Email Address</Label>
                                            <Input
                                                id="test-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                disabled={unlockStatus === "verifying"}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">The email you used to purchase</p>
                                        </div>
                                        <div>
                                            <Label htmlFor="test-order">Amazon Order ID</Label>
                                            <Input
                                                id="test-order"
                                                type="text"
                                                placeholder="e.g., 123-4567890-1234567"
                                                value={orderId}
                                                onChange={(e) => setOrderId(e.target.value)}
                                                required
                                                className="font-mono"
                                                disabled={unlockStatus === "verifying"}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                                                <HelpCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                                Found in your Amazon order confirmation email or under Your Orders
                                            </p>
                                        </div>

                                        {unlockStatus === "error" && (
                                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                                <p className="text-sm text-destructive font-medium">{unlockError}</p>
                                                {unlockHint && <p className="text-xs text-muted-foreground mt-1">{unlockHint}</p>}
                                            </div>
                                        )}

                                        <Button type="submit" className="w-full" size="lg" disabled={unlockStatus === "verifying"}>
                                            {unlockStatus === "verifying" ? (
                                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                                            ) : "Unlock Access"}
                                        </Button>
                                    </form>

                                    <div className="mt-6 text-center text-sm text-muted-foreground">
                                        <p>Need help? <a href="mailto:support@serenityscrolls.com" className="underline hover:text-foreground">Contact Support</a></p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <p className="text-xs text-muted-foreground text-center mt-4">
                            By unlocking access, you agree to our terms of service.
                            Each Amazon Order ID can only be redeemed once.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ===== SERVANT PAGE =====
    if (phase === "servant") {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-background to-background dark:from-gray-950 dark:via-background flex flex-col">
                <TestBanner />
                <Navbar />

                <div className="flex-1 container mx-auto px-4 py-20 max-w-3xl flex flex-col" style={{ marginTop: "24px" }}>
                    <div className="text-center mb-6">
                        <h1 className="text-3xl md:text-4xl font-bold mb-1">
                            Serenity Scrolls <span className="text-primary">Servant</span>
                        </h1>
                        <p className="text-muted-foreground text-sm mb-3">
                            Your spiritual companion for reflection and guidance
                        </p>

                        {/* Version Toggle */}
                        <div className="inline-flex items-center gap-1 bg-muted rounded-lg p-1">
                            <button
                                onClick={() => { if (version !== "1.0") { setVersion("1.0"); setMessages([]); } }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${version === "1.0"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <BookOpen className="h-4 w-4" />
                                1.0 Basic
                            </button>
                            <button
                                onClick={() => {
                                    if (version === "2.0") return;
                                    setUpgradeStatus("idle");
                                    setPhase("upgrade");
                                }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${version === "2.0"
                                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {version === "2.0" ? <Star className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                2.0 Advanced
                                <span className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1 py-0.5 rounded-full ml-1">PRO</span>
                            </button>
                        </div>

                        {/* Days Remaining Badge */}
                        <div className="mt-3">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${daysRemaining > 10 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : daysRemaining > 3 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                }`}>
                                <Clock className="h-3 w-3" />
                                {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
                            </div>
                        </div>

                        {/* Simulate controls (test only) */}
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Test:</span>
                            {[30, 10, 3, 1].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDaysRemaining(d)}
                                    className={`text-[10px] px-2 py-0.5 rounded ${daysRemaining === d ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                                >
                                    {d}d
                                </button>
                            ))}
                            <button
                                onClick={() => { setDaysRemaining(0); setTimeout(() => setPhase("expired"), 800); }}
                                className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 hover:bg-red-200"
                            >
                                Expire
                            </button>
                        </div>
                    </div>

                    {/* Chat Card */}
                    <Card className="flex-1 flex flex-col overflow-hidden shadow-lg border-border/50">
                        {/* Chat Header Bar */}
                        <div className="bg-primary/5 border-b border-border px-5 py-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-amber-200/30 dark:to-amber-800/30 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">
                                    {version === "2.0" ? (
                                        <span className="flex items-center gap-1.5">Servant<span className="text-amber-600">+</span> <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full">2.0</span></span>
                                    ) : "Servant"}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    {version === "2.0" ? "EQ-informed spiritual companion" : "Scripture-guided spiritual companion"}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[11px] text-muted-foreground">Online</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-background to-muted/10">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 space-y-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-150" />
                                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/15 to-amber-100/40 dark:to-amber-900/20 flex items-center justify-center border border-primary/10">
                                            <span className="text-3xl">📜</span>
                                        </div>
                                    </div>
                                    <div className="text-center space-y-1 max-w-sm">
                                        <p className="text-lg font-semibold">Welcome, friend</p>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Share how you're feeling, name a scroll you drew, or tell me a color — and I'll meet you right where you are with Scripture and reflection.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                                        {[
                                            { emoji: "💙", label: "I'm feeling sad" },
                                            { emoji: "😰", label: "I feel anxious" },
                                            { emoji: "🙏", label: "I'm grateful today" },
                                            { emoji: "💜", label: "I drew a purple scroll" },
                                        ].map((prompt) => (
                                            <button
                                                key={prompt.label}
                                                onClick={() => setInput(prompt.label)}
                                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/60 bg-background hover:bg-muted/50 hover:border-primary/30 transition-all text-left text-sm group"
                                            >
                                                <span className="text-base group-hover:scale-110 transition-transform">{prompt.emoji}</span>
                                                <span className="text-muted-foreground group-hover:text-foreground transition-colors">{prompt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upsell Banner */}
                            {version === "1.0" && !upsellDismissed && userMessageCount >= 3 && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mx-auto max-w-md text-center">
                                    <div className="flex items-center justify-center gap-1.5 mb-2">
                                        <Sparkles className="h-4 w-4 text-amber-600" />
                                        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Upgrade to Servant+</span>
                                    </div>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                                        Get deeper EQ-informed reflections, virtue-based insights, and the Serenity Leadership Framework.
                                    </p>
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        <span className="text-sm text-muted-foreground line-through">$39.99</span>
                                        <span className="text-lg font-bold text-amber-700 dark:text-amber-300">$19.99</span>
                                        <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-full font-medium">50% OFF</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => { setUpgradeStatus("idle"); setPhase("upgrade"); }}>
                                            Upgrade Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                        </Button>
                                        <button
                                            onClick={() => setUpsellDismissed(true)}
                                            className="text-xs text-amber-600/70 dark:text-amber-400/70 hover:text-amber-800 dark:hover:text-amber-300 underline underline-offset-2 transition-colors"
                                        >
                                            Maybe next time
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Chat Messages */}
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {msg.role === "assistant" && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/15 to-amber-100/40 dark:to-amber-900/20 flex items-center justify-center shrink-0 mt-1 border border-primary/10">
                                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-sm"
                                        : "bg-card border border-border/50 shadow-sm rounded-bl-sm"
                                        }`}>
                                        {msg.role === "assistant" ? (
                                            <div className="prose-chat space-y-0.5">{renderMarkdown(msg.content || "...")}</div>
                                        ) : (
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {loading && (
                                <div className="flex gap-2.5 justify-start">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/15 to-amber-100/40 dark:to-amber-900/20 flex items-center justify-center shrink-0 mt-1 border border-primary/10">
                                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    </div>
                                    <div className="bg-card border border-border/50 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
                                        <div className="flex gap-1.5 items-center h-5">
                                            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Bar */}
                        <form onSubmit={sendMessage} className="p-4 border-t bg-card/80 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Share how you're feeling…"
                                    disabled={loading}
                                    className="flex-1 rounded-full border-border/60 bg-muted/30 focus:bg-background px-4 h-11 text-sm transition-colors"
                                />
                                <Button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    size="icon"
                                    className="rounded-full h-11 w-11 shrink-0 bg-primary hover:bg-primary/90 disabled:opacity-30"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </Card>

                    <p className="text-[11px] text-muted-foreground text-center mt-4 max-w-xl mx-auto leading-relaxed">
                        <strong>Disclaimer:</strong> The Serenity Scrolls Servant is an AI-powered companion designed for spiritual reflection and Scripture-based guidance. It is not a substitute for professional counseling, medical advice, or pastoral care.
                    </p>
                </div>
            </div>
        );
    }

    // ===== UPGRADE / PAYMENT SIMULATION PAGE =====
    if (phase === "upgrade") {
        const handleSimulatedPayment = async () => {
            setUpgradeStatus("processing");
            // Simulate Stripe processing delay
            await new Promise(r => setTimeout(r, 2200));
            setUpgradeStatus("success");
            toast.success("Payment successful! Welcome to Servant+ 2.0");
            // Transition to Servant 2.0 after brief success display
            setTimeout(() => {
                setVersion("2.0");
                setMessages([]);
                setUpsellDismissed(true);
                setDaysRemaining(30);
                setPhase("servant");
            }, 1800);
        };

        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900">
                <TestBanner />
                <div className="flex items-center justify-center min-h-screen px-4 py-8">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-8">
                            <div className="flex justify-center mb-4">
                                <img src={logo} alt="Serenity Scrolls" className="h-16 w-auto" />
                            </div>
                            <h1 className="text-2xl font-bold mb-1">
                                Upgrade to <span className="text-amber-600">Servant+</span> 2.0
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Unlock deeper EQ-informed reflections and virtue-based insights
                            </p>
                        </div>

                        {upgradeStatus === "success" ? (
                            <Card className="border-green-200 dark:border-green-800">
                                <CardContent className="pt-8 pb-6 text-center space-y-4">
                                    <div className="relative mx-auto w-20 h-20">
                                        <div className="absolute inset-0 bg-green-400/20 blur-xl rounded-full animate-pulse" />
                                        <div className="relative w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-10 h-10 text-green-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-green-600 mb-1">Payment Successful!</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Welcome to Servant+ 2.0. Preparing your upgraded experience...
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Loading Servant+ 2.0...
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-amber-600" />
                                        Complete Your Upgrade
                                    </CardTitle>
                                    <CardDescription>Simulated payment — no real charges</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {/* Plan Summary */}
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-amber-600" />
                                                <span className="font-semibold text-sm">Servant+ 2.0</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm text-muted-foreground line-through">$39.99</span>
                                                <span className="text-lg font-bold text-amber-700 dark:text-amber-300">$19.99</span>
                                                <span className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-full font-medium">/mo</span>
                                            </div>
                                        </div>
                                        <ul className="text-xs text-muted-foreground space-y-1.5">
                                            <li className="flex items-center gap-1.5">
                                                <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />
                                                EQ-informed reflections with emotional intelligence
                                            </li>
                                            <li className="flex items-center gap-1.5">
                                                <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />
                                                Virtue mapping aligned to your mood
                                            </li>
                                            <li className="flex items-center gap-1.5">
                                                <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />
                                                Serenity Leadership Framework insights
                                            </li>
                                            <li className="flex items-center gap-1.5">
                                                <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />
                                                Priority response quality
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Fake Card Form */}
                                    <div className="space-y-3">
                                        <div>
                                            <Label htmlFor="card-number" className="text-xs">Card Number</Label>
                                            <Input
                                                id="card-number"
                                                defaultValue="4242 4242 4242 4242"
                                                className="font-mono text-sm bg-muted/30"
                                                disabled={upgradeStatus === "processing"}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label htmlFor="card-expiry" className="text-xs">Expiry</Label>
                                                <Input
                                                    id="card-expiry"
                                                    defaultValue="12/28"
                                                    className="font-mono text-sm bg-muted/30"
                                                    disabled={upgradeStatus === "processing"}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="card-cvc" className="text-xs">CVC</Label>
                                                <Input
                                                    id="card-cvc"
                                                    defaultValue="123"
                                                    className="font-mono text-sm bg-muted/30"
                                                    disabled={upgradeStatus === "processing"}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-2 text-xs text-muted-foreground">
                                        <Lock className="h-3.5 w-3.5 shrink-0" />
                                        <span>This is a <strong>simulated payment</strong> for demo purposes. No real charges will be made.</span>
                                    </div>

                                    <Button
                                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg"
                                        size="lg"
                                        disabled={upgradeStatus === "processing"}
                                        onClick={handleSimulatedPayment}
                                    >
                                        {upgradeStatus === "processing" ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing Payment...</>
                                        ) : (
                                            <>Pay $19.99/mo <ArrowRight className="h-4 w-4 ml-1" /></>
                                        )}
                                    </Button>

                                    <button
                                        onClick={() => setPhase("servant")}
                                        className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                                        disabled={upgradeStatus === "processing"}
                                    >
                                        Keep using Servant 1.0
                                    </button>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex items-center justify-center gap-4 mt-4">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Lock className="h-3 w-3" /> SSL Secured
                            </span>
                            <span className="text-[10px] text-muted-foreground">Cancel anytime</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <span className="text-amber-500">50% OFF</span> launch price
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===== EXPIRED PAGE =====
    return (
        <div className="min-h-screen bg-background">
            <TestBanner />
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
                                <Lock className="w-8 h-8 text-amber-600" />
                            </div>
                            <CardTitle>Your Free Trial Has Ended</CardTitle>
                            <CardDescription>
                                Your 30-day free access to Serenity Scrolls Servant has expired.
                                Subscribe to continue your spiritual reflection journey.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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

                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                                    Continue your journey
                                </p>
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <span className="text-sm text-muted-foreground line-through">$39.99</span>
                                    <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">$19.99</span>
                                    <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-full font-medium">/mo</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Cancel anytime</p>
                            </div>

                            <Button
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                                size="lg"
                                onClick={() => { setUpgradeStatus("idle"); setPhase("upgrade"); }}
                            >
                                Subscribe Now <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>

                            <div className="text-center space-y-2">
                                <p className="text-xs text-muted-foreground">or</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setPhase("unlock"); setUnlockStatus("idle"); }}
                                >
                                    Enter a New Order ID
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

export default ServantTestFlow;
