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

    // Group events by visitor_id OR session_id (fallback)
    const visitorEvents: Record<string, any[]> = {};
    
    for (const pv of pageViews) {
      const visitorId = pv.visitor_id || pv.session_id;
      if (!visitorId) continue;
      if (!visitorEvents[visitorId]) visitorEvents[visitorId] = [];
      visitorEvents[visitorId].push(pv);
    }

    const visitorIds = Object.keys(visitorEvents);
    const uniqueVisitors = visitorIds.length;
    
    console.log(`[get-analytics] Processing ${visitorIds.length} unique visitors/sessions`);
    
    let totalDuration = 0;
    let sessionsWithDuration = 0;
    let bounces = 0;

    for (const visitorId of visitorIds) {
      const vEvents = visitorEvents[visitorId];
      
      // Count bounces (visitors with only 1 page view)
      if (vEvents.length === 1) {
        bounces++;
      }
      
      // Calculate duration with multiple timestamp field fallbacks
      const timestamps = vEvents
        .map((e: any) => {
          const ts = e.created_at || e.viewed_at || e.timestamp;
          if (!ts) return null;
          const time = new Date(ts).getTime();
          return isNaN(time) ? null : time;
        })
        .filter((t): t is number => t !== null)
        .sort((a, b) => a - b);
      
      // Only calculate duration when there are at least 2 valid timestamps
      if (timestamps.length >= 2) {
        const duration = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000;
        // Cap at 2 hours to filter outliers
        if (duration > 0 && duration < 7200) {
          totalDuration += duration;
          sessionsWithDuration++;
        }
      }
    }
    
    console.log(`[get-analytics] Duration calculation: ${sessionsWithDuration} sessions with duration, total: ${totalDuration}s`);

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
