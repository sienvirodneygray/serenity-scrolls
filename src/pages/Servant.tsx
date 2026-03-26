import { useState, useEffect, useRef } from "react";
import { renderMarkdown } from "@/components/ChatMarkdown";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Send, Loader2, Sparkles, BookOpen, ArrowRight, Lock, Clock } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const Servant = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [version, setVersion] = useState<"1.0" | "2.0">("1.0");
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("none");
  const [upsellDismissed, setUpsellDismissed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canAccessV2 = subscriptionStatus === "active";

  const handleVersionSwitch = (v: "1.0" | "2.0") => {
    if (v !== version) {
      setVersion(v);
      setMessages([]);
      setThreadId(null);
    }
  };

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/unlock");
      return;
    }

    setUser(session.user);

    // Check access + expiry
    const { data: profile } = await supabase
      .from("profiles")
      .select("has_access, access_expires_at, subscription_status")
      .eq("id", session.user.id)
      .single();

    if (!profile?.has_access) {
      toast.error("Please verify your purchase first");
      navigate("/unlock");
      return;
    }

    // Check if access has expired
    if (profile.access_expires_at) {
      const expiresAt = new Date(profile.access_expires_at);
      const now = new Date();
      const remaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      setDaysRemaining(remaining);

      if (remaining <= 0 && profile.subscription_status !== "active") {
        navigate("/servant-expired");
        return;
      }
    }

    setSubscriptionStatus(profile.subscription_status || "none");

    // If user has active subscription, allow v2.0
    if (profile.subscription_status === "active") {
      setVersion("2.0");
    }

    // Load previous messages
    const { data: chatMessages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });

    if (chatMessages) {
      setMessages(chatMessages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })));
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const messageText = input;
    const userMessage: Message = { role: "user", content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Save user message
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "user",
      content: messageText
    });

    try {
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          message: messageText,
          threadId: threadId,
          version: version
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else {
          toast.error("Failed to get response");
        }
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

            const jsonStr = line.slice(6).trim();

            try {
              const parsed = JSON.parse(jsonStr);

              // Handle thread ID
              if (parsed.type === "thread_id") {
                setThreadId(parsed.threadId);
                console.log("Thread ID:", parsed.threadId);
              }

              // Handle content
              if (parsed.type === "content") {
                assistantContent += parsed.content;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return prev.map((m, i) =>
                      i === prev.length - 1 ? { ...m, content: assistantContent } : m
                    );
                  }
                  return [...prev, { role: "assistant", content: assistantContent }];
                });
              }

              // Handle done
              if (parsed.type === "done") {
                break;
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        // Save assistant message
        if (assistantContent) {
          await supabase.from("chat_messages").insert({
            user_id: user.id,
            role: "assistant",
            content: assistantContent
          });
        }
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error("Chat error:", error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-background to-background dark:from-gray-950 dark:via-background flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-20 max-w-3xl flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-1">
            {version === "1.0" ? (
              <>Serenity Scrolls <span className="text-primary">Servant</span></>
            ) : (
              <>Serenity Scrolls <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Servant+</span></>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mb-3">
            {version === "1.0"
              ? "Your spiritual companion for reflection and guidance"
              : "Advanced reflection with emotional intelligence and servant-leadership"}
          </p>

          {/* Version Toggle */}
          <div className="inline-flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => handleVersionSwitch("1.0")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${version === "1.0"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <BookOpen className="h-4 w-4" />
              1.0 Basic
            </button>
            <button
              onClick={() => handleVersionSwitch("2.0")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${version === "2.0"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {canAccessV2 ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              2.0 Advanced
              {!canAccessV2 && (
                <span className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1 py-0.5 rounded-full ml-1">PRO</span>
              )}
            </button>
          </div>

          {/* Days Remaining Badge */}
          {daysRemaining !== null && subscriptionStatus !== "active" && (
            <div className="mt-3">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${daysRemaining > 10 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : daysRemaining > 3 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                <Clock className="h-3 w-3" />
                {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
              </div>
            </div>
          )}
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
                {version === "1.0" ? "Servant" : "Servant+"}
              </p>
              <p className="text-[11px] text-muted-foreground">Scripture-guided spiritual companion</p>
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
                {/* Welcome Icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-150" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/15 to-amber-100/40 dark:to-amber-900/20 flex items-center justify-center border border-primary/10">
                    <span className="text-3xl">📜</span>
                  </div>
                </div>

                {/* Welcome Text */}
                <div className="text-center space-y-1 max-w-sm">
                  <p className="text-lg font-semibold">
                    {version === "1.0" ? "Welcome, friend" : "Welcome to Servant+"}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Share how you're feeling, name a scroll you drew, or tell me a color — and I'll meet you right where you are with Scripture and reflection.
                  </p>
                </div>

                {/* Suggestion Prompts */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {[
                    { emoji: "💙", label: "I'm feeling sad" },
                    { emoji: "😰", label: "I feel anxious" },
                    { emoji: "🙏", label: "I'm grateful today" },
                    { emoji: "💜", label: "I drew a purple scroll" },
                  ].map((prompt) => (
                    <button
                      key={prompt.label}
                      onClick={() => {
                        setInput(prompt.label);
                      }}
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
            {version === "1.0" && !upsellDismissed && messages.filter(m => m.role === "user").length >= 3 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mx-auto max-w-md text-center">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Upgrade to Servant 2.0</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                  Unlock vast biblical training, EQ insights, servant-leadership guidance, and deeper theological conversations.
                </p>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-300">$29.99/mo</span>
                  <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded-full font-medium">7-DAY FREE TRIAL</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                            },
                            body: JSON.stringify({ email: user?.email || "", userId: user?.id || "", tier: "plus" }),
                          }
                        );
                        const d = await res.json();
                        if (d.url) window.location.href = d.url;
                        else toast.error(d.error || "Could not start checkout");
                      } catch { toast.error("Could not start checkout."); }
                    }}
                  >
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
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* AI Avatar */}
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/15 to-amber-100/40 dark:to-amber-900/20 flex items-center justify-center shrink-0 mt-1 border border-primary/10">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border/50 shadow-sm rounded-bl-sm"
                    }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose-chat space-y-1">{renderMarkdown(msg.content)}</div>
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
};

export default Servant;
