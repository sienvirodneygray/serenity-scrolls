import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WEBSITE_AMAZON_URL } from "@/lib/amazonAttribution";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import {
    Sparkles,
    BookOpen,
    Clock,
    ShoppingCart,
    CheckCircle,
    MessageCircle,
    ArrowRight,
    Heart,
    Shield,
    Brain,
} from "lucide-react";

const emotions = [
    {
        name: "Anxious",
        color: "anxious",
        prompt: "I'm feeling anxious about tomorrow…",
        response:
            "\"Cast all your anxiety on Him, because He cares for you.\" — 1 Peter 5:7. Take a slow breath. God's peace isn't the absence of trouble — it's His presence in the midst of it.",
    },
    {
        name: "Grateful",
        color: "grateful",
        prompt: "I'm overflowing with gratitude today!",
        response:
            "\"Give thanks to the Lord, for He is good; His love endures forever.\" — Psalm 107:1. What a beautiful thing to carry gratitude in your heart. Let's reflect on the blessings you've noticed today.",
    },
    {
        name: "Sad",
        color: "sad",
        prompt: "I'm feeling really down right now…",
        response:
            "\"The Lord is close to the brokenhearted and saves those who are crushed in spirit.\" — Psalm 34:18. You are not alone in this season. God draws especially near when we feel at our lowest.",
    },
    {
        name: "Frustrated",
        color: "frustrated",
        prompt: "Everything feels like it's going wrong.",
        response:
            "\"Be still, and know that I am God.\" — Psalm 46:10. When frustration rises, pause. Let His sovereignty remind you — this moment doesn't define your story.",
    },
    {
        name: "Happy",
        color: "happy",
        prompt: "I feel so joyful and blessed!",
        response:
            "\"Rejoice in the Lord always. I will say it again: Rejoice!\" — Philippians 4:4. Joy is a gift — and when you share it, it multiplies. What's bringing you this beautiful happiness today?",
    },
    {
        name: "Troubled",
        color: "troubled",
        prompt: "My heart feels heavy and troubled…",
        response:
            "\"Peace I leave with you; my peace I give you. Do not let your hearts be troubled and do not be afraid.\" — John 14:27. Bring your burdens to Him. He already knows, and He's waiting with open arms.",
    },
];

const features = [
    {
        icon: Brain,
        title: "Personalized Guidance",
        description:
            "Responses are tailored to your current emotion, drawing from the same 96 curated verses in your Serenity Scrolls collection.",
    },
    {
        icon: BookOpen,
        title: "96 Curated Bible Verses",
        description:
            "Every response is rooted in Scripture — color-coded across 6 emotions — so you always get the right word at the right time.",
    },
    {
        icon: Clock,
        title: "Available 24/7",
        description:
            "Whether it's 3 AM or midday, your Servant is always ready to listen, reflect, and guide you through Scripture.",
    },
];

const steps = [
    {
        number: "01",
        icon: ShoppingCart,
        title: "Purchase Serenity Scrolls",
        description:
            "Get your Serenity Scrolls Tube or Reflection Journal from Amazon. Your purchase unlocks Servant access.",
    },
    {
        number: "02",
        icon: CheckCircle,
        title: "Verify Your Purchase",
        description:
            "Submit your order email and confirmation number. We'll verify and grant access within 24 hours.",
    },
    {
        number: "03",
        icon: MessageCircle,
        title: "Start Chatting",
        description:
            "Open the Servant, share how you're feeling, and receive personalized Scripture-based guidance instantly.",
    },
];

