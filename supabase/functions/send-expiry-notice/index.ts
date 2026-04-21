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
              subject: "Your Serenity Scrolls Access Has Ended 📜",
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #d4af37; }
                    .content { padding: 30px 0; }
                    .button { display: inline-block; background: linear-gradient(135deg, #d4af37, #f4d03f); color: #1a1a1a; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                    .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h1 style="color: #d4af37; margin: 0;">📜 Access Ended 📜</h1>
                  </div>
                  <div class="content">
                    <p>Dear Serenity Seeker,</p>
                    <p>Your 30-day free access to the <strong>Serenity Scrolls Servant</strong> has come to an end.</p>
                    <p>We hope you've found peace and guidance through Scripture. If you are ready to continue your journey, you can subscribe to keep your AI spiritual companion active.</p>
                    <p style="text-align: center;">
                      <a href="${siteUrl}/servant-expired" class="button">Subscribe Now — $19.99/mo</a>
                    </p>
                    <p style="font-size: 14px; text-align: center; margin-top: 24px;">
                      Bought another Serenity Scrolls product?
                      <br>
                      <a href="${siteUrl}/unlock" style="color: #d4af37; text-decoration: none;">Enter your Order ID</a> for a new free month.
                    </p>
                    <p>With blessings,<br>The Serenity Scrolls Team</p>
                  </div>
                  <div class="footer">
                    <p>Serenity Scrolls - Your Path to Inner Peace</p>
                  </div>
                </body>
                </html>
              `,
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
                subject: "[TRIAL EXPIRED] Access ended for user",
                html: `
                  <div style="font-family: sans-serif; font-size: 14px; line-height: 1.5; color: #333;">
                    <h2>Update: Trial Expired</h2>
                    <p><strong>Email:</strong> ${user.email}</p>
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
