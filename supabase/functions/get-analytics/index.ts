import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('ANALYTICS_API_KEY');
    
    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { startDate, endDate } = await req.json();
    
    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'startDate and endDate are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching analytics from ${startDate} to ${endDate}`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch sessions data
    const { data: sessions, error: sessionsError } = await supabase
      .from('analytics_sessions')
      .select('*')
      .gte('started_at', startDate)
      .lte('started_at', endDate);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      throw sessionsError;
    }

    // Fetch page views data
    const { data: pageViews, error: pageViewsError } = await supabase
      .from('analytics_pageviews')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate);

    if (pageViewsError) {
      console.error('Error fetching page views:', pageViewsError);
      throw pageViewsError;
    }

    // Calculate metrics
    const totalSessions = sessions?.length || 0;
    const uniqueVisitors = new Set(sessions?.map(s => s.visitor_id).filter(Boolean)).size;
    const totalPageViews = pageViews?.length || 0;
    
    // Bounce rate
    const bouncedSessions = sessions?.filter(s => s.is_bounce === true).length || 0;
    const bounceRate = totalSessions > 0 
      ? Math.round((bouncedSessions / totalSessions) * 1000) / 10 
      : 0;
    
    // Average duration (from sessions with ended_at)
    const sessionsWithDuration = sessions?.filter(s => s.started_at && s.ended_at) || [];
    let avgDuration = 0;
    if (sessionsWithDuration.length > 0) {
      const totalDuration = sessionsWithDuration.reduce((sum, s) => {
        const start = new Date(s.started_at).getTime();
        const end = new Date(s.ended_at).getTime();
        return sum + (end - start) / 1000; // Convert to seconds
      }, 0);
      avgDuration = Math.round(totalDuration / sessionsWithDuration.length);
    }
    
    // Pages per visit
    const pagesPerVisit = totalSessions > 0 
      ? Math.round((totalPageViews / totalSessions) * 10) / 10 
      : 0;

    const data = {
      visitors: uniqueVisitors,
      pageViews: totalPageViews,
      avgDuration,
      bounceRate,
      pagesPerVisit,
      totalSessions,
    };

    console.log('Analytics data calculated:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in get-analytics function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
