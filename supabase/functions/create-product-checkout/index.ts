import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Create a Stripe Checkout Session for product purchases.
 *
 * This collects payment, then on success the webhook handler
 * creates the order in the DB and dispatches Amazon MCF fulfillment.
 *
 * Required Supabase secrets:
 *   STRIPE_SECRET_KEY
 *
 * Request body:
 *   items     — [{ name, price, quantity, amazon_sku, product_id }]
 *   email     — Customer email
 *   address   — { firstName, lastName, line1, city, state, zip, country }
 *   userId    — optional Supabase user ID
 *   sessionId — optional anonymous session ID
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { items, email, address, userId, sessionId } = await req.json();

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No items provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://serenityscrolls.faith";

    // Build Stripe line items
    const lineItemParams = new URLSearchParams();
    items.forEach((item: any, i: number) => {
      lineItemParams.set(`line_items[${i}][price_data][currency]`, "usd");
      lineItemParams.set(`line_items[${i}][price_data][unit_amount]`, String(Math.round(item.price * 100)));
      lineItemParams.set(`line_items[${i}][price_data][product_data][name]`, item.name);
      lineItemParams.set(`line_items[${i}][quantity]`, String(item.quantity));
    });

    // Create checkout session
    const sessionParams = new URLSearchParams({
      mode: "payment",
      customer_email: email,
      ...Object.fromEntries(lineItemParams),
      "success_url": `${siteUrl}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
      "cancel_url": `${siteUrl}/cart?cancelled=true`,
      "metadata[source]": "serenity-scrolls-shop",
      "metadata[user_id]": userId || "",
      "metadata[session_id]": sessionId || "",
      "metadata[items_json]": JSON.stringify(items.map((it: any) => ({
        product_id: it.product_id,
        amazon_sku: it.amazon_sku,
        quantity: it.quantity,
        price: it.price,
        name: it.name,
      }))),
      "metadata[shipping_address]": JSON.stringify(address),
      "metadata[customer_email]": email,
      "shipping_address_collection[allowed_countries][0]": "US",
    });

    // Merge line item params
    for (const [k, v] of lineItemParams) {
      sessionParams.set(k, v);
    }

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: sessionParams,
    });

    const session = await res.json();

    if (session.error) {
      console.error("Stripe error:", session.error);
      return new Response(
        JSON.stringify({ error: session.error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Checkout session error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
