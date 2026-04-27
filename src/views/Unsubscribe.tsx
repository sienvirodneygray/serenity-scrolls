"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, MailX } from "lucide-react";

/**
 * /unsubscribe
 *
 * Handles email marketing unsubscribes from the trial offer flow.
 * Reads ?email= from URL (populated by the email link).
 * Calls the Supabase suppressions table via a simple fetch.
 */
const Unsubscribe = () => {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams?.get("email") ?? "";
  const [email, setEmail] = useState(prefillEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setStatus("loading");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/unsubscribe-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ email }),
        }
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to unsubscribe");
      }
      setStatus("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-md mx-auto">

          {status === "done" ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold">You're Unsubscribed</h1>
              <p className="text-muted-foreground leading-relaxed">
                <strong>{email}</strong> has been removed from our trial email sequence.
                You won't receive any further offer emails from us.
              </p>
              <p className="text-sm text-muted-foreground">
                You can still access Serenity Scrolls and subscribe at any time at{" "}
                <a href="/servant-expired" className="text-amber-600 underline underline-offset-2">
                  serenityscrolls.faith
                </a>.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                  <MailX className="h-7 w-7 text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold">Unsubscribe</h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Enter your email below and we'll remove you from our trial reminder emails immediately.
                </p>
              </div>

              <form onSubmit={handleUnsubscribe} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="unsub-email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <input
                    id="unsub-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {status === "error" && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={status === "loading" || !email}
                >
                  {status === "loading" ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Unsubscribing...</>
                  ) : (
                    "Unsubscribe Me"
                  )}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center">
                You'll continue to receive transactional emails (order confirmations, access codes).
                Only marketing emails will stop.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Unsubscribe;
