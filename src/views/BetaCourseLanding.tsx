"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import Link from "next/link";
import {
    Sparkles,
    BookOpen,
    CheckCircle,
    ArrowRight,
    Shield,
    Loader2,
    Lock,
    Users,
    GraduationCap,
    FileText,
    Heart
} from "lucide-react";

const courseFeatures = [
    {
        icon: GraduationCap,
        title: "8 Comprehensive Modules",
        description:
            "32 Scripture-based, safety-aware lessons guiding you through emotional validation, biblical boundaries, escalation frameworks, and practical action.",
    },
    {
        icon: Shield,
        title: "Green-Yellow-Red Severity Map",
        description:
            "Know exactly when to coach, document, or escalate immediately. Remove the fog around bullying, harassment, and conflict.",
    },
    {
        icon: FileText,
        title: "Devotionals & Worksheets",
        description:
            "Includes child-led reflection pages, family boundary worksheets, and custom communication scripts to respond with wisdom.",
    },
];

const betaSteps = [
    {
        number: "01",
        icon: Users,
        title: "Request Course Access",
        description:
            "Enter your email and beta access code to instantly register for our exclusive pre-release course cohort.",
    },
    {
        number: "02",
        icon: Lock,
        title: "Instant Enrollment",
        description:
            "Our system will verify your code and automatically enroll you in the Courage Covenant curriculum.",
    },
    {
        number: "03",
        icon: Sparkles,
        title: "Begin Learning",
        description:
            "Access the Courage Covenant portal immediately and begin navigating the modules with your family.",
    },
];

const courseModules = [
    { num: 1, title: "What Actually Happened?", desc: "Distinguish conflict, teasing, bullying, and danger with clear categories.", color: "anxious" },
    { num: 2, title: "What Is the Child Feeling?", desc: "Name and validate 9 emotions so your child feels heard before you respond.", color: "grateful" },
    { num: 3, title: "What Does Scripture Say?", desc: "Use Scripture to support truth and courage — not passivity or spiritual duct tape.", color: "sad" },
    { num: 4, title: "What the Child Can Say", desc: "Word-for-word boundary, exit, and help-seeking scripts they can use tomorrow.", color: "frustrated" },
    { num: 5, title: "What Parents Should Do", desc: "Respond in the first 60 seconds. The Listen → Document → Decide framework.", color: "happy" },
    { num: 6, title: "🟢🟡🔴 Escalation Framework", desc: "Know exactly when to coach, document, or escalate immediately. No more fog.", color: "troubled" },
    { num: 7, title: "Forgiveness, Boundaries & Wisdom", desc: "Biblical forgiveness without enabling harm. Boundaries are not bitterness.", color: "primary" },
    { num: 8, title: "The 7-Day Courage Ritual", desc: "Build the daily Scrolls + Journal + AI Servant habit that makes it all stick.", color: "grateful" },
];

