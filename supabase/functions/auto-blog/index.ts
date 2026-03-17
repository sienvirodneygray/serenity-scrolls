import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        console.log(`[auto-blog] Triggered at ${new Date().toISOString()}`);

        // Call the scheduler which handles schedule checks, dedup, and generation
        const response = await fetch(`${supabaseUrl}/functions/v1/seo-engine-scheduler`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ action: "check-schedule" }),
        });

        const result = await response.json();
        console.log(`[auto-blog] Scheduler result:`, JSON.stringify(result));

        if (!response.ok) {
            console.error(`[auto-blog] Scheduler error: ${response.status}`);
            return new Response(
                JSON.stringify({ success: false, error: result.error || "Scheduler failed" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, ...result }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("[auto-blog] Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
