import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Loader2, Sparkles, BookOpen } from "lucide-react";

type Message = {
    role: "user" | "assistant";
    content: string;
};

const STORAGE_KEY_V1 = "servant-test-messages-v1";
const STORAGE_KEY_V2 = "servant-test-messages-v2";

const getStorageKey = (v: string) => v === "1.0" ? STORAGE_KEY_V1 : STORAGE_KEY_V2;

const loadMessages = (v: string): Message[] => {
    try {
        const stored = (typeof window !== 'undefined' ? window.localStorage.getItem.bind(window.localStorage) : () => null)(getStorageKey(v));
        return stored ? JSON.parse(stored) : [];
    } catch { return []; }
};

const saveMessages = (v: string, msgs: Message[]) => {
    (typeof window !== 'undefined' ? window.localStorage.setItem.bind(window.localStorage) : () => null)(getStorageKey(v), JSON.stringify(msgs));
};

const ServantTest = () => {
    const [version, setVersion] = useState<"1.0" | "2.0">("2.0");
    const [messages, setMessages] = useState<Message[]>(() => loadMessages("2.0"));
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        saveMessages(version, messages);
    }, [messages, version]);

    const handleVersionSwitch = (v: "1.0" | "2.0") => {
        if (v !== version) {
            setVersion(v);
            setMessages(loadMessages(v));
        }
    };

    const clearChat = () => {
        setMessages([]);
        saveMessages(version, []);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const messageText = input;
        const userMessage: Message = { role: "user", content: messageText };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput("");
        setLoading(true);

        try {
            const allMessages = updatedMessages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
                },
                body: JSON.stringify({
                    messages: allMessages,
                    message: messageText,
                    version: version
                }),
            });

            if (!response.ok) {
                const errBody = await response.text().catch(() => "");
                console.error("Chat API error:", response.status, errBody);
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

                            if (parsed.type === "done") {
                                break;
                            }
                        } catch {
                            buffer = line + "\n" + buffer;
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl flex flex-col">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold mb-2">
                        {version === "1.0" ? "Servant 1.0" : "Servant+ 2.0"}
                    </h1>
                    <p className="text-muted-foreground text-sm mb-4">Test Mode</p>
                    <div className="inline-flex items-center gap-1 bg-muted rounded-lg p-1 mb-3">
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
                    {messages.length > 0 && (
                        <div>
                            <button
                                onClick={clearChat}
                                className="text-xs text-muted-foreground hover:text-foreground underline"
                            >
                                Clear chat
                            </button>
                        </div>
                    )}
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: "60vh" }}>
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
            </div>
        </div>
    );
};

export default ServantTest;
