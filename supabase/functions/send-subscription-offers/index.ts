import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Send Subscription Offer Emails — 3-Email Flow
 *
 * EMAIL 1 (7 days before expiry): Exclusive offer
 *   - 10% off monthly ($19.99 → $17.99/mo) OR
 *   - Annual plan at $19.99/mo (4 months FREE — saves $79.96)
 *
 * EMAIL 2 (3 days before expiry): Friendly reminder, no discount
 *
 * EMAIL 3 (on/after expiry): Access ended, subscribe to re-activate
 *
 * Each email is sent only once per user via tracking columns:
 *   offer_7day_sent_at, offer_3day_sent_at, offer_expiry_sent_at
 *
 * Required Supabase secrets:
 *   RESEND_API_KEY
 *   SITE_URL
 *
 * Can be triggered manually or via pg_cron (daily).
 */

// ─── Shared email styles ──────────────────────────────────────────────────────
const EMAIL_STYLES = `
  body { font-family: 'Georgia', serif; line-height: 1.7; color: #2d2d2d; max-width: 600px; margin: 0 auto; padding: 0; background: #fafaf8; }
  .wrapper { background: #fff; border: 1px solid #e8e0d0; border-radius: 12px; overflow: hidden; margin: 20px; }
  .header { background: linear-gradient(135deg, #1a0f00 0%, #3d2200 100%); text-align: center; padding: 40px 30px 30px; }
  .header h1 { color: #d4af37; margin: 0; font-size: 26px; letter-spacing: 1px; }
  .header p { color: #c8b89a; margin: 8px 0 0; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; }
  .content { padding: 36px 40px; }
  .content p { margin: 0 0 16px; font-size: 16px; }
  .offer-box { background: linear-gradient(135deg, #fff8e7 0%, #fef3c7 100%); border: 2px solid #d4af37; border-radius: 12px; padding: 28px 30px; margin: 28px 0; text-align: center; }
  .offer-box h2 { color: #92400e; margin: 0 0 8px; font-size: 20px; }
  .offer-box .price-old { color: #9ca3af; text-decoration: line-through; font-size: 15px; }
  .offer-box .price-new { color: #1a0f00; font-size: 28px; font-weight: bold; margin: 6px 0; }
  .offer-box .price-sub { color: #78716c; font-size: 14px; }
  .divider { border: none; border-top: 1px solid #e8e0d0; margin: 8px 0 24px; }
  .btn { display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); color: #1a0f00 !important; padding: 16px 36px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; margin: 8px 6px; letter-spacing: 0.5px; }
  .btn-outline { display: inline-block; background: transparent; color: #d4af37 !important; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 15px; margin: 8px 6px; letter-spacing: 0.5px; border: 2px solid #d4af37; }
  .urgency { background: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; }
  .urgency p { color: #991b1b; margin: 0; font-size: 15px; font-weight: bold; }
  .scripture { font-style: italic; color: #78716c; font-size: 15px; text-align: center; padding: 16px 20px; border-top: 1px solid #e8e0d0; border-bottom: 1px solid #e8e0d0; margin: 20px 0; }
  .footer { background: #f5f0e8; text-align: center; padding: 24px; color: #78716c; font-size: 13px; border-top: 1px solid #e8e0d0; }
  .footer a { color: #d4af37; text-decoration: none; }
`;

