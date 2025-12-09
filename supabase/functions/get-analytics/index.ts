import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate, apiKey } = await req.json();
    
    // Validate API key
    if (apiKey !== Deno.env.get("ANALYTICS_API_KEY")) {
      console.error("[get-analytics] Invalid API key");
      return new Response(JSON.stringify({ error: "Unauthorized" }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!startDate || !endDate) {
      return new Response(JSON.stringify({ error: "startDate and endDate are required" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[get-analytics] Fetching from ${startDate} to ${endDate}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Query page_view events from analytics_events
    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("event_type", "page_view")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[get-analytics] Query error:", error);
      throw error;
    }

    const pageViews = events || [];
    console.log(`[get-analytics] Found ${pageViews.length} page views`);

    // Group events by visitor_id
    const visitorEvents: Record<string, any[]> = {};
    
    for (const ev of pageViews) {
      if (!ev.visitor_id) continue;
      if (!visitorEvents[ev.visitor_id]) visitorEvents[ev.visitor_id] = [];
      visitorEvents[ev.visitor_id].push(ev);
    }

    const visitorIds = Object.keys(visitorEvents);
    const uniqueVisitors = visitorIds.length;
    
    let totalDuration = 0;
    let sessionsWithDuration = 0;
    let bounces = 0;

    for (const visitorId of visitorIds) {
      const vEvents = visitorEvents[visitorId];
      
      // Count bounces (visitors with only 1 page view)
      if (vEvents.length === 1) {
        bounces++;
      }
      
      // Calculate duration (time between first and last event)
      if (vEvents.length > 1) {
        const timestamps = vEvents.map(e => new Date(e.created_at).getTime()).sort((a, b) => a - b);
        const duration = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000;
        // Cap at 2 hours to filter outliers
        if (duration > 0 && duration < 7200) {
          totalDuration += duration;
          sessionsWithDuration++;
        }
      }
    }

    const analytics = {
      visitors: uniqueVisitors,
      pageViews: pageViews.length,
      avgDuration: sessionsWithDuration > 0 ? Math.round(totalDuration / sessionsWithDuration) : 0,
      bounceRate: uniqueVisitors > 0 ? Math.round((bounces / uniqueVisitors) * 100 * 10) / 10 : 0,
      pagesPerVisit: uniqueVisitors > 0 ? Math.round((pageViews.length / uniqueVisitors) * 10) / 10 : 0,
    };

    console.log("[get-analytics] Calculated:", JSON.stringify(analytics));

    return new Response(JSON.stringify({ analytics }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("[get-analytics] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
