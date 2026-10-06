"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { isTrackingExcluded } from "@/lib/trackingExclusion";

/** Loads GA4 only for visitors who aren't internal traffic (decided client-side after mount). */
export function GoogleAnalyticsGate({ gaId }: { gaId: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(!isTrackingExcluded());
  }, []);

  return enabled ? <GoogleAnalytics gaId={gaId} /> : null;
}
