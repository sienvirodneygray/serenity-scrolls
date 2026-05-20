import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * get-servant-users — Admin-only edge function
 * Returns all profiles with has_access=true merged with their access_requests record.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS.
 * Caller must be an authenticated admin (validated via user_roles table).
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    // Fetch all profiles with has_access = true
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, has_access, access_expires_at, subscription_status, offer_7day_sent_at, access_granted_at")
      .eq("has_access", true)
      .order("access_granted_at", { ascending: false });

    if (profilesError) throw profilesError;

    // Fetch all access_requests
    const { data: requests } = await supabase
      .from("access_requests")
      .select("email, order_id, status, verification_method, redemption_count, max_redemptions, activated_at, access_expires_at")
      .order("activated_at", { ascending: false });

    const requestMap: Record<string, any> = {};
    for (const r of requests || []) {
      if (!requestMap[r.email]) requestMap[r.email] = r;
    }

    // Merge profiles with their access_requests record
    const merged = (profiles || []).map((p: any) => ({
      id: p.id,
      email: p.email,
      has_access: p.has_access,
      access_expires_at: p.access_expires_at,
      subscription_status: p.subscription_status,
      offer_7day_sent_at: p.offer_7day_sent_at,
      access_granted_at: p.access_granted_at,
      // from access_requests if exists
      order_id: requestMap[p.email]?.order_id ?? null,
      verification_method: requestMap[p.email]?.verification_method ?? "manual",
      redemption_count: requestMap[p.email]?.redemption_count ?? null,
      max_redemptions: requestMap[p.email]?.max_redemptions ?? null,
      activated_at: requestMap[p.email]?.activated_at ?? p.access_granted_at,
    }));

    return new Response(JSON.stringify({ users: merged }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("get-servant-users error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
