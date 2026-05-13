"use client";

import Link from "next/link";
import { useState } from "react";

const INCLUDES = [
  "All 8 Courage Covenant™ modules (32 lessons)",
  "Separate leader training track",
  "Small group discussion guides (downloadable PDFs)",
  "Parent communication templates (fill-in-the-blank)",
  "Incident documentation checklist",
  "Green / Yellow / Red response system",
  "AI Servant in Leader Mode — scripts, parent comms & documentation flow",
  "Bulk product discount code for Serenity Scrolls & Journals",
];

const WHO = [
  { icon: "⛪", title: "Youth Pastors", desc: "Install a Scripture-based response framework in one meeting." },
  { icon: "🏫", title: "Christian Schools", desc: "Give staff a clear system for incident response and parent communication." },
  { icon: "🏠", title: "Homeschool Co-ops", desc: "Equip co-op leaders and parents with a shared framework." },
  { icon: "🌿", title: "Faith-Based Youth Programs", desc: "Camps, coaches, and community leaders who work with minors." },
];

const TIERS = [
  { name: "Pilot Kit", price: "$497", desc: "Perfect for trying the framework in one church or group.", best: false },
  { name: "Annual Church License", price: "$997", desc: "Full-year access for your entire leadership team.", best: true },
  { name: "School License", price: "$1,500+", desc: "Multi-staff access with custom onboarding support.", best: false },
];

export default function LeaderKitPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleBookCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // TODO: trigger CRM / Calendly integration
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-['Vilonti']">

      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border bg-background/90 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Serenity Scrolls" className="h-8 w-auto" />
          <span className="font-bold text-foreground text-sm">Serenity Scrolls</span>
        </Link>
        <Link href="/learn/courage-covenant" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Parent Course
        </Link>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[var(--gradient-hero)] opacity-20" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 border border-primary/20 bg-primary/10 text-primary">
            ✝ B2B · Churches · Schools · Youth Programs
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-foreground">
            Courage Covenant™<br />Leader Kit
          </h1>
          <p className="text-2xl text-foreground/80 font-light mb-4">
            Install a Scripture-Based Bullying Response System in One Meeting.
          </p>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Give your youth leaders, teachers, and coaches a ready-to-use framework — scripts, parent comms, escalation map, and AI Servant in Leader Mode. No guessing. No panic. Just wisdom.
          </p>
          <a href="#book-call"
            className="inline-block px-8 py-4 rounded-full text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-glow hover:scale-105">
            Book a Discovery Call
          </a>
        </div>
      </section>

      {/* WHO */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">Built for Faith-Based Organizations</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {WHO.map(w => (
              <div key={w.title} className="p-5 rounded-2xl border border-border bg-card shadow-soft">
                <div className="text-3xl mb-2">{w.icon}</div>
                <h3 className="font-bold text-foreground mb-1">{w.title}</h3>
                <p className="text-sm text-muted-foreground">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">What's Inside</h2>
          <ul className="space-y-3">
            {INCLUDES.map(item => (
              <li key={item} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card shadow-soft">
                <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                <span className="text-foreground/80 text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* LEADER MODE AI */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">AI Servant in Leader Mode</h2>
          <p className="text-muted-foreground mb-8">Your leaders get a specialized AI Servant mode built for youth ministry and school contexts.</p>
          <div className="grid md:grid-cols-3 gap-4 text-left">
            {[
              { title: "Incident Scripts", desc: "Type the incident type → get a Green/Yellow/Red script tailored to your context." },
              { title: "Parent Email Templates", desc: "Fill-in-the-blank parent communication templates generated on demand." },
              { title: "Documentation Checklist", desc: "A step-by-step incident documentation prompt — without storing sensitive minor data." },
            ].map(item => (
              <div key={item.title} className="p-4 rounded-xl border border-border bg-card shadow-soft">
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map(tier => (
              <div key={tier.name} className={`p-6 rounded-2xl border flex flex-col shadow-card ${tier.best ? "border-primary bg-primary/5 relative" : "border-border bg-card"}`}>
                {tier.best && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">Most Popular</div>}
                <h3 className="font-bold text-foreground text-lg mb-1">{tier.name}</h3>
                <p className="text-3xl font-bold text-foreground mb-3">{tier.price}</p>
                <p className="text-sm text-muted-foreground mb-6 flex-1">{tier.desc}</p>
                <a href="#book-call" className={`py-3 rounded-full text-center font-bold transition-all text-sm ${tier.best ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "border border-primary text-primary hover:bg-primary/10"}`}>
                  Book a Call
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-8">All pricing includes setup support. Annual renewals at 50–75% of original price.</p>
        </div>
      </section>

      {/* BOOK CALL FORM */}
      <section id="book-call" className="py-20 px-6 bg-muted/30">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Book a Discovery Call</h2>
          <p className="text-muted-foreground mb-8 text-sm">Tell us about your organization and we'll reach out within 24 hours.</p>
          {submitted ? (
            <div className="p-6 rounded-2xl border border-primary/40 bg-primary/10 text-foreground shadow-card">
              <p className="text-xl mb-2 text-primary">✓ Request received!</p>
              <p className="text-sm text-muted-foreground">We'll be in touch within 24 hours to schedule your call.</p>
            </div>
          ) : (
            <form onSubmit={handleBookCall} className="space-y-4">
              <input type="text" placeholder="Your name" required className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors shadow-soft" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" required className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors shadow-soft" />
              <input type="text" placeholder="Organization name & type (e.g. First Baptist Youth Ministry)" required className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors shadow-soft" />
              <textarea placeholder="Any specific needs or questions?" rows={3} className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none shadow-soft" />
              <button type="submit" id="leader-book-call-btn" className="w-full py-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all shadow-glow">
                Request Discovery Call →
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-border text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Serenity Scrolls · <Link href="/privacy-policy" className="hover:text-foreground">Privacy</Link> · <Link href="/terms-of-service" className="hover:text-foreground">Terms</Link></p>
        <p className="mt-1">Courage Covenant™ Leader Kit is an educational resource. It does not replace school policy, legal requirements, pastoral authority, or emergency intervention.</p>
      </footer>
    </div>
  );
}
