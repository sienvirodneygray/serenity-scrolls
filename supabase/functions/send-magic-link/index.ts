import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildBaseEmail } from "../_shared/email-templates.ts";

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

    const { email, origin, redirectTo } = await req.json();
    
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
    const accessLink = `${origin || "https://serenityscrollsservant.com"}/unlock?magic_token=${token}${redirectTo ? `&redirect_to=${encodeURIComponent(redirectTo)}` : ""}`;

    const emailResponse = await resend.emails.send({
      from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
      to: [email],
      subject: "Your Login Link ✨",
      html: buildBaseEmail(
        "Your Login Link ✨ — Serenity Scrolls",
        `
          <p>Dear Serenity Seeker,</p>
          <p>Click the button below to instantly sign back into your account.</p>
          <p style="text-align: center;">
            <a href="${accessLink}" class="btn">Log In to My Account</a>
          </p>
          <p>If you didn't request this link, you can safely ignore this email.</p>
          
          <div class="scripture">
            "Your word is a lamp for my feet, a light on my path."<br>
            <span style="font-size:13px; color:#a0aec0; font-style:normal; margin-top:8px; display:inline-block; font-family: 'Helvetica Neue', Arial, sans-serif;">— Psalm 119:105</span>
          </div>

          <p>With blessings,<br><strong>The Serenity Scrolls Team</strong></p>
        `
      ),
    });

    console.log("[send-magic-link] Email sent successfully:", emailResponse);

    // Send admin update email
    await resend.emails.send({
      from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
      to: ["teamsienvi@gmail.com", "sienvirodneygray@gmail.com"],
      subject: "[MAGIC LINK] User requested login link",
      html: `
        <div style="font-family: sans-serif; font-size: 14px; line-height: 1.5; color: #333;">
          <h2>Update: User requested login link</h2>
          <p><strong>Email:</strong> ${email}</p>
        </div>
      `,
    });

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
