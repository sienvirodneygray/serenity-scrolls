import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[send-access-approval] Function started");

    const { email, orderId } = await req.json();
    
    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`[send-access-approval] Sending approval email to ${email}`);

    // Get the origin for the access link
    const origin = req.headers.get("origin") || "https://serenityscrolls.com";
    const accessLink = `${origin}/servant-access?email=${encodeURIComponent(email)}`;

    const emailResponse = await resend.emails.send({
      from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
      to: [email],
      subject: "Your Serenity Scrolls Access Has Been Approved! ✨",
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
            <h1 style="color: #d4af37; margin: 0;">✨ Access Approved ✨</h1>
          </div>
          <div class="content">
            <p>Dear Serenity Seeker,</p>
            <p>Great news! Your access to the <strong>AI Servant</strong> has been approved.</p>
            <p>Your order (${orderId || "N/A"}) has been verified, and you can now access your spiritual companion.</p>
            <p style="text-align: center;">
              <a href="${accessLink}" class="button">Access AI Servant</a>
            </p>
            <p>Simply use the email address <strong>${email}</strong> when logging in.</p>
            <p>May your journey be filled with peace and wisdom.</p>
            <p>With blessings,<br>The Serenity Scrolls Team</p>
          </div>
          <div class="footer">
            <p>Serenity Scrolls - Your Path to Inner Peace</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("[send-access-approval] Email sent successfully:", emailResponse);

    // Also add the email to approved_emails in access_codes or create a simpler lookup
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create an access code for this approved email
    const accessCode = `APPROVED-${Date.now()}`;
    await supabase.from("access_codes").insert({
      code: accessCode,
      product_type: "verified_purchase",
      is_reusable: false,
      is_redeemed: false,
    });

    console.log("[send-access-approval] Created access code for approved user");

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[send-access-approval] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
