import { supabase } from "@/integrations/supabase/client";

/**
 * Track an outbound click to Amazon.
 *
 * Inserts a row into the `amazon_clicks` table so the Admin Dashboard
 * can display click analytics.
 *
 * Because `amazon_clicks.session_id` has a foreign-key to
 * `analytics_sessions.session_id`, we upsert the session first.
 */
export async function trackAmazonClick(
  productName: string,
  buttonLocation: string
) {
  try {
    // Get or create a session ID (persisted per browser session)
    let sessionId =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("ss_session_id")
        : null;

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("ss_session_id", sessionId);
      }
    }

    // Ensure the session row exists (FK requirement)
    await supabase
      .from("analytics_sessions")
      .upsert(
        {
          session_id: sessionId,
          entry_page: window.location.pathname,
          last_activity: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      );

    // Extract UTM params from current URL
    const params = new URLSearchParams(window.location.search);

    await supabase.from("amazon_clicks").insert({
      session_id: sessionId,
      page_path: window.location.pathname,
      product_name: productName,
      button_location: buttonLocation,
      utm_source: params.get("utm_source") || null,
      utm_campaign: params.get("utm_campaign") || null,
    });
  } catch (err) {
    // Fire-and-forget: never block the user from reaching Amazon
    console.error("Failed to track Amazon click:", err);
  }
}
