import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate, apiKey } = await req.json();
    
    // Validate API key
    const expectedApiKey = Deno.env.get('ANALYTICS_API_KEY');
    console.log('[get-analytics] Validating API key...');
    
    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('[get-analytics] Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!startDate || !endDate) {
      console.error('[get-analytics] Missing date parameters');
      return new Response(
        JSON.stringify({ error: 'startDate and endDate are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[get-analytics] Fetching analytics from ${startDate} to ${endDate}`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ==========================================
    // MATCH ADMIN DASHBOARD LOGIC EXACTLY
    // ==========================================

    // 1. Get unique visitors (count of sessions)
    const { data: sessions, error: sessionsError } = await supabase
      .from('analytics_sessions')
      .select('session_id, started_at, ended_at')
      .gte('first_visit', startDate)
      .lte('first_visit', endDate);

    if (sessionsError) {
      console.error('[get-analytics] Error fetching sessions:', sessionsError);
      throw sessionsError;
    }

    const visitors = sessions?.length || 0;
    console.log(`[get-analytics] Found ${visitors} unique visitors (sessions)`);

    // 2. Get total pageviews from analytics_pageviews table
    const { count: pageViews, error: pageviewsError } = await supabase
      .from('analytics_pageviews')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', startDate)
      .lte('timestamp', endDate);

    if (pageviewsError) {
      console.error('[get-analytics] Error fetching pageviews:', pageviewsError);
      throw pageviewsError;
    }

    console.log(`[get-analytics] Found ${pageViews} total pageviews`);

    // 3. Calculate bounce rate (sessions with only 1 pageview)
    const { data: pageviewData, error: pvDataError } = await supabase
      .from('analytics_pageviews')
      .select('session_id')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate);

    if (pvDataError) {
      console.error('[get-analytics] Error fetching pageview data:', pvDataError);
      throw pvDataError;
    }

    const sessionPageviews: Record<string, number> = {};
    for (const pv of pageviewData || []) {
      if (pv.session_id) {
        sessionPageviews[pv.session_id] = (sessionPageviews[pv.session_id] || 0) + 1;
      }
    }

    const totalSessions = Object.keys(sessionPageviews).length;
    const bounces = Object.values(sessionPageviews).filter(count => count === 1).length;
    const bounceRate = totalSessions > 0 ? Math.round((bounces / totalSessions) * 100) : 0;

    console.log(`[get-analytics] Bounce rate: ${bounceRate}% (${bounces} bounces out of ${totalSessions} sessions)`);

    // 4. Calculate average duration from started_at and ended_at
    let avgDuration = 0;
    const sessionsWithEndTime = sessions?.filter(s => s.started_at && s.ended_at) || [];
    
    if (sessionsWithEndTime.length > 0) {
      let totalSeconds = 0;
      let validSessions = 0;
      
      for (const session of sessionsWithEndTime) {
        const start = new Date(session.started_at).getTime();
        const end = new Date(session.ended_at).getTime();
        const duration = (end - start) / 1000; // seconds
        
        // Cap at 1 hour to filter outliers (same as admin dashboard)
        if (duration > 0 && duration < 3600) {
          totalSeconds += duration;
          validSessions++;
        }
      }
      
      avgDuration = validSessions > 0 ? Math.round(totalSeconds / validSessions) : 0;
    }

    console.log(`[get-analytics] Avg duration: ${avgDuration}s (from ${sessionsWithEndTime.length} sessions with end time)`);

    // 5. Calculate pages per visit
    const pagesPerVisit = visitors > 0 ? Math.round(((pageViews || 0) / visitors) * 10) / 10 : 0;

    console.log(`[get-analytics] Pages per visit: ${pagesPerVisit}`);

    const analytics = {
      visitors,
      pageViews: pageViews || 0,
      avgDuration,
      bounceRate,
      pagesPerVisit,
    };

    console.log('[get-analytics] Final analytics:', JSON.stringify(analytics));

    return new Response(
      JSON.stringify({ analytics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[get-analytics] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
