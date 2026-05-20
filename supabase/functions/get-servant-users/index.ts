import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // ── 1. All profiles with has_access = true ────────────────────────────────
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, has_access, access_expires_at, subscription_status, offer_7day_sent_at, offer_3day_sent_at, offer_expiry_sent_at, access_granted_at")
      .eq("has_access", true)
      .order("access_granted_at", { ascending: false });

    if (profilesError) throw profilesError;

    // ── 2. All access_requests ────────────────────────────────────────────────
    const { data: requests } = await supabase
      .from("access_requests")
      .select("email, order_id, status, verification_method, redemption_count, max_redemptions, activated_at, access_expires_at");

    const requestMap: Record<string, any> = {};
    for (const r of requests || []) {
      if (!requestMap[r.email]) requestMap[r.email] = r;
    }

    // ── 3. Chat messages stats per user ───────────────────────────────────────
    const userIds = (profiles || []).map((p: any) => p.id);

    const { data: chatMessages } = await supabase
      .from("chat_messages")
      .select("user_id, role, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: true });

    // Aggregate per user_id
    const chatStats: Record<string, {
      total_messages: number;
      user_messages: number;
      assistant_messages: number;
      first_message_at: string | null;
      last_message_at: string | null;
      session_count: number;
    }> = {};

    const TWO_HOURS = 2 * 60 * 60 * 1000;

    for (const msg of chatMessages || []) {
      if (!chatStats[msg.user_id]) {
        chatStats[msg.user_id] = {
          total_messages: 0,
          user_messages: 0,
          assistant_messages: 0,
          first_message_at: null,
          last_message_at: null,
          session_count: 1,
        };
      }
      const s = chatStats[msg.user_id];
      s.total_messages++;
      if (msg.role === "user") s.user_messages++;
      if (msg.role === "assistant") s.assistant_messages++;
      if (!s.first_message_at) s.first_message_at = msg.created_at;

      // Count new session if gap > 2 hours
      if (s.last_message_at) {
        const gap = new Date(msg.created_at).getTime() - new Date(s.last_message_at).getTime();
        if (gap > TWO_HOURS) s.session_count++;
      }
      s.last_message_at = msg.created_at;
    }

    // ── 4. Merge everything ───────────────────────────────────────────────────
    const merged = (profiles || []).map((p: any) => {
      const req = requestMap[p.email];
      const usage = chatStats[p.id] || null;
      return {
        id: p.id,
        email: p.email,
        has_access: p.has_access,
        access_expires_at: p.access_expires_at,
        subscription_status: p.subscription_status,
        offer_7day_sent_at: p.offer_7day_sent_at,
        offer_3day_sent_at: p.offer_3day_sent_at,
        offer_expiry_sent_at: p.offer_expiry_sent_at,
        access_granted_at: p.access_granted_at,
        // from access_requests
        order_id: req?.order_id ?? null,
        verification_method: req?.verification_method ?? "manual",
        redemption_count: req?.redemption_count ?? null,
        max_redemptions: req?.max_redemptions ?? null,
        activated_at: req?.activated_at ?? p.access_granted_at,
        // usage stats
        usage: usage
          ? {
              total_messages: usage.total_messages,
              user_messages: usage.user_messages,
              assistant_messages: usage.assistant_messages,
              session_count: usage.session_count,
              first_message_at: usage.first_message_at,
              last_active_at: usage.last_message_at,
            }
          : null,
      };
    });

    // ── 5. Aggregate totals ───────────────────────────────────────────────────
    const totals = {
      active_users: merged.length,
      total_messages: Object.values(chatStats).reduce((sum, s) => sum + s.user_messages, 0),
      total_sessions: Object.values(chatStats).reduce((sum, s) => sum + s.session_count, 0),
      active_last_7d: merged.filter(u => {
        const last = u.usage?.last_active_at;
        if (!last) return false;
        return Date.now() - new Date(last).getTime() < 7 * 24 * 60 * 60 * 1000;
      }).length,
    };

    return new Response(JSON.stringify({ users: merged, totals }), {
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
