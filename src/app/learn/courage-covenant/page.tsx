"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

const MODULES = [
  { num: 1, title: "What Actually Happened?", desc: "Distinguish conflict, teasing, bullying, and danger with clear categories.", badge: "Foundation", color: "#10B981", free: true, firstLessonSlug: "what-actually-happened/conflict-vs-bullying" },
  { num: 2, title: "What Is the Child Feeling?", desc: "Name and validate 9 emotions so your child feels heard before you respond.", badge: "Emotion", color: "#6366F1", firstLessonSlug: "what-is-child-feeling/naming-the-emotion" },
  { num: 3, title: "What Does Scripture Say?", desc: "Use Scripture to support truth and courage — not passivity or spiritual duct tape.", badge: "Scripture", color: "#8B5CF6", firstLessonSlug: "what-does-scripture-say/scripture-does-not-deny-pain" },
  { num: 4, title: "What the Child Can Say", desc: "Word-for-word boundary, exit, and help-seeking scripts they can use tomorrow.", badge: "Scripts", color: "#F59E0B", firstLessonSlug: "what-child-can-say/three-response-types" },
  { num: 5, title: "What Parents Should Do", desc: "Respond in the first 60 seconds. The Listen → Document → Decide framework.", badge: "Parent Response", color: "#3B82F6", firstLessonSlug: "what-parents-should-do/first-60-seconds" },
  { num: 6, title: "🟢🟡🔴 Escalation Framework", desc: "Know exactly when to coach, document, or escalate immediately. No more fog.", badge: "Decision Map", color: "#EF4444", firstLessonSlug: "green-yellow-red/green-monitor-and-coach" },
  { num: 7, title: "Forgiveness, Boundaries & Wisdom", desc: "Biblical forgiveness without enabling harm. Boundaries are not bitterness.", badge: "Faith & Wisdom", color: "#EC4899", firstLessonSlug: "forgiveness-boundaries-wisdom/what-forgiveness-is" },
  { num: 8, title: "The 7-Day Courage Ritual", desc: "Build the daily Scrolls + Journal + AI Servant habit that makes it all stick.", badge: "Ritual", color: "#6B46C1", firstLessonSlug: "seven-day-courage-ritual/the-daily-ritual" },
];

const TIERS = [
  {
    id: "starter",
    name: "Courage Starter",
    price: "$97",
    slug: "courage-covenant",
    desc: "90-minute core course + essential tools",
    includes: [
      "4 core modules",
      "7-Day Courage Challenge",
      "Parent response scripts",
      "Child reflection worksheets",
      "Green / Yellow / Red decision map",
      "30-day AI Servant trial",
    ],
    cta: "Start for $97",
    highlight: false,
  },
  {
    id: "full",
    name: "Courage Covenant™ Full",
    price: "$197",
    slug: "courage-covenant",
    desc: "Complete 8-module course — the full system",
    includes: [
      "All 8 modules (32 lessons)",
      "Every worksheet, script & template",
      "Parent guide + student reflection pages",
      "Green / Yellow / Red escalation map",
      "90-day AI Servant access",
      "Serenity Scrolls product integration",
      "Certificate of completion",
    ],
    cta: "Enroll for $197",
    highlight: true,
  },
  {
    id: "leader",
    name: "Leader Kit™",
    price: "$497",
    slug: "courage-covenant",
    desc: "Install this framework in your church or school",
    includes: [
      "Everything in Full Course",
      "Leader training track",
      "Small group discussion guides",
      "Parent communication templates",
      "Incident documentation checklist",
      "AI Servant in Leader Mode",
      "Bulk product discount code",
    ],
    cta: "Get the Leader Kit",
    highlight: false,
  },
];