// ─── Email 1: 7-Day Exclusive Offer ──────────────────────────────────────────
function buildEmail1(siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>An Exclusive Gift — Before Your Access Ends</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>📜 A Gift Just for You</h1>
      <p>Your Exclusive Offer — 7 Days Remaining</p>
    </div>
    <div class="content">
      <p>Dear Serenity Seeker,</p>
      <p>Your 30-day free journey with the <strong>Serenity Scrolls Servant</strong> is drawing to a close — and we'd love for you to stay.</p>
      <p>As a thank-you for walking with us, we're offering you something special — exclusively for the next 7 days:</p>

      <div class="offer-box">
        <h2>🎁 Choose Your Path</h2>
        <hr class="divider">

        <p style="font-weight:bold; color:#92400e; font-size:17px; margin-bottom:4px;">OPTION 1 — Monthly, 10% Off</p>
        <p class="price-old">Regular: $19.99/month</p>
        <p class="price-new">$17.99<span style="font-size:16px">/month</span></p>
        <p class="price-sub">Cancel anytime · Billed monthly</p>
        <p style="margin:18px 0 0;">
          <a href="${siteUrl}/servant-expired?plan=monthly&offer=true" class="btn">Claim 10% Off Monthly</a>
        </p>

        <hr class="divider" style="margin: 28px 0;">

        <p style="font-weight:bold; color:#92400e; font-size:17px; margin-bottom:4px;">OPTION 2 — Annual Plan, 4 Months FREE</p>
        <p class="price-old">Would cost: $239.88/year</p>
        <p class="price-new">$19.99<span style="font-size:16px">/month</span></p>
        <p class="price-sub">Billed as $159.92/year · Save $79.96 (4 months free!)</p>
        <p style="margin:18px 0 0;">
          <a href="${siteUrl}/servant-expired?plan=annual" class="btn-outline">Get Annual — 4 Months Free</a>
        </p>
      </div>

      <div class="urgency">
        <p>⏳ This exclusive offer expires in 7 days. After that, standard pricing applies.</p>
      </div>

      <div class="scripture">
        "Be still, and know that I am God." — Psalm 46:10
      </div>

      <p>Your Servant has been here every step — offering Scripture reflections, journal prompts, and guided devotions. We'd be honoured to continue walking alongside you.</p>
      <p>With blessings,<br><strong>The Serenity Scrolls Team</strong></p>
    </div>
    <div class="footer">
      <p>Serenity Scrolls · <a href="${siteUrl}">serenityscrolls.faith</a></p>
      <p><a href="${siteUrl}/unsubscribe">Unsubscribe</a> · You're receiving this because your trial is ending soon.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email 2: 3-Day Reminder (No Discount) ───────────────────────────────────
function buildEmail2(daysLeft: number, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Only ${daysLeft} Days Left with Your Servant</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>📜 Only ${daysLeft} Days Left</h1>
      <p>Your Free Trial Is Almost Over</p>
    </div>
    <div class="content">
      <p>Dear Serenity Seeker,</p>
      <p>Time is almost up — your free access to the <strong>Serenity Scrolls Servant</strong> ends in just <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong>.</p>
      <p>Don't lose your daily companion for Scripture reflection, prayer journaling, and guided devotions. Subscribing keeps everything seamlessly active — no setup required.</p>

      <div class="offer-box">
        <h2>Continue Your Journey</h2>
        <p class="price-new">$19.99<span style="font-size:16px">/month</span></p>
        <p class="price-sub">Cancel anytime · Billed monthly</p>
        <p style="margin:20px 0 0;">
          <a href="${siteUrl}/servant-expired?plan=monthly" class="btn">Subscribe Now — $19.99/mo</a>
        </p>
      </div>

      <div class="urgency">
        <p>⏳ Your access ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Subscribe now to keep your Servant active.</p>
      </div>

      <div class="scripture">
        "Trust in the Lord with all your heart and lean not on your own understanding." — Proverbs 3:5
      </div>

      <p>If you have any questions or need help, simply reply to this email and we'll be right there.</p>
      <p>With blessings,<br><strong>The Serenity Scrolls Team</strong></p>
    </div>
    <div class="footer">
      <p>Serenity Scrolls · <a href="${siteUrl}">serenityscrolls.faith</a></p>
      <p><a href="${siteUrl}/unsubscribe">Unsubscribe</a> · You're receiving this because your trial is ending soon.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email 3: Expiry / Access Ended ──────────────────────────────────────────
function buildEmail3(siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Serenity Scrolls Access Has Ended</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>📜 Your Access Has Ended</h1>
      <p>But Your Journey Doesn't Have To</p>
    </div>
    <div class="content">
      <p>Dear Serenity Seeker,</p>
      <p>Your 30-day free access to the <strong>Serenity Scrolls Servant</strong> has come to an end. We hope it has been a source of peace, reflection, and spiritual growth.</p>
      <p>Whenever you're ready to continue, your Servant will be waiting:</p>

      <div class="offer-box">
        <h2>Re-Activate Your Servant</h2>
        <p class="price-new">$19.99<span style="font-size:16px">/month</span></p>
        <p class="price-sub">Or go annual and get 4 months free — $159.92/year</p>
        <p style="margin:20px 0 0;">
          <a href="${siteUrl}/servant-expired?plan=monthly" class="btn">Subscribe — $19.99/month</a>
        </p>
        <p style="margin:12px 0 0;">
          <a href="${siteUrl}/servant-expired?plan=annual" class="btn-outline">Annual Plan — 4 Months Free</a>
        </p>
      </div>

      <p style="text-align:center; font-size:14px; color:#78716c;">
        Bought another Serenity Scrolls product?<br>
        <a href="${siteUrl}/unlock" style="color:#d4af37; text-decoration:none; font-weight:bold;">Enter your Order ID</a> for a new free month.
      </p>

      <div class="scripture">
        "The Lord is my shepherd; I shall not want." — Psalm 23:1
      </div>

      <p>We pray your path continues to be filled with His peace and wisdom. We'd be honoured to walk alongside you again.</p>
      <p>With blessings,<br><strong>The Serenity Scrolls Team</strong></p>
    </div>
    <div class="footer">
      <p>Serenity Scrolls · <a href="${siteUrl}">serenityscrolls.faith</a></p>
      <p><a href="${siteUrl}/unsubscribe">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
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

    // Allow manual override via request body (for testing)
    let body: { test_email?: string; test_stage?: "7day" | "3day" | "expiry" } = {};
    try {
      if (req.method === "POST") {
        body = await req.json();
      }
    } catch (_) { /* ignore */ }

    const now = new Date();
    const stats = { email1_sent: 0, email2_sent: 0, email3_sent: 0, errors: [] as string[] };

    // ── Helper: send one email via Resend ──────────────────────────────────
    async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
      if (!resendKey) {
        console.log(`[DRY RUN] Would send "${subject}" to ${to}`);
        return true;
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
          to: [to],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Resend error");
      }
      return true;
    }

    // ── Helper: send admin notification ───────────────────────────────────
    async function notifyAdmin(label: string, email: string) {
      if (!resendKey) return;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
          to: ["teamsienvi@gmail.com", "sienvirodneygray@gmail.com"],
          subject: `[${label}] Offer email sent`,
          html: `<div style="font-family:sans-serif;font-size:14px;"><h2>${label}</h2><p><strong>Email:</strong> ${email}</p></div>`,
        }),
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // EMAIL 1: 7-Day Exclusive Offer
    // Find users expiring in 6–8 days, offer_7day_sent_at IS NULL
    // ══════════════════════════════════════════════════════════════════════
    if (!body.test_stage || body.test_stage === "7day") {
      const windowStart = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
      const windowEnd   = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

      const { data: users7 } = await supabase
        .from("profiles")
        .select("id, email, access_expires_at")
        .eq("has_access", true)
        .is("offer_7day_sent_at", null)
        .gte("access_expires_at", windowStart.toISOString())
        .lte("access_expires_at", windowEnd.toISOString())
        .or("subscription_status.is.null,subscription_status.eq.trial,subscription_status.eq.none");

      // Manual test override
      const targets7 = body.test_email
        ? [{ id: "test", email: body.test_email }]
        : (users7 || []);

      for (const user of targets7) {
        if (!user.email) continue;
        try {
          await sendEmail(
            user.email,
            "🎁 An Exclusive Gift Before Your Serenity Scrolls Access Ends",
            buildEmail1(siteUrl)
          );
          if (user.id !== "test") {
            await supabase.from("profiles").update({ offer_7day_sent_at: now.toISOString() }).eq("id", user.id);
          }
          await notifyAdmin("OFFER 7-DAY", user.email);
          stats.email1_sent++;
        } catch (e: any) {
          stats.errors.push(`[7day] ${user.email}: ${e.message}`);
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // EMAIL 2: 3-Day Reminder (No Discount)
    // Find users expiring in 2–4 days, offer_3day_sent_at IS NULL
    // ══════════════════════════════════════════════════════════════════════
    if (!body.test_stage || body.test_stage === "3day") {
      const windowStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const windowEnd   = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

      const { data: users3 } = await supabase
        .from("profiles")
        .select("id, email, access_expires_at")
        .eq("has_access", true)
        .is("offer_3day_sent_at", null)
        .gte("access_expires_at", windowStart.toISOString())
        .lte("access_expires_at", windowEnd.toISOString())
        .or("subscription_status.is.null,subscription_status.eq.trial,subscription_status.eq.none");

      const targets3 = body.test_email
        ? [{ id: "test", email: body.test_email, access_expires_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() }]
        : (users3 || []);

      for (const user of targets3) {
        if (!user.email) continue;
        try {
          const expiresAt = new Date(user.access_expires_at);
          const daysLeft = Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          await sendEmail(
            user.email,
            `⏳ Only ${daysLeft} Days Left — Keep Your Serenity Scrolls Servant`,
            buildEmail2(daysLeft, siteUrl)
          );
          if (user.id !== "test") {
            await supabase.from("profiles").update({ offer_3day_sent_at: now.toISOString() }).eq("id", user.id);
          }
          await notifyAdmin("OFFER 3-DAY", user.email);
          stats.email2_sent++;
        } catch (e: any) {
          stats.errors.push(`[3day] ${user.email}: ${e.message}`);
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // EMAIL 3: Expiry Notice
    // Find users expired in last 48h, offer_expiry_sent_at IS NULL
    // Also revokes has_access
    // ══════════════════════════════════════════════════════════════════════
    if (!body.test_stage || body.test_stage === "expiry") {
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      const { data: usersExp } = await supabase
        .from("profiles")
        .select("id, email, access_expires_at")
        .is("offer_expiry_sent_at", null)
        .lt("access_expires_at", now.toISOString())
        .gt("access_expires_at", twoDaysAgo.toISOString())
        .or("subscription_status.is.null,subscription_status.eq.trial,subscription_status.eq.none,subscription_status.eq.cancelled");

      const targetsExp = body.test_email
        ? [{ id: "test", email: body.test_email }]
        : (usersExp || []);

      for (const user of targetsExp) {
        if (!user.email) continue;
        try {
          await sendEmail(
            user.email,
            "📜 Your Serenity Scrolls Access Has Ended",
            buildEmail3(siteUrl)
          );
          if (user.id !== "test") {
            await supabase.from("profiles").update({
              has_access: false,
              offer_expiry_sent_at: now.toISOString(),
            }).eq("id", user.id);
          }
          await notifyAdmin("EXPIRY NOTICE", user.email);
          stats.email3_sent++;
        } catch (e: any) {
          stats.errors.push(`[expiry] ${user.email}: ${e.message}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Subscription offer flow processed.",
        ...stats,
        errors: stats.errors.length > 0 ? stats.errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("send-subscription-offers error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process subscription offer emails." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
