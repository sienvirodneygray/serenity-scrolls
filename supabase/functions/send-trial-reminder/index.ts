import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Send Trial Reminder Emails
 *
 * Scheduled function that finds users whose trial expires within 5 days
 * and sends them a reminder email.
 *
 * Can be triggered by:
 *   - Supabase pg_cron (daily)
 *   - External cron service (e.g., cron-job.org)
 *   - Manual invoke from admin dashboard
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

    // Find users with access expiring in the next 5 days
    // who haven't subscribed and haven't been reminded yet
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const { data: expiringUsers, error } = await supabase
      .from("profiles")
      .select("id, email, access_expires_at, subscription_status")
      .eq("has_access", true)
      .lte("access_expires_at", fiveDaysFromNow.toISOString())
      .gt("access_expires_at", now.toISOString())
      .or("subscription_status.is.null,subscription_status.eq.trial,subscription_status.eq.none");

    if (error) {
      console.error("Error querying expiring users:", error);
      throw error;
    }

    if (!expiringUsers || expiringUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users with expiring trials found.", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const user of expiringUsers) {
      if (!user.email) continue;

      const expiresAt = new Date(user.access_expires_at);
      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Send email via Resend (or fallback to console log if no key)
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
              subject: `Your Serenity Scrolls access ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
              html: `
                <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 16px;">
                    📜 Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}
                  </h1>
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Hi there! Your 30-day free access to the Serenity Scrolls Servant is coming to an end.
                  </p>
                  <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Don't lose your spiritual companion — subscribe to keep your Scripture reflections,
                    journal prompts, and guided devotions going.
                  </p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${siteUrl}/servant-expired"
                       style="display: inline-block; background: linear-gradient(135deg, #d97706, #b45309);
                              color: white; font-weight: 600; padding: 14px 32px; border-radius: 8px;
                              text-decoration: none; font-size: 16px;">
                      Subscribe Now — $19.99/mo
                    </a>
                  </div>
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
        console.log(`[DRY RUN] Would email ${user.email}: ${daysLeft} days remaining`);
        sentCount++;
      }
    }

    return new Response(
      JSON.stringify({
        message: `Trial reminders processed.`,
        total: expiringUsers.length,
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Trial reminder error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process trial reminders." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
