import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Send Expiry Notice Emails
 *
 * Finds users whose trial has expired (past access_expires_at)
 * with no active subscription, and sends them an expiry notice
 * with a link to subscribe.
 *
 * Required secrets:
 *   RESEND_API_KEY — API key for Resend (email service)
 *   SITE_URL       — Base URL of the site
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const siteUrl = Deno.env.get("SITE_URL") || "https://serenityscrolls.faith";

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    // Find recently expired (within last 48 hours) to avoid spamming old records
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const { data: expiredUsers, error } = await supabase
      .from("profiles")
      .select("id, email, access_expires_at, subscription_status")
      .lt("access_expires_at", now.toISOString())
      .gt("access_expires_at", twoDaysAgo.toISOString())
      .or("subscription_status.is.null,subscription_status.eq.trial,subscription_status.eq.none,subscription_status.eq.cancelled");

    if (error) {
      console.error("Error querying expired users:", error);
      throw error;
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No recently expired users found.", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const user of expiredUsers) {
      if (!user.email) continue;

      // Mark access as revoked
      await supabase
        .from("profiles")
        .update({ has_access: false })
        .eq("id", user.id);

      if (resendKey) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
              to: [user.email],
              subject: "Your Serenity Scrolls free month has ended",
              html: `
                <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 16px;">
                    📜 Your free trial has ended
                  </h1>
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Your 30-day free access to the Serenity Scrolls Servant has come to an end.
                    We hope you've found peace and guidance through Scripture.
                  </p>
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Ready to continue? Subscribe to keep your AI spiritual companion active.
                  </p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${siteUrl}/servant-expired"
                       style="display: inline-block; background: linear-gradient(135deg, #d97706, #b45309);
                              color: white; font-weight: 600; padding: 14px 32px; border-radius: 8px;
                              text-decoration: none; font-size: 16px;">
                      Subscribe Now — $19.99/mo
                    </a>
                  </div>
                  <p style="color: #999; font-size: 14px; text-align: center; margin-top: 24px;">
                    Bought another Serenity Scrolls product?
                    <a href="${siteUrl}/unlock" style="color: #d97706;">Enter your Order ID</a>
                    for a new free month.
                  </p>
                  <p style="color: #999; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} Serenity Scrolls. All rights reserved.
                  </p>
                </div>
              `,
            }),
          });

          if (emailRes.ok) {
            sentCount++;
          } else {
            const errData = await emailRes.json();
            errors.push(`${user.email}: ${errData.message || "Send failed"}`);
          }
        } catch (emailErr) {
          errors.push(`${user.email}: ${emailErr}`);
        }
      } else {
        console.log(`[DRY RUN] Would email ${user.email}: trial expired`);
        sentCount++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Expiry notices processed.",
        total: expiredUsers.length,
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Expiry notice error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process expiry notices." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
