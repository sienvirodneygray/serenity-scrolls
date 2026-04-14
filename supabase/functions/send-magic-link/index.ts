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
    console.log("[send-magic-link] Function started");

    const { email, origin } = await req.json();
    
    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`[send-magic-link] Generating magic link for ${email}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate link using Admin API
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: email.toLowerCase(),
    });

    if (magicLinkError) {
      throw magicLinkError;
    }

    // We use the token_hash to construct a custom direct-URL to the frontend,
    // bypassing Supabase's Site URL tracking which can mistakenly redirect to localhost.
    const token = magicLinkData.properties?.hashed_token;
    
    if (!token) {
      throw new Error("Failed to generate secure token for magic link.");
    }

    // The direct custom link the user will click
    const accessLink = `${origin || "https://serenityscrollsservant.com"}/unlock?magic_token=${token}`;

    const emailResponse = await resend.emails.send({
      from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
      to: [email],
      subject: "Your Login Link ✨",
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
            <h1 style="color: #d4af37; margin: 0;">✨ Welcome Back ✨</h1>
          </div>
          <div class="content">
            <p>Dear Serenity Seeker,</p>
            <p>Click the button below to instantly sign back into your Servant.</p>
            <p style="text-align: center;">
              <a href="${accessLink}" class="button">Log In to My Servant</a>
            </p>
            <p>If you didn't request this link, you can safely ignore this email.</p>
            <p>With blessings,<br>The Serenity Scrolls Team</p>
          </div>
          <div class="footer">
            <p>Serenity Scrolls - Your Path to Inner Peace</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("[send-magic-link] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[send-magic-link] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send magic link" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
