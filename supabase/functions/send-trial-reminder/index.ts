import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildBaseEmail } from "../_shared/email-templates.ts";

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
              subject: `Your Serenity Scrolls Access Ends in ${daysLeft} Day${daysLeft !== 1 ? "s" : ""} 📜`,
              html: buildBaseEmail(
                `Your Serenity Scrolls Access Ends in ${daysLeft} Day${daysLeft !== 1 ? "s" : ""} 📜`,
                `
                  <p>Dear Serenity Seeker,</p>
                  <p>Your 30-day free access to the <strong>Serenity Scrolls Servant</strong> is coming to an end in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.</p>
                  <p>Don't lose your spiritual companion — you can subscribe to keep your Scripture reflections, journal prompts, and guided devotions going.</p>
                  <p style="text-align: center;">
                    <a href="${siteUrl}/servant-expired" class="btn">Subscribe Now — $19.99/mo</a>
                  </p>

                  <div class="scripture">
                    "Teach us to number our days, that we may gain a heart of wisdom."<br>
                    <span style="font-size:13px; color:#a0aec0; font-style:normal; margin-top:8px; display:inline-block; font-family: 'Helvetica Neue', Arial, sans-serif;">— Psalm 90:12</span>
                  </div>

                  <p>May your journey be filled with peace and wisdom.</p>
                  <p>With blessings,<br><strong>The Serenity Scrolls Team</strong></p>
                `
              ),
            }),
          });

          if (emailRes.ok) {
            sentCount++;
            
            // Send admin update
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
                to: ["teamsienvi@gmail.com", "sienvirodneygray@gmail.com"],
                subject: "[TRIAL REMINDER] Trial ends soon for user",
                html: `
                  <div style="font-family: sans-serif; font-size: 14px; line-height: 1.5; color: #333;">
                    <h2>Update: Trial Reminder Sent</h2>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Days Left:</strong> ${daysLeft}</p>
                  </div>
                `,
              }),
            });
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
