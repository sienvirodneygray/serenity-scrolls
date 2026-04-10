import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Stripe Webhook for product order payment confirmation.
 *
 * On `checkout.session.completed`, this function:
 *   1. Creates the order in the DB
 *   2. Creates order items
 *   3. Dispatches Amazon MCF fulfillment for each FBA-eligible item
 *   4. Clears the cart
 *
 * Required Supabase secrets:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   AMAZON_SPAPI_CLIENT_ID
 *   AMAZON_SPAPI_CLIENT_SECRET
 *   AMAZON_SPAPI_REFRESH_TOKEN
 *   AMAZON_SELLER_ID
 */

async function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
  const sig = parts.find((p) => p.startsWith("v1="))?.split("=")[1];

  if (!timestamp || !sig) return false;

  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expected = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expected === sig;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("STRIPE_PRODUCT_WEBHOOK_SECRET") || Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    // Verify webhook if secret is configured
    if (webhookSecret && signature) {
      const valid = await verifyStripeSignature(body, signature, webhookSecret);
      if (!valid) {
        console.error("Invalid Stripe signature");
        return new Response("Invalid signature", { status: 400 });
      }
    }

    const event = JSON.parse(body);

    if (event.type !== "checkout.session.completed") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = event.data.object;
    const metadata = session.metadata || {};

    // Only handle product orders (not subscription)
    if (metadata.source !== "serenity-scrolls-shop") {
      return new Response(JSON.stringify({ received: true, skipped: "not-product" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const items = JSON.parse(metadata.items_json || "[]");
    const shippingAddress = JSON.parse(metadata.shipping_address || "{}");
    const customerEmail = metadata.customer_email || session.customer_email;
    const userId = metadata.user_id || null;
    const anonSessionId = metadata.session_id || null;

    // Use Stripe-collected shipping address if available
    const stripeShipping = session.shipping_details?.address || {};
    const finalAddress = stripeShipping.line1
      ? {
          firstName: session.shipping_details?.name?.split(" ")[0] || shippingAddress.firstName,
          lastName: session.shipping_details?.name?.split(" ").slice(1).join(" ") || shippingAddress.lastName,
          address: stripeShipping.line1,
          city: stripeShipping.city,
          state: stripeShipping.state,
          zipCode: stripeShipping.postal_code,
          country: stripeShipping.country,
        }
      : shippingAddress;

    // Create Supabase client with service role
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const totalAmount = (session.amount_total || 0) / 100;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId || null,
        session_id: !userId ? anonSessionId : null,
        customer_email: customerEmail,
        total_amount: totalAmount,
        shipping_address: finalAddress,
        status: "paid",
        order_number: `SS-${Date.now()}`,
        stripe_payment_intent_id: session.payment_intent,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return new Response(JSON.stringify({ error: orderError.message }), { status: 500 });
    }

    console.log(`Order created: ${order.order_number} (${order.id})`);

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
    }

    // Dispatch Amazon MCF fulfillment for each FBA item
    for (const item of items) {
      if (item.amazon_sku) {
        try {
          const mcfResponse = await supabase.functions.invoke("create-mcf-order", {
            body: {
              orderId: order.id,
              sellerSku: item.amazon_sku,
              quantity: item.quantity,
              shippingSpeed: "Standard",
              address: {
                name: `${finalAddress.firstName} ${finalAddress.lastName}`,
                line1: finalAddress.address,
                city: finalAddress.city,
                stateOrRegion: finalAddress.state,
                postalCode: finalAddress.zipCode,
                countryCode: finalAddress.country || "US",
              },
            },
          });
          console.log(`MCF dispatched for SKU ${item.amazon_sku}:`, mcfResponse);
        } catch (mcfErr) {
          console.error(`MCF dispatch failed for ${item.amazon_sku}:`, mcfErr);
          // Non-blocking — order is already saved + paid
        }
      }
    }

    // Clear cart
    if (userId) {
      await supabase.from("cart_items").delete().eq("user_id", userId);
    } else if (anonSessionId) {
      await supabase.from("cart_items").delete().eq("session_id", anonSessionId);
    }

    // Update order status to processing
    await supabase
      .from("orders")
      .update({ status: "processing" })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ success: true, orderId: order.id, orderNumber: order.order_number }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
