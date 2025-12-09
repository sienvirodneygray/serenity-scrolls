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
    if (!apiKey || apiKey !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'startDate and endDate are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching analytics from ${startDate} to ${endDate}`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch page view events in date range
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('event_type', 'page_view')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
    }

    // Fetch sessions for duration calculation
    const { data: sessions, error: sessionsError } = await supabase
      .from('analytics_sessions')
      .select('*')
      .gte('started_at', startDate)
      .lte('started_at', endDate);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      throw sessionsError;
    }

    // Group events by visitor_id for bounce rate calculation
    const visitorPageCounts: Record<string, number> = {};
    for (const event of events || []) {
      const visitorId = event.visitor_id;
      if (!visitorId) continue;
      visitorPageCounts[visitorId] = (visitorPageCounts[visitorId] || 0) + 1;
    }

    const visitorIds = Object.keys(visitorPageCounts);
    const visitors = visitorIds.length;
    const pageViews = events?.length || 0;

    // Calculate average duration from sessions (ended_at - started_at)
    let totalDuration = 0;
    let sessionsWithDuration = 0;
    
    for (const session of sessions || []) {
      if (session.started_at && session.ended_at) {
        const start = new Date(session.started_at).getTime();
        const end = new Date(session.ended_at).getTime();
        const duration = (end - start) / 1000; // seconds
        if (duration > 0 && duration < 3600) { // Cap at 1 hour to filter outliers
          totalDuration += duration;
          sessionsWithDuration++;
        }
      }
    }
    
    const avgDuration = sessionsWithDuration > 0 
      ? Math.round(totalDuration / sessionsWithDuration) 
      : 0;

    // Calculate bounce rate (% of visitors with only 1 page view)
    let bouncedVisitors = 0;
    for (const visitorId of visitorIds) {
      if (visitorPageCounts[visitorId] === 1) {
        bouncedVisitors++;
      }
    }
    const bounceRate = visitors > 0 
      ? Math.round((bouncedVisitors / visitors) * 1000) / 10 
      : 0;

    // Calculate pages per visit
    const pagesPerVisit = visitors > 0 
      ? Math.round((pageViews / visitors) * 10) / 10 
      : 0;

    const analytics = {
      visitors,
      pageViews,
      avgDuration,
      bounceRate,
      pagesPerVisit,
    };

    console.log('Analytics calculated:', analytics);

    return new Response(
      JSON.stringify({ analytics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in get-analytics function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
