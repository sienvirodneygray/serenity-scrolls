"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Sparkles, X, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TrialOfferBannerProps {
  daysRemaining: number;
  userEmail: string;
  userId: string;
  /** "offer" = 7-day exclusive (10% off monthly + annual); "urgency" = 3-day (monthly only, no discount) */
  variant: "offer" | "urgency";
}

/**
 * TrialOfferBanner
 *
 * variant="offer"   → 7-day window:  10% off monthly ($17.99) + annual 4-months-free
 * variant="urgency" → 3-day window:  monthly $19.99 only, no discount, no annual
 */
export function TrialOfferBanner({
  daysRemaining,
  userEmail,
  userId,
  variant,
}: TrialOfferBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);

  if (dismissed) return null;

  const startCheckout = async (plan: "monthly" | "annual") => {
    setLoading(plan);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            email: userEmail,
            userId,
            plan,
            // Only apply coupon on the exclusive 7-day monthly offer
            coupon: variant === "offer" && plan === "monthly" ? "SERENITY10" : undefined,
          }),
        }
      );
      const d = await res.json();
      if (d.url) {
        window.location.href = d.url;
      } else {
        toast.error(d.error || "Could not start checkout");
      }
    } catch {
      toast.error("Could not start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  // ── OFFER variant: 7-day exclusive ─────────────────────────────────────────
  if (variant === "offer") {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden border border-amber-200 dark:border-amber-800 shadow-md">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/40" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />

        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                🎁 Exclusive Offer — {daysRemaining} Day{daysRemaining !== 1 ? "s" : ""} Left
              </p>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
                Sign up before your trial ends to unlock this deal
              </p>
            </div>
          </div>

          {/* Two plan cards: discounted monthly + annual */}
          <div className="grid sm:grid-cols-2 gap-3">
            {/* Monthly — 10% off */}
            <div className="bg-white/70 dark:bg-gray-900/50 rounded-xl border border-amber-200 dark:border-amber-700 p-4 flex flex-col gap-2">
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                Monthly — 10% Off
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs text-muted-foreground line-through">$19.99</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">$17.99</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Cancel anytime · Billed monthly</p>
              <Button
                size="sm"
                className="mt-auto w-full bg-amber-600 hover:bg-amber-700 text-white text-xs h-8"
                onClick={() => startCheckout("monthly")}
                disabled={loading !== null}
              >
                {loading === "monthly" ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <>Claim 10% Off <ArrowRight className="h-3 w-3 ml-1" /></>
                )}
              </Button>
            </div>

            {/* Annual — 4 months free */}
            <div className="bg-gradient-to-b from-amber-100/80 to-orange-50/80 dark:from-amber-900/30 dark:to-orange-900/20 rounded-xl border-2 border-amber-400 dark:border-amber-600 p-4 flex flex-col gap-2 relative">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                BEST VALUE
              </span>
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                Annual — 4 Months Free
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs text-muted-foreground line-through">$239.88</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">$19.99</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Billed $159.92/yr · Save $79.96</p>
              <Button
                size="sm"
                className="mt-auto w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs h-8"
                onClick={() => startCheckout("annual")}
                disabled={loading !== null}
              >
                {loading === "annual" ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <>Get Annual Plan <Zap className="h-3 w-3 ml-1" /></>
                )}
              </Button>
            </div>
          </div>

          <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60 text-center mt-3">
            ⏳ This exclusive offer expires with your trial · Standard pricing applies after
          </p>
        </div>
      </div>
    );
  }

  // ── URGENCY variant: 3-day — monthly only, standard price ──────────────────
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-red-200 dark:border-red-900 shadow-md">
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-orange-400" />

      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-red-300 hover:text-red-500 dark:hover:text-red-300 transition-colors z-10"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <Clock className="h-3.5 w-3.5 text-red-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
              ⏳ Only {daysRemaining} Day{daysRemaining !== 1 ? "s" : ""} Remaining
            </p>
            <p className="text-[11px] text-red-600/80 dark:text-red-400/70">
              Your free trial ends soon — subscribe to keep your Servant active
            </p>
          </div>
        </div>

        {/* Monthly only — no discount, no annual */}
        <div className="bg-white/70 dark:bg-gray-900/50 rounded-xl border border-red-200 dark:border-red-800 p-5 text-center">
          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Monthly Plan
          </p>
          <div className="flex items-baseline gap-1 justify-center mb-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">$19.99</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-4">Cancel anytime · Billed monthly</p>
          <Button
            className="w-full bg-red-600 hover:bg-red-700 text-white h-9"
            onClick={() => startCheckout("monthly")}
            disabled={loading !== null}
          >
            {loading === "monthly" ? (
              <span className="animate-pulse text-sm">Loading...</span>
            ) : (
              <>Subscribe Now — $19.99/mo <ArrowRight className="h-3.5 w-3.5 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
