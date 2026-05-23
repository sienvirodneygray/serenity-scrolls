"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

const DAYS = [
  { day: 1, title: "Name What Happened", desc: "Distinguish conflict from bullying. Give it the right category." },
  { day: 2, title: "Name the Emotion", desc: "Help your child find the real word for what they're feeling." },
  { day: 3, title: "Anchor in Scripture", desc: "Pull a Serenity Scroll that matches this exact emotion." },
  { day: 4, title: "Give Words", desc: "Practice one boundary sentence together — no pressure, just one." },
  { day: 5, title: "Determine Severity", desc: "Is this Green, Yellow, or Red? Know your next wise step." },
  { day: 6, title: "Take Action", desc: "Reflect, document, communicate, or escalate — one clear step." },
  { day: 7, title: "Start the Ritual", desc: "Begin the 7-step daily practice that keeps courage alive." },
];

export default function CourageChallengePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Subscribe to email list via existing Supabase magic link or newsletter function
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ email, name, source: "7-day-courage-challenge" }),
      });
      setSubmitted(true);
    } catch {
      // Still show success — don't block the user
      setSubmitted(true);
    } finally {
      setLoading(false);
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
        <div className="relative max-w-3xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 border border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400">
            ✓ Free · No credit card · Instant access
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-foreground">
            The 7-Day Courage Challenge
          </h1>
          <p className="text-xl text-foreground/80 font-light mb-4">
            When your child is hurting, you need more than "just pray about it."
          </p>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get 7 days of Scripture-based, parent-tested guidance — one email per day — to help you respond to bullying with clarity, courage, and wisdom.
          </p>

          {/* Opt-in form */}
          {submitted ? (
            <div className="max-w-md mx-auto p-8 rounded-2xl border border-green-500/40 bg-green-500/10 text-center shadow-card">
              <div className="text-5xl mb-4 text-green-600 dark:text-green-400">✓</div>
              <h2 className="text-xl font-bold text-foreground mb-2">You're in!</h2>
              <p className="text-muted-foreground text-sm mb-6">Check your inbox for Day 1. It's on its way.</p>
              <Link href="/learn/courage-covenant" className="inline-block px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all text-sm">
                See the Full Courage Covenant™ Course →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your first name"
                required
                className="w-full px-5 py-4 rounded-xl bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors text-lg shadow-soft"
              />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="w-full px-5 py-4 rounded-xl bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors text-lg shadow-soft"
              />
              <button
                type="submit"
                id="challenge-signup-btn"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg transition-all disabled:opacity-60 hover:scale-[1.02] shadow-glow"
              >
                {loading ? "Sending Day 1..." : "Send Me the Challenge — Free →"}
              </button>
              <p className="text-xs text-muted-foreground">No spam. Unsubscribe anytime. One email per day for 7 days.</p>
            </form>
          )}
        </div>
      </section>

      {/* 7 DAYS PREVIEW */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">What You'll Get — One Email Per Day</h2>
          <div className="space-y-3">
            {DAYS.map(d => (
              <div key={d.day} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card shadow-soft">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                  {d.day}
                </span>
                <div>
                  <p className="font-semibold text-foreground text-sm">Day {d.day}: {d.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOFT COURSE INTRO */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-muted-foreground text-sm mb-2">After the challenge</p>
          <h2 className="text-2xl font-bold text-foreground mb-4">Go Deeper with Courage Covenant™</h2>
          <p className="text-muted-foreground mb-8">
            The 7-Day Challenge is the introduction. The full Courage Covenant™ course gives you all 8 modules, 32 lessons, every worksheet, script, and template — plus 90 days of AI Servant access.
          </p>
          <Link href="/learn/courage-covenant" className="inline-block px-6 py-3 rounded-full border border-primary text-primary hover:bg-primary/10 font-semibold transition-all text-sm">
            See the Full Course →
          </Link>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-border text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Serenity Scrolls · <Link href="/privacy-policy" className="hover:text-foreground">Privacy</Link></p>
        <p className="mt-1">This challenge is a devotional resource. It is not therapy, legal advice, or crisis intervention.</p>
      </footer>
      </main>
    </div>
  );
}
