"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Shield, 
  BookOpen, 
  Users, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  Gift, 
  CheckCircle2, 
  Building, 
  GraduationCap, 
  ChevronDown, 
  MessageSquare,
  Bookmark,
  Heart
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface PartnershipTrack {
  id: string;
  name: string;
  icon: React.ReactNode;
  subject: string;
  body: string;
  description: string;
}

const B2B = () => {
  const [activeTrack, setActiveTrack] = useState<string>("church");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const tracks: PartnershipTrack[] = [
    {
      id: "church",
      name: "Churches & Parishes",
      icon: <Building className="h-5 w-5" />,
      subject: "Church Partnership Inquiry - Serenity Scrolls",
      body: "Hello Serenity Scrolls Team,\n\nWe are interested in partnering with you to bring Serenity Scrolls / Courage Covenant resources to our congregation.\n\nEstimated Gifting Units Needed:\nPreferred Timeline:\nAdditional Details:",
      description: "Equip your pastors, small groups, and staff with Scripture tools and faith-based counseling guidelines.",
    },
    {
      id: "school",
      name: "Christian Schools",
      icon: <GraduationCap className="h-5 w-5" />,
      subject: "Christian School Integration - Serenity Scrolls",
      body: "Hello Serenity Scrolls Team,\n\nWe would like to learn more about implementing your Courage Covenant bullying guidance and reflection tools in our school.\n\nGrade Levels:\nEstimated Students/Staff:\nAdditional Details:",
      description: "Establish biblically rooted bullying response categories and parent-facing communication guidelines.",
    },
    {
      id: "youth",
      name: "Youth Ministries",
      icon: <Bookmark className="h-5 w-5" />,
      subject: "Youth Ministry Group Discount - Serenity Scrolls",
      body: "Hello Serenity Scrolls Team,\n\nWe are interested in bulk ordering Reflection Journals and Scrolls for our Youth Ministry.\n\nEstimated Youth Group Size:\nPreferred Timeline:\nAdditional Details:",
      description: "Interactive discussion guides, lesson plans, and bulk-discounted devotional tools for youth leaders.",
    },
    {
      id: "counselor",
      name: "Counselors & Clinics",
      icon: <Heart className="h-5 w-5" />,
      subject: "Counselor & Ministry Partnership - Serenity Scrolls",
      body: "Hello Serenity Scrolls Team,\n\nI am a Christian counselor / ministry leader interested in using your AI Servant scripture companion and Reflection Journals with my clients.\n\nArea of Practice:\nEstimated Clients/Month:\nAdditional Details:",
      description: "Dedicated dashboard tools, advanced reflection scripting, and documentation layouts for counselors.",
    },
  ];

  const offerings = [
    {
      icon: <BookOpen className="h-10 w-10 text-primary" />,
      title: "Leader Kit Framework",
      description: "Complete curriculum licences, presentation slides, and discussion guides tailored for Youth Pastors, Faith Counselors, and Christian School Teachers.",
    },
    {
      icon: <Gift className="h-10 w-10 text-primary" />,
      title: "Bulk Devotional Gifts",
      description: "Wholesale rates on our signature color-coded Serenity Scrolls keepsake tubes and guided Reflection Journals for your entire congregation or staff.",
    },
    {
      icon: <Sparkles className="h-10 w-10 text-primary" />,
      title: "AI Servant Leader Mode",
      description: "Special counselor access with advanced script writing, custom counseling prompts, and Incident/Bullying response documentation templates.",
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Dedicated Partnership",
      description: "Direct onboarding support, communications templates for parents/guardians, and co-branded community rollout guides.",
    },
  ];

  const faqs: FAQItem[] = [
    {
      question: "What is the minimum order quantity for wholesale discounts?",
      answer: "Wholesale pricing begins at just 10 units of either the physical Serenity Scrolls Tube or the Guided Reflection Journal. Discounts scale dynamically based on total order size.",
    },
    {
      question: "How do the Courage Covenant digital licenses work for groups?",
      answer: "When you purchase the Leader Kit or group licenses, we issue unique custom enrollment codes for your members. They can register online (or bypass authentication if preferred) to access modules instantly.",
    },
    {
      question: "Can we co-brand or customize the inserts?",
      answer: "Yes! For orders exceeding 100 units, we offer custom-printed welcome cards, co-branded QR codes for AI Servant registration, and school-specific resource page inserts.",
    },
    {
      question: "Is the AI Servant tool safe for minors to use?",
      answer: "Absolutely. The AI Servant is designed with rigorous faith-centered safety boundaries. It does not store personal identifiable information, operates strictly on KJV biblical databases, and flags emergency or crisis terms to direct users to physical support paths.",
    },
  ];

  const selectedTrack = tracks.find((t) => t.id === activeTrack) || tracks[0];
  const mailtoUrl = `mailto:info@serenityscrolls.faith?subject=${encodeURIComponent(
    selectedTrack.subject
  )}&body=${encodeURIComponent(selectedTrack.body)}`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Decorative Glow Blobs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/5 via-amber-500/5 to-transparent blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-40 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-pink-500/5 via-primary/5 to-transparent blur-3xl rounded-full pointer-events-none -z-10" />

      <Navbar />

      <main className="flex-1 pt-32 pb-24 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-10">
            <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li className="flex items-center space-x-2">
                <span>/</span>
                <span className="text-foreground font-medium" aria-current="page">
                  Partners &amp; Organizations
                </span>
              </li>
            </ol>
          </nav>

          {/* Hero Section */}
          <section className="text-center max-w-4xl mx-auto mb-24 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border border-primary/20 bg-primary/10 text-primary uppercase tracking-wider backdrop-blur-sm shadow-sm animate-fade-in">
              ✝ Organization &amp; Partnership Hub
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
              Bring Scripture-based Encouragement <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-amber-600 to-pink-600">
                To Your Organization
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Equip your church, school, or community organization with faith-centered bullying response frameworks, custom AI tools, and bulk devotional guides.
            </p>

            <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="w-full sm:w-auto font-semibold px-8 h-12 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" asChild>
                <Link href="/learn/courage-covenant">
                  Explore the Leader Kit <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold px-8 h-12 hover:bg-muted/50 border-2 transition-all" asChild>
                <a href="#interactive-selector">
                  Select Partnership Path
                </a>
              </Button>
            </div>
          </section>

          {/* Interactive Partnership Selector */}
          <section id="interactive-selector" className="mb-24 scroll-mt-28">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <h2 className="text-3xl font-bold">1. Select Your Organization Profile</h2>
              <p className="text-muted-foreground text-sm">
                Choose a category below to generate custom inquiry templates and see how we integrate.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setActiveTrack(track.id)}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 text-center transition-all duration-300 ${
                    activeTrack === track.id
                      ? "border-primary bg-primary/5 text-primary shadow-md scale-105"
                      : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/45"
                  }`}
                >
                  <div className={`p-3 rounded-xl mb-3 ${activeTrack === track.id ? "bg-primary/10" : "bg-muted"}`}>
                    {track.icon}
                  </div>
                  <span className="font-semibold text-sm">{track.name}</span>
                </button>
              ))}
            </div>

            <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-2 max-w-xl">
                <div className="text-xs font-bold uppercase tracking-wider text-primary">Your Focus</div>
                <h4 className="text-xl font-bold">{selectedTrack.name} Integration</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedTrack.description}
                </p>
              </div>
              <div className="shrink-0 w-full md:w-auto">
                <Button size="lg" className="w-full font-semibold shadow hover:shadow-md" asChild>
                  <a href={mailtoUrl}>
                    <Mail className="mr-2 h-5 w-5" /> Inquire for {selectedTrack.name}
                  </a>
                </Button>
              </div>
            </div>
          </section>

          {/* Offerings Grid */}
          <section className="mb-24">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-3xl font-bold">2. Our Core Professional Solutions</h2>
              <p className="text-muted-foreground">
                Equip your team with the tools to support emotional wellbeing and respond to bullying using Scripture.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {offerings.map((offering, idx) => (
                <div 
                  key={idx} 
                  className="group relative bg-card/70 border border-border/80 backdrop-blur-sm rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col items-start gap-4 overflow-hidden"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10 p-3 rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
                    {offering.icon}
                  </div>
                  
                  <div className="relative z-10 space-y-2 flex-1">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                      {offering.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {offering.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Why Partner Section */}
          <section className="mb-24 bg-muted/40 border border-border rounded-3xl p-8 md:p-12 max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">The Biblical Safety Standard</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Faith-centered support isn't just about praying and hoping problems disappear. Our frameworks offer actionable scripts, category classification, and pastoral boundaries to keep children safe and counselors empowered.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    "KJV Scripture-guided response plans",
                    "Real-time AI Servant counselor assistant",
                    "Frictionless distribution with code templates",
                    "Customized parent-facing notifications",
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm font-medium">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graphic Box */}
              <div className="lg:col-span-5 relative group overflow-hidden rounded-2xl shadow-xl aspect-[4/3] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 flex flex-col justify-center items-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Safe &amp; Practical</h3>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-4">
                  Built to align with biblical guidance while maintaining proper safety policies and incident documentation formats.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Approved Ministry Standards
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Accordion */}
          <section className="mb-24 max-w-3xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
              <p className="text-muted-foreground text-sm">
                Get answers to common integration, safety, and pricing questions.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div key={index} className="border border-border rounded-xl bg-card overflow-hidden">
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="w-full flex items-center justify-between p-5 text-left font-semibold hover:bg-muted/30 transition-colors"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="p-5 pt-0 border-t border-border/50 text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Contact CTA Area */}
          <section className="max-w-4xl mx-auto">
            <div className="relative group overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 p-8 md:p-12 text-center space-y-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-3xl blur opacity-30 group-hover:opacity-40 transition duration-1000" />
              
              <div className="relative z-10 space-y-3">
                <h2 className="text-3xl font-bold tracking-tight">Wholesale &amp; Custom Partnerships</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Ready to launch Serenity Scrolls or the Courage Covenant™ at your school, diocese, or youth group? Reach out directly to receive custom integration support and scaled rates.
                </p>
              </div>

              <div className="relative z-10 pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="w-full sm:w-auto font-semibold px-8 h-12 shadow hover:-translate-y-0.5 transition-all" asChild>
                  <a href={mailtoUrl}>
                    <Mail className="mr-2 h-5 w-5" /> Email Partnerships Team
                  </a>
                </Button>
                <Button size="lg" variant="ghost" className="w-full sm:w-auto font-semibold h-12" asChild>
                  <Link href="/contact">
                    General Support <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              <p className="relative z-10 text-xs text-muted-foreground">
                Typically responds within 24-48 business hours • Wholesale pricing starts at 10+ units
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-muted/30 border-t border-border mt-auto relative z-10">
        <div className="container mx-auto px-4 text-center space-y-4">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} Serenity Scrolls. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="mailto:info@serenityscrolls.faith" className="text-muted-foreground hover:text-foreground transition-colors">
              info@serenityscrolls.faith
            </a>
            <span className="text-muted-foreground/30">|</span>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default B2B;
