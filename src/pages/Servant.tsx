import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Send, Loader2, Sparkles, BookOpen, ArrowRight } from "lucide-react";

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
  const [version, setVersion] = useState<"1.0" | "2.0">("2.0");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      // Redirect to new verification flow instead of old auth
      navigate("/servant-access");
      return;
    }

    setUser(session.user);

    // Check if user has access
    const { data: profile } = await supabase
      .from("profiles")
      .select("has_access")
      .eq("id", session.user.id)
      .single();

    if (!profile?.has_access) {
      toast.error("Please verify your purchase first");
      navigate("/servant-access");
      return;
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-20 max-w-4xl flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {version === "1.0" ? "Serenity Scrolls Servant" : "Serenity Scrolls Servant+"}
          </h1>
          <p className="text-muted-foreground mb-4">
            {version === "1.0"
              ? "Your spiritual companion for reflection and guidance"
              : "Advanced reflection with emotional intelligence and servant-leadership"}
          </p>
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
              <Sparkles className="h-4 w-4" />
              2.0 Advanced
            </button>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <p className="text-lg mb-2">
                  {version === "1.0"
                    ? "Welcome to Serenity Scrolls Servant"
                    : "Welcome to Serenity Scrolls Servant+"}
                </p>
                <p className="text-sm">
                  {version === "1.0"
                    ? "Tell me your mood, a moment, or the name or color of a scroll"
                    : "Tell me your mood, a moment, or the color of a scroll for an EQ-informed reflection"}
                </p>
              </div>
            )}

            {version === "1.0" && messages.filter(m => m.role === "user").length >= 3 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mx-auto max-w-md text-center">
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
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => window.open('/servant-upgrade', '_blank')}
                >
                  Upgrade Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                    }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
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

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
          <strong>Disclaimer:</strong> The Serenity Scrolls Servant is an AI-powered companion designed for spiritual reflection and Scripture-based guidance. It is not a substitute for professional counseling, medical advice, or pastoral care. Please consult qualified professionals for specific guidance.
        </p>
      </div>
    </div>
  );
};

export default Servant;
