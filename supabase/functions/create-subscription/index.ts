import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Create a Stripe Checkout Session for Servant subscription.
 *
 * Required Supabase secrets:
 *   STRIPE_SECRET_KEY — Stripe API secret key
 *
 * Request body:
 *   email       — Customer email
 *   userId      — Supabase user ID (for metadata)
 *   priceId     — Stripe Price ID (optional, falls back to env STRIPE_SERVANT_PRICE_ID)
 *   successUrl  — Redirect after success (default: /servant)
 *   cancelUrl   — Redirect on cancel (default: /servant-expired)
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured. Please contact support." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, userId, priceId, tier, plan, coupon, successUrl, cancelUrl } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve price ID based on plan, tier, or explicit priceId
    let stripePriceId = priceId;
    let trialDays = 0;
    let productLabel = "servant-subscription";

    if (!stripePriceId) {
      if (plan === "annual") {
        stripePriceId = Deno.env.get("STRIPE_SERVANT_ANNUAL_PRICE_ID");
        productLabel = "servant-annual-subscription";
      } else if (tier === "plus") {
        stripePriceId = Deno.env.get("STRIPE_SERVANT_PLUS_PRICE_ID");
        trialDays = 7;
        productLabel = "servant-plus-subscription";
      } else {
        // plan="monthly" or default
        stripePriceId = Deno.env.get("STRIPE_SERVANT_PRICE_ID");
        productLabel = "servant-subscription";
      }
    }

    if (!stripePriceId) {
      return new Response(
        JSON.stringify({ error: "No subscription price configured. Please contact support." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://serenityscrolls.faith";

    // Check if customer already exists in Stripe
    const customerSearchRes = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${stripeKey}`,
        },
      }
    );
    const customerSearch = await customerSearchRes.json();
    let customerId = customerSearch.data?.[0]?.id;

    // Create customer if not found
    if (!customerId) {
      const createCustomerRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email,
          "metadata[supabase_user_id]": userId || "",
          "metadata[source]": "serenity-scrolls-servant",
        }),
      });
      const newCustomer = await createCustomerRes.json();
      customerId = newCustomer.id;
    }

    // Create Checkout Session
    const sessionParams = new URLSearchParams({
      "mode": "subscription",
      "customer": customerId,
      "line_items[0][price]": stripePriceId,
      "line_items[0][quantity]": "1",
      "success_url": successUrl || `${siteUrl}/servant?session_id={CHECKOUT_SESSION_ID}&subscription=success`,
      "cancel_url": cancelUrl || `${siteUrl}/servant-expired?cancelled=true`,
      "metadata[supabase_user_id]": userId || "",
      "metadata[product]": productLabel,
      "metadata[tier]": tier || "basic",
      "subscription_data[metadata][supabase_user_id]": userId || "",
      "subscription_data[metadata][product]": productLabel,
      "subscription_data[metadata][tier]": tier || "basic",
    });

    // Stripe does not allow both discounts[] and allow_promotion_codes on the same session.
    // Use discounts when a specific coupon is provided, otherwise allow user-entered promo codes.
    // Note: Stripe requires the coupon *ID* (e.g. ydxXjWij), not the display name.
    if (coupon) {
      // Resolve named coupon tokens to their Stripe coupon IDs via env secrets
      const couponIdMap: Record<string, string | undefined> = {
        "SERENITY10": Deno.env.get("STRIPE_COUPON_SERENITY10"),
      };
      const resolvedId = couponIdMap[coupon] ?? coupon;
      sessionParams.set("discounts[0][coupon]", resolvedId);
    } else {
      sessionParams.set("allow_promotion_codes", "true");
    }

    // Add trial period for Servant+
    if (trialDays > 0) {
      sessionParams.set("subscription_data[trial_period_days]", String(trialDays));
    }

    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: sessionParams,
    });

    const session = await sessionRes.json();

    if (session.error) {
      console.error("Stripe session error:", session.error);
      return new Response(
        JSON.stringify({ error: session.error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update profile with Stripe customer ID
    if (userId && customerId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Create subscription error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