const BetaCourseLanding = () => {
    const [email, setEmail] = useState("");
    const [accessCode, setAccessCode] = useState("COVENANT2026");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const router = useRouter();
    const { toast } = useToast();

    const handleBetaSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus("idle");
        setErrorMessage("");

        try {
            const trimmedEmail = email.trim().toLowerCase();

            // Request access using the custom 'BETA' promo code flow
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify-order`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
                    },
                    body: JSON.stringify({
                        orderId: accessCode.trim(),
                        email: trimmedEmail,
                        isBeta: true,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setStatus("error");
                setErrorMessage(data.error || "Could not register for beta access. Please try again.");
                return;
            }

            // Success — seamless auto-login using the generated token hash
            if (data.email && data.token) {
                const { error: authError } = await supabase.auth.verifyOtp({
                    type: "magiclink",
                    token_hash: data.token,
                });

                if (authError) {
                    console.error("Auto-login failed:", authError);
                    setStatus("error");
                    setErrorMessage("Account created but auto-login failed. Please check your inbox for a login link.");
                    return;
                }
            }

            setStatus("success");
            toast({
                title: "Course Access Granted! 🎉",
                description: "Redirecting you to the Courage Covenant course...",
            });

            // Redirect user to the course player
            setTimeout(() => {
                router.push("/learn/courage-covenant?enrolled=true");
            }, 1500);

        } catch (error) {
            console.error("Beta registration error:", error);
            setStatus("error");
            setErrorMessage("A network error occurred. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Navbar />

            {/* ===== HERO SECTION ===== */}
            <section className="relative min-h-screen flex items-center justify-center overflow-x-hidden py-24 md:py-32">
                <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
                {/* Subtle animated gradient orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[hsl(var(--primary)/0.08)] blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[hsl(var(--grateful)/0.08)] blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

                <div className="relative z-10 container mx-auto px-4 text-center">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[hsl(var(--primary)/0.2)] blur-2xl rounded-full scale-150" />
                                <img src={logo.src} alt="Serenity Scrolls" className="relative h-20 md:h-24 w-auto drop-shadow-lg" />
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
                            <Sparkles className="h-4 w-4" />
                            Course Beta Program
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold leading-tight font-['Vilonti']">
                            Be the First to Experience the{" "}
                            <span className="bg-gradient-to-r from-[hsl(var(--grateful))] via-[hsl(var(--primary))] to-[hsl(var(--anxious))] bg-clip-text text-transparent">
                                Courage Covenant™ Course
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Join our exclusive pre-release cohort and help shape the future of faith-based, safety-aware bullying guidance for families.
                        </p>

                        {/* Direct Beta Signup Box */}
                        <div className="max-w-md mx-auto pt-6">
                            <Card className="p-6 border-border/80 shadow-xl bg-card/90 backdrop-blur-md">
                                {status === "success" ? (
                                    <div className="text-center space-y-4 py-4">
                                        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        </div>
                                        <h3 className="font-bold text-lg text-green-600">Enrollment Approved!</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Creating your profile and entering the course learning portal...
                                        </p>
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                                    </div>
                                ) : (
                                    <form onSubmit={handleBetaSignup} className="space-y-4 text-left">
                                        <div className="space-y-3">
                                            <div>
                                                <label htmlFor="beta-email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                                    Email Address
                                                </label>
                                                <Input
                                                    id="beta-email"
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="h-12 bg-background/50"
                                                    disabled={isLoading}
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="beta-code" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                                    Course Beta Access Code
                                                </label>
                                                <Input
                                                    id="beta-code"
                                                    type="text"
                                                    placeholder="Enter Beta Code"
                                                    value={accessCode}
                                                    onChange={(e) => setAccessCode(e.target.value)}
                                                    required
                                                    className="h-12 bg-background/50 font-mono"
                                                    disabled={isLoading}
                                                />
                                            </div>

                                            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-primary hover:bg-primary/95 text-white flex items-center justify-center gap-2">
                                                {isLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        Enroll in Beta Course
                                                        <ArrowRight className="w-4.5 h-4.5" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {status === "error" && (
                                            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3">
                                                {errorMessage}
                                            </div>
                                        )}

                                        <p className="text-[11px] text-muted-foreground text-center">
                                            <Shield className="inline h-3.5 w-3.5 mr-1 align-text-bottom opacity-70" />
                                            Immediate full course enrollment. No purchase required.
                                        </p>
                                    </form>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
            </section>

            {/* ===== WHAT IT IS SECTION ===== */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <p className="text-primary font-medium mb-3 tracking-wide uppercase text-sm font-semibold">Features</p>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 font-['Vilonti']">
                            A Curriculum for Clarity & Courage
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            The Courage Covenant™ course provides families and church groups with step-by-step guidance, biblically aligned, to address bullying constructively.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {courseFeatures.map((feature) => (
                            <Card
                                key={feature.title}
                                className="relative overflow-hidden p-8 text-center group hover:shadow-lg transition-all duration-500 hover:-translate-y-1 border-border/50 bg-card/60"
                            >
                                <div className="relative">
                                    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                        <feature.icon className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed text-sm">
                                        {feature.description}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== 8 MODULES PREVIEW SECTION ===== */}
            <section className="py-24 bg-muted/20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <p className="text-primary font-medium mb-3 tracking-wide uppercase text-sm font-semibold">Curriculum</p>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 font-['Vilonti']">
                            8 Modules. 32 Interactive Lessons.
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Beta course access unlocks all core lessons and accompanying assets.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {courseModules.map((mod) => (
                            <Card
                                key={mod.num}
                                className="overflow-hidden border border-border/50 bg-card/75 shadow-sm group hover:-translate-y-0.5 transition-transform"
                            >
                                <div
                                    className="px-4 py-3 flex items-center gap-2"
                                    style={{
                                        backgroundColor: `hsl(var(--${mod.color}-light) / 0.1)`,
                                        borderBottom: `1px solid hsl(var(--${mod.color}-light) / 0.2)`
                                    }}
                                >
                                    <GraduationCap
                                        className="h-4.5 w-4.5"
                                        style={{ color: `hsl(var(--${mod.color}))` }}
                                    />
                                    <span
                                        className="font-bold text-xs uppercase tracking-wide"
                                        style={{ color: `hsl(var(--${mod.color}))` }}
                                    >
                                        Module {mod.num}
                                    </span>
                                </div>

                                <div className="p-5 space-y-2">
                                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{mod.title}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                        {mod.desc}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS SECTION ===== */}
            <section id="how-it-works" className="py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <p className="text-primary font-medium mb-3 tracking-wide uppercase text-sm font-semibold">Process</p>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 font-['Vilonti']">
                            How to Start Testing
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Joining the pre-release course group and launching your workspace is simple.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {betaSteps.map((step, index) => (
                            <div key={step.number} className="relative">
                                {/* connector line */}
                                {index < betaSteps.length - 1 && (
                                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/30 to-primary/10" />
                                )}
                                <div className="text-center group">
                                    <div className="relative mx-auto w-24 h-24 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center mb-6 group-hover:border-primary/60 transition-colors duration-500 shadow-lg">
                                        <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                                            {step.number}
                                        </span>
                                        <step.icon className="h-10 w-10 text-primary/70 group-hover:text-primary transition-colors duration-300" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto text-sm">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FINAL CTA SECTION ===== */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(var(--primary)/0.06)] blur-3xl" />

                <div className="relative z-10 container mx-auto px-4 text-center">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
                            <Heart className="h-4 w-4" />
                            Help Us Refine the Guide
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold leading-tight font-['Vilonti']">
                            Equip Your Family with{" "}
                            <span className="bg-gradient-to-r from-[hsl(var(--grateful))] to-[hsl(var(--primary))] bg-clip-text text-transparent">
                                Biblical Wisdom
                            </span>
                        </h2>

                        <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                            Request your course access today and walk alongside us in polishing this vital resource.
                        </p>

                        <div className="flex justify-center pt-4">
                            <Button size="lg" className="h-14 px-10 text-lg bg-gradient-to-r from-primary to-violet-600 hover:from-primary/95 hover:to-violet-650 text-white group" onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}>
                                <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                                Apply For Course Access
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="py-12 bg-muted/30 border-t border-border">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <p className="text-muted-foreground text-center text-xs">
                            © {new Date().getFullYear()} Serenity Scrolls. All rights reserved.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                            <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
                            <span className="text-muted-foreground/30">|</span>
                            <Link href="/data-protection-policy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Data Protection</Link>
                            <span className="text-muted-foreground/30">|</span>
                            <Link href="/terms-of-service" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default BetaCourseLanding;
