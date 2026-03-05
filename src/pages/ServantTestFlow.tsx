import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import {
    Send, Loader2, Sparkles, BookOpen, ArrowRight, Lock, Clock,
    CheckCircle, QrCode, CreditCard, XCircle, ChevronRight
} from "lucide-react";
import logo from "@/assets/logo.png";

type Message = {
    role: "user" | "assistant";
    content: string;
};

type TestPhase = "qr" | "unlock" | "servant" | "expired";

const ServantTestFlow = () => {
    const navigate = useNavigate();

    // Phase state
    const [phase, setPhase] = useState<TestPhase>("qr");

    // Unlock state
    const [orderId, setOrderId] = useState("");
    const [email, setEmail] = useState("");
    const [unlockStatus, setUnlockStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
    const [unlockError, setUnlockError] = useState("");

    // Servant state
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [version, setVersion] = useState<"1.0" | "2.0">("1.0");
    const [daysRemaining, setDaysRemaining] = useState(30);
    const [showUpsell, setShowUpsell] = useState(false);

    // --- QR PHASE ---
    const renderQrPhase = () => (
        <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-muted rounded-2xl flex items-center justify-center">
                <QrCode className="w-10 h-10 text-primary" />
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-2">Step 1: Scan QR Code</h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    In the real product, customers scan a QR code printed on the Serenity Scrolls packaging.
                    The QR code leads to the <strong>/unlock</strong> page.
                </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-left text-sm">
                <p className="font-medium mb-2">What happens in real life:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Customer purchases Serenity Scrolls bundle on Amazon</li>
                    <li>Inside the packaging, they find a QR code</li>
                    <li>They scan it with their phone camera</li>
                    <li>It opens the unlock page in their browser</li>
                </ol>
            </div>
            <Button size="lg" onClick={() => setPhase("unlock")}>
                Simulate QR Scan <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
        </div>
    );

    // --- UNLOCK PHASE ---
    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setUnlockStatus("verifying");
        setUnlockError("");

        // Validate format
        const pattern = /^\d{3}-\d{7}-\d{7}$/;
        if (!pattern.test(orderId.trim())) {
            setUnlockStatus("error");
            setUnlockError("Invalid Order ID format. Use: 123-4567890-1234567");
            return;
        }

        // Simulate API call delay
        await new Promise(r => setTimeout(r, 1500));

        // For testing: accept any valid-format order ID
        setUnlockStatus("success");
        setDaysRemaining(30);
        toast.success("Access granted! 30-day free trial started.");
    };

    const renderUnlockPhase = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Step 2: Verify Purchase</h2>
                <p className="text-muted-foreground text-sm">
                    Enter your Amazon Order ID to unlock 30-day access
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
                            Your 30-day free trial has started. You have <strong>30 days</strong> of access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                            <h3 className="font-semibold text-sm flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4" />
                                How to Use Your Servant
                            </h3>
                            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                                <li><strong>Draw a scroll</strong> from your tube based on your mood or color.</li>
                                <li><strong>Tell the Servant</strong> your mood, scroll name, or color.</li>
                                <li><strong>Receive</strong> a Scripture Snapshot, reflection, journal prompts, and one step.</li>
                                <li><strong>Journal your thoughts</strong> using the prompts provided.</li>
                            </ol>
                        </div>
                        <Button className="w-full" size="lg" onClick={() => setPhase("servant")}>
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
                            Use test Order ID: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">123-4567890-1234567</code>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUnlock} className="space-y-4">
                            <div>
                                <Label htmlFor="test-email">Email Address</Label>
                                <Input
                                    id="test-email"
                                    type="email"
                                    placeholder="test@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={unlockStatus === "verifying"}
                                />
                            </div>
                            <div>
                                <Label htmlFor="test-order">Amazon Order ID</Label>
                                <Input
                                    id="test-order"
                                    type="text"
                                    placeholder="123-4567890-1234567"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    required
                                    className="font-mono"
                                    disabled={unlockStatus === "verifying"}
                                />
                            </div>

                            {unlockStatus === "error" && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                    <p className="text-sm text-destructive">{unlockError}</p>
                                </div>
                            )}

                            <Button type="submit" className="w-full" size="lg" disabled={unlockStatus === "verifying"}>
                                {unlockStatus === "verifying" ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                                ) : "Unlock Access"}
                            </Button>
                        </form>

                        {/* Test scenarios */}
                        <div className="mt-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">Test Scenarios:</p>
                            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                                <li>✅ Valid: <code>123-4567890-1234567</code></li>
                                <li>❌ Invalid format: <code>ABC-123</code></li>
                                <li>❌ Already redeemed: use same valid ID twice on production</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    // --- SERVANT PHASE ---
    const userMessageCount = messages.filter(m => m.role === "user").length;

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
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
                        messages: [...messages, { role: "user", content: userMsg }],
                        message: userMsg,
                        version,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Chat error:", response.status, errorData);
                toast.error("AI service error. Check console for details.");
                setLoading(false);
                return;
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";

            setMessages(prev => [...prev, { role: "assistant", content: "" }]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (text) {
                                    assistantContent += text;
                                    setMessages(prev => {
                                        const updated = [...prev];
                                        updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                                        return updated;
                                    });
                                }
                            } catch { }
                        }
                    }
                }
            }

            // Show upsell after 3 user messages
            if (userMessageCount + 1 >= 3) {
                setShowUpsell(true);
            }
        } catch (error) {
            console.error("Chat error:", error);
            toast.error("An error occurred");
        }

        setLoading(false);
    };

    const renderServantPhase = () => (
        <div className="space-y-4">
            {/* Header with version toggle */}
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">
                    {version === "1.0" ? "Serenity Scrolls Servant" : "Serenity Scrolls Servant+"}
                </h2>
                <p className="text-muted-foreground text-sm mb-3">
                    {version === "1.0"
                        ? "Your spiritual companion for reflection and guidance"
                        : "Advanced reflection with emotional intelligence"}
                </p>

                {/* Version Toggle */}
                <div className="inline-flex items-center gap-1 bg-muted rounded-lg p-1">
                    <button
                        onClick={() => { setVersion("1.0"); setMessages([]); setShowUpsell(false); }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${version === "1.0"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <BookOpen className="h-4 w-4" />
                        1.0 Basic
                    </button>
                    <button
                        onClick={() => toast.info("Servant+ requires a subscription. Upgrade to unlock!")}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
                    >
                        <Lock className="h-4 w-4" />
                        2.0 Advanced
                        <span className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1 py-0.5 rounded-full ml-1">PRO</span>
                    </button>
                </div>

                {/* Days Remaining Badge */}
                <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-medium ${daysRemaining > 10 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : daysRemaining > 3 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                    <Clock className="h-3 w-3" />
                    {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
                </div>

                {/* Test Controls */}
                <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Simulate days:</span>
                    {[30, 10, 3, 1, 0].map(d => (
                        <button
                            key={d}
                            onClick={() => {
                                setDaysRemaining(d);
                                if (d === 0) {
                                    toast.info("Access expired! Redirecting to paywall...");
                                    setTimeout(() => setPhase("expired"), 1500);
                                }
                            }}
                            className={`text-xs px-2 py-1 rounded ${daysRemaining === d ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            <Card className="flex flex-col" style={{ height: "400px" }}>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            <p className="text-sm mb-1">Welcome to Serenity Scrolls Servant</p>
                            <p className="text-xs">Tell me your mood, a moment, or the name or color of a scroll</p>
                        </div>
                    )}

                    {/* Upsell Banner (appears after 3 messages) */}
                    {showUpsell && version === "1.0" && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mx-auto max-w-sm text-center">
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
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                                Upgrade Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}>
                                {msg.content || "..."}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-muted rounded-lg px-4 py-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={sendMessage} className="p-3 border-t">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={loading} size="sm">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </Card>

            <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { setMessages([]); setShowUpsell(false); }}>
                    Clear Chat
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPhase("expired")}>
                    Simulate Expiry →
                </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
                <strong>Disclaimer:</strong> The Serenity Scrolls Servant is an AI-powered companion. It is not a substitute for professional counseling, medical advice, or pastoral care.
            </p>
        </div>
    );

    // --- EXPIRED PHASE ---
    const renderExpiredPhase = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Step 5: Expired Access</h2>
                <p className="text-muted-foreground text-sm">This is what users see after 30 days</p>
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
                                <span><strong>Servant 1.0</strong> — Scripture Snapshots, reflections, journal prompts</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                                <span><strong>Servant+ 2.0</strong> — EQ-informed reflections, virtue mapping</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-sm text-muted-foreground line-through">$39.99</span>
                            <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">$19.99</span>
                            <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-full font-medium">/mo</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Cancel anytime</p>
                    </div>

                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" size="lg"
                        onClick={() => toast.info("Stripe subscription coming soon!")}
                    >
                        Subscribe Now <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>

                    <div className="text-center">
                        <Button variant="outline" size="sm" onClick={() => { setPhase("qr"); resetAll(); }}>
                            Restart Test Flow
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const resetAll = () => {
        setPhase("qr");
        setUnlockStatus("idle");
        setOrderId("");
        setEmail("");
        setMessages([]);
        setInput("");
        setVersion("1.0");
        setDaysRemaining(30);
        setShowUpsell(false);
        setUnlockError("");
    };

    // --- PROGRESS BAR ---
    const phases: TestPhase[] = ["qr", "unlock", "servant", "expired"];
    const phaseLabels = { qr: "QR Scan", unlock: "Verify", servant: "Servant", expired: "Expired" };
    const phaseIndex = phases.indexOf(phase);

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900">
            <Navbar />
            <div className="container mx-auto px-4 pt-24 pb-12 max-w-lg">
                {/* Logo */}
                <div className="text-center mb-6">
                    <img src={logo} alt="Serenity Scrolls" className="h-12 w-auto mx-auto mb-2" />
                    <h1 className="text-lg font-bold text-muted-foreground">Full Test Flow</h1>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-1 mb-8">
                    {phases.map((p, i) => (
                        <div key={p} className="flex items-center">
                            <button
                                onClick={() => setPhase(p)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${i === phaseIndex
                                        ? "bg-primary text-primary-foreground"
                                        : i < phaseIndex
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                            >
                                {i < phaseIndex && <CheckCircle className="h-3 w-3" />}
                                {phaseLabels[p]}
                            </button>
                            {i < phases.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />}
                        </div>
                    ))}
                </div>

                {/* Phase Content */}
                {phase === "qr" && renderQrPhase()}
                {phase === "unlock" && renderUnlockPhase()}
                {phase === "servant" && renderServantPhase()}
                {phase === "expired" && renderExpiredPhase()}
            </div>
        </div>
    );
};

export default ServantTestFlow;
