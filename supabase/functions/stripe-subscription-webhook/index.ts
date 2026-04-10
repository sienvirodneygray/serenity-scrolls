import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Stripe Subscription Webhook
 *
 * Handles subscription lifecycle events and updates user access accordingly.
 *
 * Required Supabase secrets:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 *
 * Listened events:
 *   checkout.session.completed  — New subscription started
 *   customer.subscription.updated — Plan change, renewal, etc.
 *   customer.subscription.deleted — Subscription cancelled
 *   invoice.payment_succeeded   — Recurring payment success
 *   invoice.payment_failed      — Payment failed
 */

async function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): Promise<any> {
  // Parse the Stripe webhook event using the raw body and signature
  // Stripe uses HMAC-SHA256 for webhook verification
  const encoder = new TextEncoder();

  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
  const v1Signature = parts.find((p) => p.startsWith("v1="))?.split("=")[1];

  if (!timestamp || !v1Signature) {
    throw new Error("Invalid Stripe signature format");
  }

  const signedPayload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expectedSignature !== v1Signature) {
    throw new Error("Invalid webhook signature");
  }

  return JSON.parse(body);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const rawBody = await req.text();

    let event: any;

    if (stripeWebhookSecret) {
      const signature = req.headers.get("stripe-signature");
      if (!signature) {
        return new Response(
          JSON.stringify({ error: "Missing stripe-signature header" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      event = await verifyStripeSignature(rawBody, signature, stripeWebhookSecret);
    } else {
      // Dev mode — no signature verification
      console.warn("STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
      event = JSON.parse(rawBody);
    }

    // Connect to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const eventType = event.type;
    console.log(`Processing Stripe event: ${eventType}`);

    switch (eventType) {
      // ─── New subscription via Checkout ───
      // ─── New subscription or product via Checkout ───
      case "checkout.session.completed": {
        const session = event.data.object;

        if (session.mode === "subscription") {
          const userId = session.metadata?.supabase_user_id;
          const customerId = session.customer;
          const customerEmail = session.customer_details?.email || session.customer_email;

          if (userId) {
            await supabase
              .from("profiles")
              .update({
                subscription_status: "active",
                stripe_customer_id: customerId,
                has_access: true,
                access_expires_at: null, // Subscription = indefinite access
              })
              .eq("id", userId);

            console.log(`Subscription activated for user ${userId}`);
          } else if (customerEmail) {
            // Fallback: find user by email
            const { data: profile } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", customerEmail.toLowerCase())
              .maybeSingle();

            if (profile) {
              await supabase
                .from("profiles")
                .update({
                  subscription_status: "active",
                  stripe_customer_id: customerId,
                  has_access: true,
                  access_expires_at: null,
                })
                .eq("id", profile.id);

              console.log(`Subscription activated for user ${profile.id} (via email lookup)`);
            }
          }
        } else if (session.mode === "payment") {
          const metadata = session.metadata || {};

          // Only handle product orders
          if (metadata.source === "serenity-scrolls-shop") {
            const items = JSON.parse(metadata.items_json || "[]");
            const shippingAddress = JSON.parse(metadata.shipping_address || "{}");
            const customerEmail = metadata.customer_email || session.customer_details?.email || session.customer_email;
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
                stripe_payment_intent_id: session.payment_intent as string,
              })
              .select()
              .single();

            if (orderError) {
              console.error("Order creation error:", orderError);
              throw new Error(orderError.message);
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
          }
        }
        break;
      }

      // ─── Subscription updated (renewal, plan change, etc.) ───
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status; // active, past_due, canceled, unpaid, etc.

        // Map Stripe status to our status
        let subscriptionStatus = "active";
        let hasAccess = true;

        if (status === "past_due" || status === "unpaid") {
          subscriptionStatus = "past_due";
          hasAccess = true; // Grace period — still allow access
        } else if (status === "canceled" || status === "incomplete_expired") {
          subscriptionStatus = "cancelled";
          // Access continues until current_period_end
          hasAccess = true;
        } else if (status === "active" || status === "trialing") {
          subscriptionStatus = "active";
          hasAccess = true;
        }

        // Calculate access expiry for cancelled subs
        let accessExpiresAt = null;
        if (status === "canceled" && subscription.current_period_end) {
          accessExpiresAt = new Date(subscription.current_period_end * 1000).toISOString();
        }

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId);

        if (profiles && profiles.length > 0) {
          for (const profile of profiles) {
            const updateData: any = {
              subscription_status: subscriptionStatus,
              has_access: hasAccess,
            };
            if (accessExpiresAt) {
              updateData.access_expires_at = accessExpiresAt;
            }
            await supabase.from("profiles").update(updateData).eq("id", profile.id);
          }
          console.log(`Subscription ${status} for customer ${customerId}`);
        }
        break;
      }

      // ─── Subscription cancelled/deleted ───
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Set access to expire at end of current period
        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : new Date().toISOString();

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId);

        if (profiles && profiles.length > 0) {
          for (const profile of profiles) {
            await supabase
              .from("profiles")
              .update({
                subscription_status: "cancelled",
                access_expires_at: periodEnd,
              })
              .eq("id", profile.id);
          }
          console.log(`Subscription deleted for customer ${customerId}, access until ${periodEnd}`);
        }
        break;
      }

      // ─── Invoice payment failed ───
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId);

        if (profiles && profiles.length > 0) {
          for (const profile of profiles) {
            await supabase
              .from("profiles")
              .update({ subscription_status: "past_due" })
              .eq("id", profile.id);
          }
          console.log(`Payment failed for customer ${customerId}`);
        }
        break;
      }

      // ─── Invoice payment succeeded (renewal) ───
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        if (invoice.billing_reason === "subscription_cycle") {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId);

          if (profiles && profiles.length > 0) {
            for (const profile of profiles) {
              await supabase
                .from("profiles")
                .update({
                  subscription_status: "active",
                  has_access: true,
                  access_expires_at: null, // Active sub = no expiry
                })
                .eq("id", profile.id);
            }
            console.log(`Renewal payment succeeded for customer ${customerId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Webhook processing failed" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