const ServantLanding = () => {
    return (
        <div className="min-h-screen">
            <Navbar />

            {/* ===== HERO SECTION ===== */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
                {/* Subtle animated gradient orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[hsl(var(--anxious)/0.08)] blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[hsl(var(--grateful)/0.08)] blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

                <div className="relative z-10 container mx-auto px-4 py-20 text-center">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[hsl(var(--primary)/0.2)] blur-2xl rounded-full scale-150" />
                                <img src={logo} alt="Serenity Scrolls" className="relative h-32 w-auto drop-shadow-lg" />
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                            <Sparkles className="h-4 w-4" />
                            AI-Powered Spiritual Companion
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                            Meet Your{" "}
                            <span className="bg-gradient-to-r from-[hsl(var(--grateful))] via-[hsl(var(--primary))] to-[hsl(var(--anxious))] bg-clip-text text-transparent">
                                AI Servant
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            A spiritual companion that draws from all 96 Serenity Scrolls Bible verses to guide you through every emotion — with wisdom, warmth, and Scripture.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Button size="lg" className="h-14 px-8 text-lg group" asChild>
                                <a href={WEBSITE_AMAZON_URL} target="_blank" rel="noopener noreferrer">
                                    Get Access Now
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </Button>
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
                                <a href="#how-it-works">
                                    See How It Works
                                </a>
                            </Button>
                        </div>

                        <p className="text-sm text-muted-foreground pt-4">
                            <Shield className="inline h-4 w-4 mr-1 opacity-60" />
                            Included free with every Serenity Scrolls purchase
                        </p>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
            </section>

            {/* ===== WHAT IT IS SECTION ===== */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <p className="text-primary font-medium mb-3 tracking-wide uppercase text-sm">What It Is</p>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Scripture Meets AI
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            The Serenity Scrolls Servant is your personal AI companion that understands your emotions and responds with the perfect Scripture — every time.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {features.map((feature) => (
                            <Card
                                key={feature.title}
                                className="relative overflow-hidden p-8 text-center group hover:shadow-lg transition-all duration-500 hover:-translate-y-1 border-border/50"
                            >
                                <div className="absolute inset-0 bg-[var(--gradient-peaceful)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative">
                                    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                        <feature.icon className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS SECTION ===== */}
            <section id="how-it-works" className="py-24 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <p className="text-primary font-medium mb-3 tracking-wide uppercase text-sm">How It Works</p>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Three Simple Steps
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            From purchase to peace — here's how to start your journey with the Servant.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {steps.map((step, index) => (
                            <div key={step.number} className="relative">
                                {/* connector line */}
                                {index < steps.length - 1 && (
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
                                    <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CHAT DEMO PREVIEW ===== */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <p className="text-primary font-medium mb-3 tracking-wide uppercase text-sm">Preview</p>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            See It in Action
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Here's what a real conversation with your AI Servant looks like.
                        </p>
                    </div>

                    <div className="max-w-2xl mx-auto">
                        <Card className="overflow-hidden shadow-xl border-border/50">
                            {/* Chat header */}
                            <div className="bg-primary/5 border-b border-border px-6 py-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Serenity Scrolls Servant</p>
                                    <p className="text-xs text-muted-foreground">Your spiritual companion</p>
                                </div>
                                <div className="ml-auto flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs text-muted-foreground">Online</span>
                                </div>
                            </div>

                            {/* Chat messages */}
                            <div className="p-6 space-y-4 bg-gradient-to-b from-background to-muted/20 min-h-[360px]">
                                {/* User message */}
                                <div className="flex justify-end">
                                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-3 shadow-sm">
                                        <p className="text-sm">I've been feeling really anxious about a big decision I need to make. I don't know what the right path is.</p>
                                    </div>
                                </div>

                                {/* AI response */}
                                <div className="flex justify-start">
                                    <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-card border border-border px-4 py-3 shadow-sm space-y-3">
                                        <p className="text-sm leading-relaxed">
                                            I hear you, and it's completely normal to feel uncertain about big decisions. Let me share a verse that speaks directly to this:
                                        </p>
                                        <div className="bg-[hsl(var(--anxious-light))] rounded-lg px-4 py-3 border-l-4 border-[hsl(var(--anxious))]">
                                            <p className="text-sm font-medium italic">
                                                "Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths."
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1.5 font-medium">— Proverbs 3:5-6 (KJV)</p>
                                        </div>
                                        <p className="text-sm leading-relaxed">
                                            You don't have to see the whole path clearly. Just take the next faithful step, trusting that He's already there. 🙏
                                        </p>
                                    </div>
                                </div>

                                {/* User follow-up */}
                                <div className="flex justify-end">
                                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-3 shadow-sm">
                                        <p className="text-sm">Thank you… that really helped. 💛</p>
                                    </div>
                                </div>
                            </div>

                            {/* Chat input mockup */}
                            <div className="border-t border-border px-6 py-4 bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-muted/50 rounded-full px-4 py-2.5 text-sm text-muted-foreground">
                                        Share how you're feeling…
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                                        <ArrowRight className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ===== HOW IT RESPONDS (EMOTION CARDS) ===== */}
            <section className="py-24 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <p className="text-primary font-medium mb-3 tracking-wide uppercase text-sm">How It Responds</p>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            A Verse for Every Emotion
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            The Servant recognizes how you're feeling and responds with Scripture that speaks directly to your heart.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {emotions.map((emotion) => (
                            <Card
                                key={emotion.name}
                                className="overflow-hidden group hover:shadow-lg transition-all duration-500 hover:-translate-y-1 border-border/50"
                            >
                                {/* Emotion header */}
                                <div
                                    className="px-6 py-4 flex items-center gap-3"
                                    style={{
                                        backgroundColor: `hsl(var(--${emotion.color}-light))`,
                                    }}
                                >
                                    <Heart
                                        className="h-5 w-5"
                                        style={{ color: `hsl(var(--${emotion.color}))` }}
                                    />
                                    <span
                                        className="font-bold text-lg"
                                        style={{ color: `hsl(var(--${emotion.color}))` }}
                                    >
                                        {emotion.name}
                                    </span>
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* User prompt */}
                                    <div className="flex justify-end">
                                        <div className="bg-muted rounded-2xl rounded-br-md px-3 py-2 max-w-[90%]">
                                            <p className="text-xs text-muted-foreground italic">"{emotion.prompt}"</p>
                                        </div>
                                    </div>

                                    {/* AI response */}
                                    <div className="flex justify-start">
                                        <div className="text-sm text-foreground/80 leading-relaxed">
                                            <p>{emotion.response}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
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
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                            <Heart className="h-4 w-4" />
                            Included Free with Every Purchase
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                            Start Your Journey to{" "}
                            <span className="bg-gradient-to-r from-[hsl(var(--grateful))] to-[hsl(var(--primary))] bg-clip-text text-transparent">
                                Spiritual Peace
                            </span>
                        </h2>

                        <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                            Purchase Serenity Scrolls and unlock your personal AI Servant — 96 verses of wisdom, always at your fingertips.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Button size="lg" className="h-14 px-10 text-lg group" asChild>
                                <a href={WEBSITE_AMAZON_URL} target="_blank" rel="noopener noreferrer">
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    Buy on Amazon
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </Button>
                            <Button size="lg" variant="outline" className="h-14 px-10 text-lg" asChild>
                                <Link to="/servant-access">
                                    Already Purchased? Get Access
                                </Link>
                            </Button>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Your Servant is waiting to walk alongside you through every emotion.
                        </p>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="py-12 bg-muted/30 border-t border-border">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <p className="text-muted-foreground text-center">
                            © {new Date().getFullYear()} Serenity Scrolls. All rights reserved.
                        </p>
                        <p className="text-sm text-muted-foreground text-center">
                            Find peace in every emotion through Scripture
                        </p>
                        <a
                            href="/admin/login"
                            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                        >
                            Admin
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ServantLanding;
