import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * unsubscribe-email
 *
 * Adds an email to the suppressions table so they no longer receive
 * marketing/offer emails from the trial offer flow.
 *
 * Body: { email: string }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert into suppressions table (idempotent)
    const { error } = await supabase
      .from("suppressions")
      .upsert(
        { email: email.toLowerCase().trim(), reason: "unsubscribe" },
        { onConflict: "email", ignoreDuplicates: true }
      );

    if (error) {
      console.error("Suppression insert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to add suppression." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[unsubscribe-email] Suppressed: ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: `${email} has been unsubscribed.` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("unsubscribe-email error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process unsubscribe request." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
