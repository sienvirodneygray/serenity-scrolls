import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { postId, postData } = await req.json();

    // Get data to validate against
    let data = postData;
    if (postId && !postData) {
      const { data: post } = await supabase.from("blog_posts").select("*").eq("id", postId).single();
      data = post;
    }

    if (!data) throw new Error("No post data to validate");

    const issues: string[] = [];
    const warnings: string[] = [];

    // 1. Check unique title
    const { data: titleDups } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("title", data.title)
      .neq("id", postId || "");
    if (titleDups && titleDups.length > 0) issues.push("Title is not unique");

    // 2. Check unique slug
    const { data: slugDups } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", data.slug)
      .neq("id", postId || "");
    if (slugDups && slugDups.length > 0) issues.push("Slug is not unique");

    // 3. Check keyword not used in last 90 days
    if (data.primary_keyword) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data: keywordDups } = await supabase
        .from("blog_posts")
        .select("id, title")
        .eq("primary_keyword", data.primary_keyword)
        .gte("published_at", ninetyDaysAgo.toISOString())
        .neq("id", postId || "");
      if (keywordDups && keywordDups.length > 0) {
        issues.push(`Primary keyword "${data.primary_keyword}" used in last 90 days by: ${keywordDups.map(p => p.title).join(", ")}`);
      }
    }

    // 4. Word count
    const wordCount = data.word_count || (data.content || "").split(/\s+/).filter(Boolean).length;
    const minWords = data.post_type === "pillar" ? 1400 : 900;
    if (wordCount < minWords) {
      issues.push(`Word count (${wordCount}) below minimum (${minWords}) for ${data.post_type || "spoke"}`);
    }

    // 5. TOC present
    if (!(data.content || "").includes("## ")) {
      issues.push("No H2 headings found (table of contents needed)");
    }

    // 6. FAQ present
    const contentLower = (data.content || "").toLowerCase();
    if (!contentLower.includes("faq") && !contentLower.includes("frequently asked") && !data.faq_schema) {
      warnings.push("No FAQ section detected");
    }

    // 7. Key Takeaways
    if (!contentLower.includes("key takeaway") && !contentLower.includes("takeaways")) {
      warnings.push("No Key Takeaways section detected");
    }

    // 8. Internal links
    const { count } = await supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("published", true);
    if ((count || 0) >= 5) {
      const linkCount = (data.internal_links || []).length;
      if (linkCount < 2) {
        warnings.push(`Only ${linkCount} internal links (recommend 2-5)`);
      }
    }

    // 9. Meta lengths
    if (data.meta_title && (data.meta_title.length < 50 || data.meta_title.length > 60)) {
      warnings.push(`Meta title length: ${data.meta_title.length} (target: 50-60)`);
    }
    if (data.meta_description && (data.meta_description.length < 150 || data.meta_description.length > 160)) {
      warnings.push(`Meta description length: ${data.meta_description.length} (target: 150-160)`);
    }

    const valid = issues.length === 0;

    return new Response(JSON.stringify({ valid, issues, warnings, wordCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
