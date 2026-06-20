"use client";
import { useState, useEffect, useRef } from "react";
import { renderMarkdown } from "@/components/ChatMarkdown";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Send, Loader2, Sparkles, BookOpen, ArrowRight, Lock,
  Plus, PenSquare, Home, ChevronDown,
} from "lucide-react";
import { TrialOfferBanner } from "@/components/TrialOfferBanner";
import { useTrialStatus } from "@/hooks/useTrialStatus";

type Message = { role: "user" | "assistant"; content: string };

type Session = {
  messages: Message[];
  startedAt: Date;
  label: string;
};

function groupIntoSessions(rows: { role: string; content: string; created_at: string }[]): Session[] {
  if (!rows.length) return [];
  const GAP_MS = 2 * 60 * 60 * 1000;
  const sessions: Session[] = [];
  let current: Message[] = [];
  let sessionStart = new Date(rows[0].created_at);
  let lastTime = sessionStart;

  for (const row of rows) {
    const t = new Date(row.created_at);
    if (t.getTime() - lastTime.getTime() > GAP_MS) {
      sessions.push({ messages: current, startedAt: sessionStart, label: formatLabel(sessionStart) });
      current = [];
      sessionStart = t;
    }
    current.push({ role: row.role as "user" | "assistant", content: row.content });
    lastTime = t;
  }
  if (current.length) sessions.push({ messages: current, startedAt: sessionStart, label: formatLabel(sessionStart) });
  return sessions;
}

