import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TrialStatus {
  /** null = still loading */
  daysRemaining: number | null;
  /** subscription_status from profile */
  subscriptionStatus: string;
  /** true when subscription_status === 'active' */
  isActive: boolean;
  /** true when daysRemaining <= 7 and not yet active */
  isInOfferWindow: boolean;
  /** true when daysRemaining <= 3 and not yet active */
  isInUrgencyWindow: boolean;
  /** true when daysRemaining <= 0 and not active */
  isExpired: boolean;
  /** user email, if logged in */
  userEmail: string;
  /** user id, if logged in */
  userId: string;
  /** still fetching profile */
  loading: boolean;
}

/**
 * Reads the current user's trial status from their Supabase profile.
 * Provides computed booleans for offer window detection.
 */
export function useTrialStatus(): TrialStatus {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState("none");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchStatus() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !mounted) {
          setLoading(false);
          return;
        }

        setUserEmail(session.user.email ?? "");
        setUserId(session.user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("has_access, access_expires_at, subscription_status")
          .eq("id", session.user.id)
          .single();

        if (!mounted || !profile) {
          setLoading(false);
          return;
        }

        setSubscriptionStatus(profile.subscription_status ?? "none");

        if (profile.access_expires_at) {
          const expiresAt = new Date(profile.access_expires_at);
          const now = new Date();
          const days = Math.ceil(
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          setDaysRemaining(days);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchStatus();
    return () => { mounted = false; };
  }, []);

  const isActive = subscriptionStatus === "active";
  const isExpired = daysRemaining !== null && daysRemaining <= 0 && !isActive;
  const isInOfferWindow = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7 && !isActive;
  const isInUrgencyWindow = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 3 && !isActive;

  return {
    daysRemaining,
    subscriptionStatus,
    isActive,
    isInOfferWindow,
    isInUrgencyWindow,
    isExpired,
    userEmail,
    userId,
    loading,
  };
}
