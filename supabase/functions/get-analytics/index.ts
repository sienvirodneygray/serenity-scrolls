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

    // ── 1. Primary metrics from analytics_sessions ──────────────────────

    const { data: sessions, error: sessErr } = await supabase
      .from("analytics_sessions")
      .select("*")
      .gte("first_visit", startDate)
      .lte("first_visit", endDate);

    if (sessErr) {
      console.error("[get-analytics] Sessions query error:", sessErr);
    }

    const sessionRows = sessions || [];
    console.log(`[get-analytics] Found ${sessionRows.length} sessions`);

    // ── 2. Page views from analytics_pageviews ──────────────────────────

    const { data: pageviews, error: pvErr } = await supabase
      .from("analytics_pageviews")
      .select("*")
      .gte("timestamp", startDate)
      .lte("timestamp", endDate);

    if (pvErr) {
      console.error("[get-analytics] Pageviews query error:", pvErr);
    }

    const pageviewRows = pageviews || [];
    console.log(`[get-analytics] Found ${pageviewRows.length} page views`);

    // ── 3. Fallback: analytics_events (legacy table) ────────────────────

    let legacyPageViews = 0;
    if (pageviewRows.length === 0) {
      const { data: events } = await supabase
        .from("analytics_events")
        .select("*")
        .eq("event_type", "page_view")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      legacyPageViews = events?.length || 0;
      console.log(`[get-analytics] Legacy events fallback: ${legacyPageViews} page views`);
    }

    // ── 4. Compute core KPIs ────────────────────────────────────────────

    const uniqueVisitors = new Set(
      sessionRows.map((s: any) => s.visitor_id).filter(Boolean)
    ).size || sessionRows.length;

    const totalSessions = sessionRows.length;
    const totalPageViews = pageviewRows.length || legacyPageViews;

    // Bounce rate
    const bounceSessions = sessionRows.filter((s: any) => 
      s.is_bounce === true || s.total_pageviews <= 1
    ).length;
    const bounceRate = totalSessions > 0
      ? Math.round((bounceSessions / totalSessions) * 100 * 10) / 10
      : 0;

    // Avg session duration
    let totalDuration = 0;
    let sessionsWithDuration = 0;
    for (const s of sessionRows) {
      const start = s.started_at || s.first_visit;
      const end = s.ended_at || s.last_activity;
      if (start && end) {
        const dur = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
        if (dur > 0 && dur < 7200) {
          totalDuration += dur;
          sessionsWithDuration++;
        }
      }
    }
    const avgDuration = sessionsWithDuration > 0
      ? Math.round(totalDuration / sessionsWithDuration)
      : 0;

    const pagesPerVisit = totalSessions > 0
      ? Math.round((totalPageViews / totalSessions) * 10) / 10
      : 0;

    // ── 5. Traffic Sources breakdown ────────────────────────────────────

    const searchEngines = ["google", "bing", "yahoo", "duckduckgo", "baidu", "yandex"];
    const socialPlatforms = ["facebook", "instagram", "twitter", "t.co", "linkedin", "tiktok", "youtube", "pinterest", "reddit"];
    const paidMediums = ["cpc", "ppc", "paid", "paid_social", "display"];

    const trafficSources: Record<string, number> = {
      direct: 0,
      organic: 0,
      social: 0,
      referral: 0,
      paid: 0,
      email: 0,
    };

    for (const s of sessionRows) {
      const ref = (s.referrer || "").toLowerCase();
      const utmMedium = (s.utm_medium || "").toLowerCase();
      const utmSource = (s.utm_source || "").toLowerCase();

      // Paid check first (UTM-based)
      if (paidMediums.includes(utmMedium)) {
        trafficSources.paid++;
      }
      // Email
      else if (utmMedium === "email" || utmSource.includes("mail") || ref.includes("mail")) {
        trafficSources.email++;
      }
      // Organic search
      else if (ref && searchEngines.some(se => ref.includes(se))) {
        trafficSources.organic++;
      }
      // Social
      else if (ref && socialPlatforms.some(sp => ref.includes(sp))) {
        trafficSources.social++;
      }
      // Referral (has referrer but not search/social)
      else if (ref && ref !== "" && !ref.includes(Deno.env.get("SUPABASE_URL") || "")) {
        trafficSources.referral++;
      }
      // Direct
      else {
        trafficSources.direct++;
      }
    }

    // ── 6. Device Breakdown ─────────────────────────────────────────────

    const deviceBreakdown: Record<string, number> = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
    };

    for (const s of sessionRows) {
      const dt = (s.device_type || "desktop").toLowerCase();
      if (dt === "mobile") deviceBreakdown.mobile++;
      else if (dt === "tablet") deviceBreakdown.tablet++;
      else deviceBreakdown.desktop++;
    }

    // ── 7. Top Pages ────────────────────────────────────────────────────

    const dashboardPaths = [
      "/admin", "/client/", "/login", "/reset-password",
      "/web-analytics", "/youtube-analytics", "/tiktok-analytics",
      "/x-analytics", "/meta-analytics", "/linkedin-analytics",
      "/analytics/", "/report/",
    ];

    const pageCounts: Record<string, number> = {};
    for (const pv of pageviewRows) {
      const path = pv.page_path || pv.path || "/";
      if (dashboardPaths.some(dp => path.startsWith(dp))) continue;
      pageCounts[path] = (pageCounts[path] || 0) + 1;
    }

    const topPages = Object.entries(pageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, views]) => ({ path, views }));

    // ── 8. Country Breakdown ────────────────────────────────────────────

    const countryCounts: Record<string, number> = {};
    for (const s of sessionRows) {
      const country = s.country || "Unknown";
      if (country && country !== "Unknown" && country !== "XX") {
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      }
    }

    const countryBreakdown = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([country, count]) => ({ country, count }));

    // ── 9. Browser Breakdown ────────────────────────────────────────────

    const browserCounts: Record<string, number> = {};
    for (const s of sessionRows) {
      const browser = s.browser || "Unknown";
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    }

    const browserBreakdown = Object.entries(browserCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([browser, count]) => ({ browser, count }));

    // ── 10. Daily timeseries ────────────────────────────────────────────

    const dailyVisitors: Record<string, Set<string>> = {};
    const dailyPageViews: Record<string, number> = {};

    for (const s of sessionRows) {
      const day = (s.first_visit || s.started_at || "").substring(0, 10);
      if (!day) continue;
      if (!dailyVisitors[day]) dailyVisitors[day] = new Set();
      dailyVisitors[day].add(s.visitor_id || s.session_id);
    }

    for (const pv of pageviewRows) {
      const day = (pv.timestamp || "").substring(0, 10);
      if (!day) continue;
      dailyPageViews[day] = (dailyPageViews[day] || 0) + 1;
    }

    const allDays = new Set([...Object.keys(dailyVisitors), ...Object.keys(dailyPageViews)]);
    const timeseries = Array.from(allDays)
      .sort()
      .map(date => ({
        date,
        visitors: dailyVisitors[date]?.size || 0,
        pageViews: dailyPageViews[date] || 0,
      }));

    // ── Assemble response ───────────────────────────────────────────────

    const analytics = {
      visitors: uniqueVisitors,
      sessions: totalSessions,
      pageViews: totalPageViews,
      avgDuration,
      bounceRate,
      pagesPerVisit,
      trafficSources,
      deviceBreakdown,
      topPages,
      countryBreakdown,
      browserBreakdown,
      timeseries,
    };

    console.log("[get-analytics] Returning full analytics payload");
    console.log(`[get-analytics] Visitors: ${uniqueVisitors}, Sessions: ${totalSessions}, PVs: ${totalPageViews}`);
    console.log(`[get-analytics] Traffic: ${JSON.stringify(trafficSources)}`);
    console.log(`[get-analytics] Devices: ${JSON.stringify(deviceBreakdown)}`);
    console.log(`[get-analytics] Top pages: ${topPages.length}, Countries: ${countryBreakdown.length}`);

    return new Response(JSON.stringify({ analytics }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("[get-analytics] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