function formatLabel(date: Date): string {
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "long" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PROMPTS = [
  { emoji: "💭", label: "I'm carrying a heavy burden and need peace" },
  { emoji: "🌱", label: "I feel stuck and need guidance for my next step" },
  { emoji: "✨", label: "I need strength to overcome a challenge" },
  { emoji: "🙏", label: "I want to reflect on God's faithfulness" },
  { emoji: "💜", label: "I drew a purple scroll — what does it mean?" },
  { emoji: "🌅", label: "I'm feeling anxious about the future" },
];

const Servant = () => {
  const router = useRouter();
  const [messagesV1, setMessagesV1] = useState<Message[]>([]);
  const [messagesV2, setMessagesV2] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [threadIdV1, setThreadIdV1] = useState<string | null>(null);
  const [threadIdV2, setThreadIdV2] = useState<string | null>(null);
  const [version, setVersion] = useState<"1.0" | "2.0">("1.0");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionIdx, setActiveSessionIdx] = useState<number>(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const messages = version === "1.0" ? messagesV1 : messagesV2;
  const setMessages = version === "1.0" ? setMessagesV1 : setMessagesV2;
  const threadId = version === "1.0" ? threadIdV1 : threadIdV2;
  const setThreadId = version === "1.0" ? setThreadIdV1 : setThreadIdV2;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trialStatus = useTrialStatus();
  const canAccessV2 = trialStatus.subscriptionStatus === "active";

  useEffect(() => { checkAccess(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  const checkAccess = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isReturn = urlParams.get("subscription") === "success";
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/unlock"); return; }
    setUser(session.user);

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("has_access, access_expires_at, subscription_status")
        .eq("id", session.user.id)
        .single();
      return data;
    };

    let profile = await fetchProfile();
    if (isReturn && (!profile?.has_access || profile?.subscription_status !== "active")) {
      toast.info("Activating your subscription...");
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 1000));
        profile = await fetchProfile();
        if (profile?.subscription_status === "active" && profile?.has_access) break;
      }
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (!profile?.has_access) { toast.error("Please verify your purchase first"); router.push("/unlock"); return; }
    if (profile.access_expires_at) {
      const remaining = Math.ceil((new Date(profile.access_expires_at).getTime() - Date.now()) / 86400000);
      if (remaining <= 0 && profile.subscription_status !== "active") { router.push("/servant-expired"); return; }
    }
    if (profile.subscription_status === "active") setVersion("2.0");

    const reflection = urlParams.get("reflection");
    const lessonTitle = urlParams.get("title");
    if (reflection && lessonTitle) {
      setInput(`Regarding the lesson "${lessonTitle}", here is my reflection:\n\n"${reflection}"`);
    } else if (lessonTitle) {
      setInput(`I am studying the Courage Covenant lesson "${lessonTitle}". Let's reflect on it.`);
    }

    const { data: chatMessages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });

    if (chatMessages && chatMessages.length > 0) {
      const grouped = groupIntoSessions(chatMessages);
      setSessions(grouped);
      const last = grouped.length - 1;
      setActiveSessionIdx(last);
      setMessages(grouped[last].messages);
    }
  };

  const startNewSession = () => {
    setMessages([]);
    setThreadId(null);
    setActiveSessionIdx(sessions.length);
    setMobileSidebarOpen(false);
  };

  const loadSession = (idx: number) => {
    setMessages(sessions[idx].messages);
    setActiveSessionIdx(idx);
    setMobileSidebarOpen(false);
  };

  const handleVersionSwitch = (v: "1.0" | "2.0") => {
    if (v === "2.0" && !canAccessV2) { setShowUpgradeModal(true); return; }
    if (v !== version) setVersion(v);
  };

  const upgradeToV2 = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ email: user?.email || "", userId: user?.id || "", tier: "plus" }),
      });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
      else toast.error(d.error || "Could not start checkout");
    } catch { toast.error("Could not start checkout."); }
    finally { setLoading(false); setShowUpgradeModal(false); }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const messageText = input;
    const userMessage: Message = { role: "user", content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: messageText });

    try {
      const allMessages = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: allMessages, message: messageText, threadId, version }),
      });

      if (!response.ok) {
        toast.error(response.status === 429 ? "Rate limit exceeded. Please try again later." : "Failed to get response");
        setLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(line.slice(6).trim());
              if (parsed.type === "thread_id") setThreadId(parsed.threadId);
              if (parsed.type === "content") {
                assistantContent += parsed.content;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                  return [...prev, { role: "assistant", content: assistantContent }];
                });
              }
              if (parsed.type === "done") break;
            } catch { buffer = line + "\n" + buffer; break; }
          }
        }
        if (assistantContent) await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: assistantContent });
      }
    } catch (error) { toast.error("An error occurred"); console.error(error); }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Group sessions by label for sidebar
  const groupedSessions = [...sessions].reverse().reduce<Record<string, { idx: number; session: Session }[]>>((acc, s, ri) => {
    const idx = sessions.length - 1 - ri;
    const lbl = idx === sessions.length - 1 && activeSessionIdx === idx ? "Current" : s.label;
    if (!acc[lbl]) acc[lbl] = [];
    acc[lbl].push({ idx, session: s });
    return acc;
  }, {});

  return (
    <>
      {/* ── MOBILE SIDEBAR OVERLAY ──────────────────────────────── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <div className="h-screen flex overflow-hidden bg-background">
        {/* ── LEFT SIDEBAR ────────────────────────────────────────── */}
        <aside className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto
          w-[260px] flex-shrink-0 flex flex-col
          bg-zinc-950 dark:bg-zinc-950
          transition-transform duration-200 ease-in-out
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}>
          {/* Sidebar Top */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            {/* Logo */}
            <button onClick={() => router.push("/")} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <span className="text-xl">📜</span>
              <span className="text-sm font-semibold text-white/90">Serenity Scrolls</span>
            </button>
            {/* New Chat */}
            <button
              onClick={startNewSession}
              title="New conversation"
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <PenSquare className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat CTA — shown when no sessions */}
          {sessions.length === 0 && (
            <div className="px-3 pb-2">
              <button
                onClick={startNewSession}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm transition-colors border border-white/10"
              >
                <Plus className="w-4 h-4" />
                New conversation
              </button>
            </div>
          )}

          {/* Version Toggle in sidebar */}
          <div className="px-3 pb-3">
            <div className="flex rounded-lg bg-white/5 p-0.5">
              <button
                onClick={() => handleVersionSwitch("1.0")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${version === "1.0" ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"}`}
              >
                <BookOpen className="w-3.5 h-3.5" /> 1.0
              </button>
              <button
                onClick={() => handleVersionSwitch("2.0")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${version === "2.0" ? "bg-amber-500/20 text-amber-300" : "text-white/50 hover:text-white/80"}`}
              >
                {canAccessV2 ? <Sparkles className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                2.0 {!canAccessV2 && <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded-full">PRO</span>}
              </button>
            </div>
          </div>

          {/* Conversation History */}
          <div className="flex-1 overflow-y-auto px-2 space-y-4 pb-4 scrollbar-hide">
            {Object.entries(groupedSessions).map(([group, items]) => (
              <div key={group}>
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-2 mb-1">{group}</p>
                {items.map(({ idx, session: s }) => {
                  const preview = s.messages.find(m => m.role === "user")?.content || "New conversation";
                  const isActive = idx === activeSessionIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => loadSession(idx)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors group mb-0.5 ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white/90"
                      }`}
                    >
                      <p className="truncate text-[13px] leading-snug">{preview.slice(0, 45)}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{s.messages.length} messages</p>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-white/10 p-3 space-y-1">
            {/* Trial status */}
            {!trialStatus.loading && trialStatus.daysRemaining !== null && !trialStatus.isActive && (
              <div className="px-2 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-2">
                <p className="text-[11px] text-amber-300 font-medium">⏱ {trialStatus.daysRemaining} day{trialStatus.daysRemaining !== 1 ? "s" : ""} left in trial</p>
                {!canAccessV2 && (
                  <button onClick={() => setShowUpgradeModal(true)} className="text-[10px] text-amber-400/70 hover:text-amber-300 underline underline-offset-2 mt-0.5 transition-colors">
                    Upgrade to Servant+
                  </button>
                )}
              </div>
            )}
            <button onClick={() => router.push("/")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 text-sm transition-colors">
              <Home className="w-4 h-4" /> Home
            </button>
          </div>
        </aside>

        {/* ── MAIN CHAT AREA ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">

          {/* Top Bar (mobile menu + trial banner) */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/80 backdrop-blur-sm shrink-0">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Title */}
            <div className="flex-1 flex items-center gap-2">
              <span className="font-semibold text-sm">
                {version === "1.0" ? "Servant" : <span className="bg-gradient-to-r from-amber-500 to-orange-400 bg-clip-text text-transparent font-bold">Servant+</span>}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] text-muted-foreground hidden sm:inline">Scripture-guided companion</span>
            </div>

            {/* New Chat (desktop shortcut) */}
            <button
              onClick={startNewSession}
              className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors border border-border/50"
            >
              <Plus className="w-3.5 h-3.5" /> New chat
            </button>
          </div>

          {/* Trial Offer Banner */}
          {!trialStatus.loading && trialStatus.isInOfferWindow && (
            <div className="px-4 pt-3 shrink-0">
              <TrialOfferBanner
                daysRemaining={trialStatus.daysRemaining!}
                userEmail={trialStatus.userEmail}
                userId={trialStatus.userId}
                variant={trialStatus.isInUrgencyWindow ? "urgency" : "offer"}
              />
            </div>
          )}

          {/* ── MESSAGES AREA ─────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto" id="messages-scroll">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">

              {/* Welcome / Empty State */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                  {/* Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-400/20 blur-3xl rounded-full scale-150" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400/30 to-orange-500/20 border border-amber-400/20 flex items-center justify-center shadow-xl">
                      <span className="text-4xl">📜</span>
                    </div>
                  </div>

                  {/* Welcome Text */}
                  <div className="text-center space-y-2 max-w-md">
                    <h2 className="text-2xl font-bold">
                      {version === "1.0" ? "How can I serve you today?" : "Welcome to Servant+"}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {version === "1.0"
                        ? "Share how you're feeling, name a scroll you drew, or describe a color — and I'll meet you with Scripture and reflection."
                        : "Advanced reflection with deeper EQ insights, servant-leadership guidance, and theological depth."}
                    </p>
                  </div>

                  {/* Suggestion Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                    {PROMPTS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => { setInput(p.label); textareaRef.current?.focus(); }}
                        className="flex items-start gap-3 p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/50 hover:border-amber-300/40 transition-all text-left group shadow-sm"
                      >
                        <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">{p.emoji}</span>
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-snug">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 py-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {/* AI Avatar */}
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/30 to-orange-500/20 border border-amber-400/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-base">📜</span>
                    </div>
                  )}

                  <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm shadow-sm"
                      : "bg-card border border-border/50 shadow-sm rounded-tl-sm"
                  }`}>
                    {msg.role === "assistant"
                      ? <div className="prose-chat space-y-1">{renderMarkdown(msg.content)}</div>
                      : <p className="whitespace-pre-wrap">{msg.content}</p>
                    }
                  </div>

                  {/* User Avatar */}
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">
                        {user?.email?.[0]?.toUpperCase() ?? "U"}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex gap-3 py-2 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/30 to-orange-500/20 border border-amber-400/20 flex items-center justify-center shrink-0">
                    <span className="text-base">📜</span>
                  </div>
                  <div className="bg-card border border-border/50 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1.5 items-center h-4">
                      <div className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Upsell — after 3 messages for non-subscribers */}
              {version === "1.0" && !canAccessV2 && messages.filter(m => m.role === "user").length >= 3 && (
                <div className="my-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Upgrade to Servant+</span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-3 max-w-xs mx-auto">
                    Unlock deeper biblical training, EQ insights, and servant-leadership guidance.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-300">$29.99/mo</span>
                    <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full font-medium">7-DAY FREE</span>
                  </div>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white mt-3" onClick={upgradeToV2}>
                    Start Free Trial <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>

          {/* ── INPUT BAR ─────────────────────────────────────────── */}
          <div className="shrink-0 border-t border-border/40 bg-background/80 backdrop-blur-sm px-4 py-3">
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-end gap-2 bg-card border border-border/60 rounded-2xl shadow-sm px-4 py-3 focus-within:border-amber-400/50 focus-within:ring-1 focus-within:ring-amber-400/20 transition-all">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Share how you're feeling… (Enter to send, Shift+Enter for new line)"
                  disabled={loading}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-h-[24px] max-h-[160px] py-0 scrollbar-hide"
                  style={{ lineHeight: "1.5" }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="shrink-0 w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
                Servant provides Scripture-based reflection, not professional counseling or medical advice.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── UPGRADE MODAL ─────────────────────────────────────────── */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" /> Upgrade to Servant+
            </DialogTitle>
            <DialogDescription>
              Access deeper EQ insights, emotional intelligence, and servant-leadership guidance with an active subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/50 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Servant+ Monthly</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">$29.99/mo</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 7-day free trial</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Unlimited Servant+ access</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Deeper theological framework</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> EQ & servant-leadership guidance</li>
            </ul>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={upgradeToV2} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Start Free Trial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Servant;
