import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Send Order Notification Emails
 *
 * Sends branded emails to the customer AND team admins whenever an order
 * transitions through states: confirmation → shipping → delivery.
 *
 * Required Supabase secrets:
 *   RESEND_API_KEY
 *
 * Request body:
 *   orderId       — UUID of the order
 *   type          — "confirmation" | "shipping" | "delivery"
 *   trackingNumber — optional tracking number (for shipping/delivery)
 *   carrier        — optional carrier name (e.g. "UPS", "USPS", "FedEx")
 */

const ADMIN_EMAILS = ["teamsienvi@gmail.com", "sienvirodneygray@gmail.com"];
const SITE_URL_DEFAULT = "https://serenityscrolls.faith";

interface OrderItem {
  quantity: number;
  price_at_purchase: number;
  products: {
    name: string;
    image_url: string;
  };
}

function buildConfirmationEmail(
  order: any,
  items: OrderItem[],
  siteUrl: string,
  isAdminCopy: boolean
): { subject: string; html: string } {
  const address = order.shipping_address || {};
  const addressLine = [
    address.line1 || address.address,
    address.city,
    address.state,
    address.zipCode || address.zip,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
  const customerName = `${address.firstName || ""} ${address.lastName || ""}`.trim() || "Valued Customer";

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f0ebe0;">
          <strong>${item.products.name}</strong><br>
          <span style="color: #8b7355; font-size: 13px;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #f0ebe0; text-align: right; font-weight: bold;">
          $${(item.price_at_purchase * item.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  const subject = isAdminCopy
    ? `[ORDER] New Order ${order.order_number} — $${Number(order.total_amount).toFixed(2)}`
    : `Order Confirmed! ${order.order_number} ✨`;

  const greeting = isAdminCopy
    ? `<p><strong>New order received from ${customerName} (${order.customer_email})</strong></p>`
    : `<p>Dear ${customerName},</p>
       <p>Thank you for your order! We're preparing your items with care and will ship them shortly.</p>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #faf8f3; }
        .header { text-align: center; padding: 24px 0; border-bottom: 2px solid #d4af37; }
        .header h1 { color: #d4af37; margin: 0; font-size: 24px; }
        .badge { display: inline-block; background: linear-gradient(135deg, #d4af37, #f4d03f); color: #1a1a1a; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px; margin-top: 10px; }
        .content { padding: 24px 0; }
        .order-box { background: #fff; border: 1px solid #e8e0cc; border-radius: 8px; padding: 20px; margin: 16px 0; }
        .order-box dt { font-weight: bold; color: #8b7355; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .order-box dd { margin: 4px 0 14px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; }
        .total-row { font-size: 18px; font-weight: bold; color: #1a1a1a; }
        .shipping-free { color: #2e7d32; font-size: 13px; }
        .button { display: inline-block; background: linear-gradient(135deg, #d4af37, #f4d03f); color: #1a1a1a; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✨ Order Confirmed ✨</h1>
        <div><span class="badge">${order.order_number}</span></div>
      </div>
      <div class="content">
        ${greeting}

        <div class="order-box">
          <h3 style="margin: 0 0 12px 0; color: #1a1a1a;">Items Ordered</h3>
          <table>
            ${itemRows}
            <tr>
              <td style="padding: 12px;">
                <span class="shipping-free">✓ Standard Shipping</span>
              </td>
              <td style="padding: 12px; text-align: right;">
                <span class="shipping-free">FREE</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px; border-top: 2px solid #d4af37;">
                <span class="total-row">Total</span>
              </td>
              <td style="padding: 12px; border-top: 2px solid #d4af37; text-align: right;">
                <span class="total-row">$${Number(order.total_amount).toFixed(2)}</span>
              </td>
            </tr>
          </table>
        </div>

        <div class="order-box">
          <dl>
            <dt>Shipping To</dt>
            <dd>${customerName}<br>${addressLine}</dd>
            <dt>Email</dt>
            <dd>${order.customer_email}</dd>
            <dt>Estimated Delivery</dt>
            <dd>3–5 business days</dd>
          </dl>
        </div>

        <p style="text-align: center;">
          <a href="${siteUrl}" class="button">Visit Serenity Scrolls</a>
        </p>

        ${
          isAdminCopy
            ? ""
            : `<p>We'll send you another email once your order ships with tracking information.</p>
               <p>May your journey be filled with peace and wisdom.</p>
               <p>With blessings,<br>The Serenity Scrolls Team</p>`
        }
      </div>
      <div class="footer">
        <p>Serenity Scrolls — Your Path to Inner Peace</p>
        <p style="font-size: 11px; color: #999;">Questions? Reply to this email or contact us at teamsienvi@gmail.com</p>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

function buildShippingEmail(
  order: any,
  items: OrderItem[],
  trackingNumber: string | null,
  carrier: string | null,
  siteUrl: string,
  isAdminCopy: boolean
): { subject: string; html: string } {
  const address = order.shipping_address || {};
  const customerName = `${address.firstName || ""} ${address.lastName || ""}`.trim() || "Valued Customer";
  const addressLine = [
    address.line1 || address.address,
    address.city,
    address.state,
    address.zipCode || address.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const itemList = items
    .map((i) => `<li>${i.products.name} × ${i.quantity}</li>`)
    .join("");

  const trackingBlock = trackingNumber
    ? `<div style="background: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
         <p style="margin: 0; font-size: 13px; color: #2e7d32; text-transform: uppercase; letter-spacing: 0.5px;">Tracking Number</p>
         <p style="margin: 8px 0 0; font-size: 20px; font-weight: bold; color: #1a1a1a; letter-spacing: 1px;">${trackingNumber}</p>
         ${carrier ? `<p style="margin: 4px 0 0; font-size: 13px; color: #666;">via ${carrier}</p>` : ""}
       </div>`
    : `<p style="color: #8b7355; font-style: italic;">Tracking information will be updated shortly.</p>`;

  const subject = isAdminCopy
    ? `[SHIPPED] Order ${order.order_number} has shipped`
    : `Your Order Has Shipped! 📦 ${order.order_number}`;

  const greeting = isAdminCopy
    ? `<p><strong>Order ${order.order_number} has been shipped to ${customerName} (${order.customer_email})</strong></p>`
    : `<p>Dear ${customerName},</p>
       <p>Great news! Your order is on its way. Here are the details:</p>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #faf8f3; }
        .header { text-align: center; padding: 24px 0; border-bottom: 2px solid #d4af37; }
        .header h1 { color: #d4af37; margin: 0; font-size: 24px; }
        .badge { display: inline-block; background: linear-gradient(135deg, #d4af37, #f4d03f); color: #1a1a1a; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px; margin-top: 10px; }
        .content { padding: 24px 0; }
        .order-box { background: #fff; border: 1px solid #e8e0cc; border-radius: 8px; padding: 20px; margin: 16px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #d4af37, #f4d03f); color: #1a1a1a; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📦 Your Order Has Shipped!</h1>
        <div><span class="badge">${order.order_number}</span></div>
      </div>
      <div class="content">
        ${greeting}

        ${trackingBlock}

        <div class="order-box">
          <h3 style="margin: 0 0 8px;">Items Shipped</h3>
          <ul style="margin: 0; padding-left: 20px;">${itemList}</ul>
        </div>

        <div class="order-box">
          <dl style="margin: 0;">
            <dt style="font-weight: bold; color: #8b7355; font-size: 11px; text-transform: uppercase;">Shipping To</dt>
            <dd style="margin: 4px 0 0;">${customerName}<br>${addressLine}</dd>
          </dl>
        </div>

        ${
          isAdminCopy
            ? ""
            : `<p>We'll notify you once your package has been delivered.</p>
               <p>With blessings,<br>The Serenity Scrolls Team</p>`
        }
      </div>
      <div class="footer">
        <p>Serenity Scrolls — Your Path to Inner Peace</p>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

function buildDeliveryEmail(
  order: any,
  items: OrderItem[],
  siteUrl: string,
  isAdminCopy: boolean
): { subject: string; html: string } {
  const address = order.shipping_address || {};
  const customerName = `${address.firstName || ""} ${address.lastName || ""}`.trim() || "Valued Customer";

  const itemList = items
    .map((i) => `<li>${i.products.name} × ${i.quantity}</li>`)
    .join("");

  const subject = isAdminCopy
    ? `[DELIVERED] Order ${order.order_number} delivered`
    : `Your Order Has Been Delivered! 🎉 ${order.order_number}`;

  const greeting = isAdminCopy
    ? `<p><strong>Order ${order.order_number} has been delivered to ${customerName} (${order.customer_email})</strong></p>`
    : `<p>Dear ${customerName},</p>
       <p>Your order has been delivered! We hope you love your purchase.</p>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #faf8f3; }
        .header { text-align: center; padding: 24px 0; border-bottom: 2px solid #d4af37; }
        .header h1 { color: #d4af37; margin: 0; font-size: 24px; }
        .badge { display: inline-block; background: linear-gradient(135deg, #d4af37, #f4d03f); color: #1a1a1a; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px; margin-top: 10px; }
        .content { padding: 24px 0; }
        .order-box { background: #fff; border: 1px solid #e8e0cc; border-radius: 8px; padding: 20px; margin: 16px 0; }
        .cta-box { background: linear-gradient(135deg, #f8f4e8, #fff8e7); border: 2px solid #d4af37; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center; }
        .button { display: inline-block; background: linear-gradient(135deg, #d4af37, #f4d03f); color: #1a1a1a; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Order Delivered!</h1>
        <div><span class="badge">${order.order_number}</span></div>
      </div>
      <div class="content">
        ${greeting}

        <div class="order-box">
          <h3 style="margin: 0 0 8px;">Items Delivered</h3>
          <ul style="margin: 0; padding-left: 20px;">${itemList}</ul>
        </div>

        ${
          isAdminCopy
            ? ""
            : `<div class="cta-box">
                 <p style="margin: 0 0 8px; font-size: 16px; font-weight: bold; color: #1a1a1a;">✨ Your 30-Day AI Servant Trial is Included!</p>
                 <p style="margin: 0 0 12px; font-size: 14px; color: #666;">Unlock your personal AI Servant to explore Scripture like never before.</p>
                 <a href="${siteUrl}/unlock" class="button">Activate Your Servant</a>
               </div>
               <p>If you have any questions about your order, simply reply to this email.</p>
               <p>May your journey be filled with peace and wisdom.</p>
               <p>With blessings,<br>The Serenity Scrolls Team</p>`
        }
      </div>
      <div class="footer">
        <p>Serenity Scrolls — Your Path to Inner Peace</p>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendKey);
    const siteUrl = Deno.env.get("SITE_URL") || SITE_URL_DEFAULT;

    const { orderId, type, trackingNumber, carrier } = await req.json();

    if (!orderId || !type) {
      return new Response(
        JSON.stringify({ error: "orderId and type are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validTypes = ["confirmation", "shipping", "delivery"];
    if (!validTypes.includes(type)) {
      return new Response(
        JSON.stringify({ error: `Invalid type. Must be one of: ${validTypes.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Connect to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch order items with product details
    const { data: items } = await supabase
      .from("order_items")
      .select(`
        quantity,
        price_at_purchase,
        products (
          name,
          image_url
        )
      `)
      .eq("order_id", orderId);

    const orderItems: OrderItem[] = items || [];

    // Build email based on type
    let customerEmail: { subject: string; html: string };
    let adminEmail: { subject: string; html: string };

    switch (type) {
      case "confirmation":
        customerEmail = buildConfirmationEmail(order, orderItems, siteUrl, false);
        adminEmail = buildConfirmationEmail(order, orderItems, siteUrl, true);
        break;
      case "shipping":
        customerEmail = buildShippingEmail(order, orderItems, trackingNumber, carrier, siteUrl, false);
        adminEmail = buildShippingEmail(order, orderItems, trackingNumber, carrier, siteUrl, true);
        break;
      case "delivery":
        customerEmail = buildDeliveryEmail(order, orderItems, siteUrl, false);
        adminEmail = buildDeliveryEmail(order, orderItems, siteUrl, true);
        break;
      default:
        throw new Error("Invalid type");
    }

    // Send to customer
    const { error: customerSendError } = await resend.emails.send({
      from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
      to: [order.customer_email],
      subject: customerEmail.subject,
      html: customerEmail.html,
    });

    if (customerSendError) {
      console.error("Customer email send error:", customerSendError);
    } else {
      console.log(`[${type}] Customer email sent to ${order.customer_email}`);
    }

    // Send admin copy to both team emails
    const { error: adminSendError } = await resend.emails.send({
      from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
      to: ADMIN_EMAILS,
      subject: adminEmail.subject,
      html: adminEmail.html,
    });

    if (adminSendError) {
      console.error("Admin email send error:", adminSendError);
    } else {
      console.log(`[${type}] Admin email sent to ${ADMIN_EMAILS.join(", ")}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        type,
        orderNumber: order.order_number,
        sentTo: order.customer_email,
        adminNotified: ADMIN_EMAILS,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Order notification error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