function CourageCovenantContent() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  useEffect(() => {
    const checkEnrollment = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsEnrolled(false);
          return;
        }

        const { data: course } = await supabase
          .from("courses")
          .select("id")
          .eq("slug", "courage-covenant")
          .maybeSingle();

        if (course) {
          const { data: enrollment } = await supabase
            .from("course_enrollments")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", course.id)
            .maybeSingle();

          const { data: userRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .maybeSingle();

          setIsEnrolled(!!enrollment || !!userRole);
        }
      } catch (err) {
        console.error("Failed to check enrollment:", err);
      }
    };
    checkEnrollment();
  }, [supabase]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("enrolled") === "true") {
      toast.success("Enrollment successful!", {
        description: "Your course access is now active. Check your email for details.",
        duration: 8000,
      });
      window.history.replaceState({}, "", "/learn/courage-covenant");
    } else if (params.get("cancelled") === "true") {
      toast.error("Checkout cancelled", {
        description: "Your enrollment process was cancelled. You have not been charged.",
      });
      window.history.replaceState({}, "", "/learn/courage-covenant");
    }
  }, []);

  const handleEnroll = async (tier: typeof TIERS[0]) => {
    setLoading(tier.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/auth?redirect=/learn/courage-covenant`);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-course-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          courseSlug: tier.slug,
          userId: user.id,
          email: user.email,
          tierId: tier.id,
        }),
      });

      const { url, error } = await res.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <Navbar />

      <main className="font-['Vilonti']">
        {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-x-hidden pt-28 pb-20 px-6 text-center">
        <div className="absolute inset-0 pointer-events-none bg-[var(--gradient-hero)] opacity-20" />
        <div className="relative max-w-4xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 border border-primary/20 bg-primary/10 text-primary">
            ✝ Faith-Based · 8 Modules · 32 Lessons
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-foreground">
            Courage Covenant™
          </h1>
          <p className="text-2xl md:text-3xl text-foreground/80 font-light mb-4">
            A Scripture-Based Bullying Guidance Course
          </p>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            For parents, students & faith leaders who need more than "just pray about it." 
            Get clarity, courage, Scripture, and safe next steps.
          </p>

          {/* Big CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isEnrolled ? (
              <Button
                asChild
                className="px-8 py-6 rounded-full text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-glow hover:scale-105"
              >
                <Link href="/learn/courage-covenant/what-actually-happened/conflict-vs-bullying">
                  Resume Course
                </Link>
              </Button>
            ) : (
              <button
                id="hero-enroll-btn"
                onClick={() => handleEnroll(TIERS[1])}
                disabled={loading === "full"}
                className="px-8 py-4 rounded-full text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-glow hover:scale-105 disabled:opacity-60"
              >
                {loading === "full" ? "Redirecting..." : "Enroll Now — $197"}
              </button>
            )}
            <Link href="#modules" className="px-8 py-4 rounded-full text-lg font-semibold border border-primary/20 text-primary hover:bg-primary/10 transition-all">
              See All 8 Modules
            </Link>
          </div>

          {/* Disclaimer */}
          <p className="mt-6 text-xs text-muted-foreground/60">
            This course is a devotional and educational resource. It is not therapy, legal advice, or crisis intervention.
          </p>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Bullying Creates Panic.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {["Parents freeze.", "Students hide.", "Leaders hesitate.", "Churches lack scripts."].map((item) => (
              <div key={item} className="p-4 rounded-xl border border-border bg-card text-card-foreground text-sm font-medium shadow-soft">
                {item}
              </div>
            ))}
          </div>
          <p className="text-foreground/90 text-lg leading-relaxed">
            Faith communities often rush to forgiveness <em>without first addressing safety, truth, and boundaries.</em>
            That's not wisdom. That's spiritual duct tape over a leaking pipe.
          </p>
          <p className="mt-4 text-primary text-lg font-semibold">
            Courage Covenant™ creates the middle path: calm, biblical, practical, safety-aware response.
          </p>
        </div>
      </section>

      {/* THE FRAMEWORK */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">The 7-Step Framework</h2>
          <div className="flex flex-col gap-3">
            {[
              ["1", "Name What Happened", "Conflict? Teasing? Bullying? Danger?"],
              ["2", "Name the Emotion", "What is the child feeling right now?"],
              ["3", "Anchor in Scripture", "Truth, courage, wisdom, or comfort?"],
              ["4", "Give Words", "What can the child say? What should parents say?"],
              ["5", "Determine Severity", "🟢 Green / 🟡 Yellow / 🔴 Red"],
              ["6", "Take the Next Wise Step", "Reflect, document, communicate, or escalate."],
              ["7", "Continue the Ritual", "Scrolls + Journal + AI Servant = ongoing resilience."],
            ].map(([num, title, desc]) => (
              <div key={num} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors shadow-soft">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{num}</span>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">8 Modules. 32 Lessons.</h2>
          <p className="text-center text-muted-foreground mb-12">Module 1, Lesson 1 is free — no account required.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {MODULES.map((mod) => (
              <div key={mod.num} className="p-5 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all shadow-card group">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full text-foreground bg-primary/10 border border-primary/20">
                    {mod.badge}
                  </span>
                  {mod.free && <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-2 py-1 rounded-full">Free Preview</span>}
                </div>
                <p className="text-xs text-primary mb-1">Module {mod.num}</p>
                <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{mod.title}</h3>
                <p className="text-sm text-muted-foreground">{mod.desc}</p>
                {isEnrolled ? (
                  <Link href={`/learn/courage-covenant/${mod.firstLessonSlug}`}
                    className="inline-block mt-3 text-xs text-primary hover:opacity-80 transition-opacity font-semibold">
                    Go to Module →
                  </Link>
                ) : mod.free ? (
                  <Link href="/learn/courage-covenant/what-actually-happened/conflict-vs-bullying"
                    className="inline-block mt-3 text-xs text-green-600 dark:text-green-400 hover:opacity-80 transition-opacity font-semibold">
                    Start free lesson →
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Who This Is For</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "👩‍👧", title: "Christian Parents", items: ["Mothers of school-aged children", "Homeschool parents", "Parents of anxious or excluded kids", "Parents who want faith-based guidance, not passive advice"] },
              { icon: "⛪", title: "Youth Leaders", items: ["Youth pastors", "Small group leaders", "Children's ministry leaders", "Christian school teachers & coaches"] },
              { icon: "🙏", title: "Students", items: ["Selected worksheets and reflection prompts", "Always directed to trusted adults", "Safety-first approach", "Age-appropriate language"] },
            ].map((group) => (
              <div key={group.title} className="p-6 rounded-2xl border border-border bg-card shadow-soft">
                <div className="text-4xl mb-3">{group.icon}</div>
                <h3 className="font-bold text-foreground text-lg mb-4">{group.title}</h3>
                <ul className="space-y-2">
                  {group.items.map(item => <li key={item} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-primary mt-0.5">›</span>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GREEN YELLOW RED PREVIEW */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Remove the Fog. Know What to Do.</h2>
          <p className="text-muted-foreground mb-10">Module 6 gives you a decision map you'll use for life.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { level: "🟢 Green", label: "Monitor & Coach", color: "#10B981", desc: "One-time conflict, minor teasing, no threat. Listen, reflect, practice words, monitor." },
              { level: "🟡 Yellow", label: "Document & Involve", color: "#F59E0B", desc: "Repeated behavior, exclusion, online mockery, child distressed. Document and involve adults." },
              { level: "🔴 Red", label: "Escalate Now", color: "#EF4444", desc: "Physical harm, threats, abuse, self-harm. Stop. Contact authorities. Do not rely on this course alone." },
            ].map((row) => (
              <div key={row.level} className="p-5 rounded-2xl border bg-card shadow-soft" style={{ borderColor: row.color + "44" }}>
                <div className="text-2xl mb-2">{row.level}</div>
                <p className="font-bold mb-2" style={{ color: row.color }}>{row.label}</p>
                <p className="text-sm text-muted-foreground">{row.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">Choose Your Path</h2>
          <p className="text-center text-muted-foreground mb-12">All tiers include the Green / Yellow / Red escalation framework and AI Servant access.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div key={tier.id} className={`p-6 rounded-2xl border flex flex-col shadow-card ${tier.highlight ? "border-primary bg-primary/5 relative" : "border-border bg-card"}`}>
                {tier.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">Most Popular</div>}
                <h3 className="font-bold text-foreground text-lg mb-1">{tier.name}</h3>
                <p className="text-4xl font-bold text-foreground mb-2">{tier.price}</p>
                <p className="text-sm text-muted-foreground mb-6">{tier.desc}</p>
                <ul className="space-y-2 mb-8 flex-1">
                  {tier.includes.map(item => (
                    <li key={item} className="text-sm text-foreground/80 flex items-start gap-2">
                      <span className="text-primary mt-0.5 flex-shrink-0">✓</span>{item}
                    </li>
                  ))}
                </ul>
                {isEnrolled ? (
                  <Button
                    asChild
                    className={`w-full py-3 h-auto rounded-full font-bold transition-all ${tier.highlight ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "border border-primary text-primary hover:bg-primary/10"}`}
                  >
                    <Link href="/learn/courage-covenant/what-actually-happened/conflict-vs-bullying">
                      Access Course Player
                    </Link>
                  </Button>
                ) : (
                  <button
                    id={`enroll-${tier.id}-btn`}
                    onClick={() => handleEnroll(tier)}
                    disabled={!!loading}
                    className={`w-full py-3 rounded-full font-bold transition-all ${tier.highlight ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "border border-primary text-primary hover:bg-primary/10"} disabled:opacity-60`}
                  >
                    {loading === tier.id ? "Redirecting..." : tier.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-8">
            This course is not therapy, counseling, medical advice, legal advice, crisis care, or emergency support.
          </p>
        </div>
      </section>

      {/* AI SERVANT CTA */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-3xl font-bold text-foreground mb-4">Includes AI Servant Access</h2>
          <p className="text-muted-foreground mb-8">
            Your enrollment includes Courage Covenant Mode in the AI Servant — contextual reflection prompts for every module, parent guidance scripts, and the Green/Yellow/Red check-in built right in.
          </p>
          <Link href="/servant" className="inline-block px-8 py-3 rounded-full border border-primary text-primary hover:bg-primary/10 transition-all font-semibold">
            Try the AI Servant Free →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 border-t border-border text-center text-xs text-muted-foreground">
        <p className="mb-2">© {new Date().getFullYear()} Serenity Scrolls · <Link href="/privacy-policy" className="hover:text-foreground">Privacy</Link> · <Link href="/terms-of-service" className="hover:text-foreground">Terms</Link></p>
        <p>Courage Covenant™ is a devotional and educational resource. It is not therapy, legal advice, or crisis intervention. Always involve appropriate authorities when safety is at risk.</p>
      </footer>
      </main>
    </div>
  );
}

export default function CourageCovenanPage() {
  return <CourageCovenantContent />;
}
