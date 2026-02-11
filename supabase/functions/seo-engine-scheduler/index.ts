import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "check-schedule";

    // Get config
    const { data: config } = await supabase.from("seo_config").select("*").limit(1).single();
    if (!config) throw new Error("No SEO config found");

    if (action === "check-schedule") {
      if (!config.publish_enabled) {
        return new Response(JSON.stringify({ message: "Publishing disabled" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const now = new Date();
      const currentDay = dayNames[now.getDay()];

      if (!config.schedule_days.includes(currentDay)) {
        return new Response(JSON.stringify({ message: `Not a scheduled day (${currentDay})` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if already published today
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayLogs } = await supabase
        .from("publish_log")
        .select("id")
        .gte("attempted_at", todayStart.toISOString())
        .eq("status", "success")
        .eq("action_type", "publish");

      if (todayLogs && todayLogs.length > 0) {
        return new Response(JSON.stringify({ message: "Already published today" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Trigger generation + publish
      const genResponse = await fetch(`${supabaseUrl}/functions/v1/seo-engine-generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "auto-publish",
          scheduledFor: now.toISOString(),
        }),
      });

      if (!genResponse.ok) {
        const errText = await genResponse.text();
        // Log failure
        await supabase.from("publish_log").insert([{
          scheduled_for: now.toISOString(),
          attempted_at: now.toISOString(),
          status: "failed",
          error_message: errText,
          action_type: "publish",
        }]);

        throw new Error(`Generation failed: ${errText}`);
      }

      const result = await genResponse.json();
      return new Response(JSON.stringify({ message: "Post published", post: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "refresh-old-post") {
      // Find oldest post not refreshed in 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: oldPosts } = await supabase
        .from("blog_posts")
        .select("id, title, slug, content, primary_keyword, cluster_id")
        .eq("published", true)
        .or(`last_refreshed_at.is.null,last_refreshed_at.lt.${thirtyDaysAgo.toISOString()}`)
        .order("published_at", { ascending: true })
        .limit(1);

      if (!oldPosts || oldPosts.length === 0) {
        return new Response(JSON.stringify({ message: "No posts need refreshing" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const post = oldPosts[0];

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const refreshResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an SEO content refresher. Given an existing blog post, add one new relevant section (H2 with 150-200 words), improve the meta description if needed, and suggest additional internal links. Return JSON with fields: new_section (markdown), updated_meta_description (string or null if no change needed), suggested_internal_links (array of slugs).`,
            },
            {
              role: "user",
              content: `Refresh this post:\nTitle: ${post.title}\nKeyword: ${post.primary_keyword}\nContent (first 1000 chars): ${(post.content || "").substring(0, 1000)}`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!refreshResponse.ok) throw new Error("Refresh AI call failed");

      const refreshResult = await refreshResponse.json();
      let refreshData;
      try {
        refreshData = JSON.parse(refreshResult.choices[0].message.content);
      } catch {
        refreshData = { new_section: "", updated_meta_description: null };
      }

      // Append new section
      const updatedContent = (post.content || "") + "\n\n" + (refreshData.new_section || "");
      const updatePayload: any = {
        content: updatedContent,
        last_refreshed_at: new Date().toISOString(),
        word_count: updatedContent.split(/\s+/).filter(Boolean).length,
      };
      if (refreshData.updated_meta_description) {
        updatePayload.meta_description = refreshData.updated_meta_description;
      }

      await supabase.from("blog_posts").update(updatePayload).eq("id", post.id);

      await supabase.from("publish_log").insert([{
        post_id: post.id,
        scheduled_for: new Date().toISOString(),
        attempted_at: new Date().toISOString(),
        status: "success",
        action_type: "refresh",
      }]);

      return new Response(JSON.stringify({ message: "Post refreshed", postId: post.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-calendar") {
      // Return next 30 scheduled slots
      const slots = [];
      const now = new Date();
      let date = new Date(now);
      
      while (slots.length < 30) {
        const dayName = dayNames[date.getDay()];
        if (config.schedule_days.includes(dayName)) {
          // Check if there's already a post scheduled
          const dateStr = date.toISOString().split("T")[0];
          const { data: scheduled } = await supabase
            .from("blog_posts")
            .select("id, title, slug, status, format_type, post_type")
            .gte("publish_at", `${dateStr}T00:00:00`)
            .lt("publish_at", `${dateStr}T23:59:59`)
            .limit(1);

          const { data: published } = await supabase
            .from("blog_posts")
            .select("id, title, slug, status, format_type, post_type")
            .gte("published_at", `${dateStr}T00:00:00`)
            .lt("published_at", `${dateStr}T23:59:59`)
            .limit(1);

          slots.push({
            date: dateStr,
            day: dayName,
            post: scheduled?.[0] || published?.[0] || null,
            status: published?.[0] ? "published" : scheduled?.[0] ? "scheduled" : "open",
          });
        }
        date.setDate(date.getDate() + 1);
      }

      return new Response(JSON.stringify({ slots, config }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Scheduler error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
