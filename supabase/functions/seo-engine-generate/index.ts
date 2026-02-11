import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface TopicCluster {
  id: string;
  name: string;
  pillar_post_id: string | null;
  spoke_count?: number;
}

interface BacklogItem {
  id: string;
  topic: string;
  cluster_id: string | null;
  priority: number;
  format_type: string | null;
  primary_keyword: string | null;
}

interface ExistingPost {
  id: string;
  title: string;
  slug: string;
  primary_keyword: string | null;
  cluster_id: string | null;
  post_type: string | null;
  published_at: string | null;
}

async function getExistingContext(supabase: any) {
  const [postsRes, clustersRes, backlogRes, configRes] = await Promise.all([
    supabase.from("blog_posts").select("id, title, slug, primary_keyword, cluster_id, post_type, category, published_at, format_type").order("created_at", { ascending: false }).limit(100),
    supabase.from("topic_clusters").select("*"),
    supabase.from("topic_backlog").select("*").eq("status", "queued").order("priority", { ascending: false }).limit(10),
    supabase.from("seo_config").select("*").limit(1).single(),
  ]);
  return {
    posts: (postsRes.data || []) as ExistingPost[],
    clusters: (clustersRes.data || []) as TopicCluster[],
    backlog: (backlogRes.data || []) as BacklogItem[],
    config: configRes.data,
  };
}

function determineFormatNeeded(posts: ExistingPost[]): string {
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  const recentFormats = posts
    .filter(p => p.published_at && new Date(p.published_at) > thisWeek)
    .map(p => (p as any).format_type)
    .filter(Boolean);

  const formats = ["how-to", "list", "problem-solution"];
  for (const f of formats) {
    if (!recentFormats.includes(f)) return f;
  }
  return formats[Math.floor(Math.random() * formats.length)];
}

function determineClusterNeed(clusters: TopicCluster[], posts: ExistingPost[]): { clusterId: string | null; needsPillar: boolean } {
  for (const cluster of clusters) {
    if (!cluster.pillar_post_id) {
      return { clusterId: cluster.id, needsPillar: true };
    }
    const spokeCount = posts.filter(p => p.cluster_id === cluster.id && p.post_type === "spoke").length;
    if (spokeCount < 6) {
      return { clusterId: cluster.id, needsPillar: false };
    }
  }
  return { clusterId: null, needsPillar: false };
}

const seoPostTool = {
  type: "function",
  function: {
    name: "create_seo_post",
    description: "Creates a complete SEO-optimized blog post",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "H1 title" },
        slug: { type: "string", description: "URL-friendly slug" },
        excerpt: { type: "string", description: "1-2 sentence summary (100-160 chars)" },
        content: { type: "string", description: "Full blog post in markdown with TOC, H2/H3, FAQ, Key Takeaways" },
        category: { type: "string" },
        meta_title: { type: "string", description: "50-60 chars" },
        meta_description: { type: "string", description: "150-160 chars" },
        og_title: { type: "string", description: "OG title" },
        og_description: { type: "string", description: "OG description" },
        primary_keyword: { type: "string" },
        secondary_keywords: { type: "array", items: { type: "string" }, description: "3-8 secondary keywords" },
        search_intent: { type: "string", enum: ["informational", "commercial", "transactional"] },
        target_persona: { type: "string" },
        format_type: { type: "string", enum: ["how-to", "list", "problem-solution"] },
        post_type: { type: "string", enum: ["pillar", "spoke"] },
        image_prompt: { type: "string", description: "Suggested featured image prompt" },
        faq_items: {
          type: "array",
          items: {
            type: "object",
            properties: { question: { type: "string" }, answer: { type: "string" } },
            required: ["question", "answer"],
          },
          description: "3-6 FAQ items",
        },
        internal_link_suggestions: {
          type: "array",
          items: { type: "string" },
          description: "Slugs of existing posts to link to",
        },
        seo_keywords: { type: "array", items: { type: "string" } },
        long_tail_queries: { type: "array", items: { type: "string" } },
      },
      required: ["title", "slug", "excerpt", "content", "category", "meta_title", "meta_description", "primary_keyword", "secondary_keywords", "format_type", "post_type", "faq_items"],
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { action, topic: manualTopic, clusterId: manualClusterId, formatType: manualFormat, postType: manualPostType } = body;

    const ctx = await getExistingContext(supabase);
    const formatNeeded = manualFormat || determineFormatNeeded(ctx.posts);
    const clusterNeed = determineClusterNeed(ctx.clusters, ctx.posts);

    // Determine topic source
    let topicInstruction = "";
    let backlogItemId: string | null = null;
    let assignedClusterId = manualClusterId || clusterNeed.clusterId;
    let postType = manualPostType || (clusterNeed.needsPillar ? "pillar" : "spoke");

    if (manualTopic) {
      topicInstruction = `Write about: ${manualTopic}`;
    } else if (ctx.backlog.length > 0) {
      const item = ctx.backlog[0];
      topicInstruction = `Write about: ${item.topic}`;
      backlogItemId = item.id;
      if (item.cluster_id) assignedClusterId = item.cluster_id;
      if (item.format_type) postType = item.format_type === "how-to" || item.format_type === "list" || item.format_type === "problem-solution" ? item.format_type : postType;
    } else {
      topicInstruction = "Generate a relevant topic based on the site niche and content gaps.";
    }

    // Build existing posts context for dedup + internal linking
    const existingTitles = ctx.posts.map(p => p.title).join("\n- ");
    const existingKeywords = ctx.posts.map(p => p.primary_keyword).filter(Boolean).join(", ");
    const existingSlugs = ctx.posts.map(p => `/${p.slug}`).join(", ");

    // Get cluster info
    let clusterContext = "";
    if (assignedClusterId) {
      const cluster = ctx.clusters.find(c => c.id === assignedClusterId);
      if (cluster) {
        const clusterPosts = ctx.posts.filter(p => p.cluster_id === assignedClusterId);
        clusterContext = `\nCluster: "${cluster.name}" - ${cluster.description || ""}
Existing cluster posts: ${clusterPosts.map(p => `${p.title} (/${p.slug})`).join(", ") || "none"}
${cluster.pillar_post_id ? "Pillar exists - create a spoke that links to the pillar." : "No pillar exists - create the pillar post for this cluster."}`;
      }
    }

    const wordCountTarget = postType === "pillar" ? "1400-2200" : "900-1200";

    const systemPrompt = `You are an SEO Authority Engine. Generate a complete, high-quality blog post optimized for search engines and reader engagement.

## Site Context
Site: ${ctx.config?.site_name || "Serenity Scrolls"}
Niche: ${ctx.config?.niche_summary || "Faith-based journals, Bible verse scrolls, guided journal prompts, spiritual growth"}
Audience: ${ctx.config?.audience_personas || "Christians seeking spiritual growth, journal enthusiasts, families"}
CTA: ${ctx.config?.cta_preference || "Encourage readers to explore Serenity Scrolls products"}
${clusterContext}

## Content Rules
- Format: ${formatNeeded} (${formatNeeded === "how-to" ? "tutorial/guide" : formatNeeded === "list" ? "listicle/checklist" : "problem-solution/myths/mistakes"})
- Post type: ${postType} (${postType === "pillar" ? "comprehensive hub article" : "supporting article"})
- Word count: ${wordCountTarget} words MINIMUM
- Include: Table of Contents, H2/H3 hierarchy, Key Takeaways, FAQ (3-6 Qs), Conclusion with CTA
- Short paragraphs (under 80 words), scannable bullets
- Concrete steps, real examples, common pitfalls

## Deduplication - AVOID these existing topics
Existing titles:\n- ${existingTitles || "none"}
Existing keywords: ${existingKeywords || "none"}
DO NOT duplicate any existing title, slug, or primary keyword.

## Internal Linking
Available posts to link to: ${existingSlugs || "none yet"}
Insert 2-5 internal links using descriptive anchor text.
${postType === "spoke" ? "Link to the cluster pillar if it exists." : "Link to 3-6 spoke articles in the cluster."}

You MUST call create_seo_post with all required fields.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: topicInstruction },
        ],
        tools: [seoPostTool],
        tool_choice: { type: "function", function: { name: "create_seo_post" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const aiRes = await response.json();
    const toolCall = aiRes.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No valid response from AI");
    }

    const postData = JSON.parse(toolCall.function.arguments);

    // Count words
    const wordCount = (postData.content || "").split(/\s+/).filter(Boolean).length;

    // Build FAQ schema JSON-LD
    const faqSchema = postData.faq_items ? {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: postData.faq_items.map((faq: any) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    } : null;

    // Resolve internal links
    const internalLinks = (postData.internal_link_suggestions || [])
      .filter((slug: string) => ctx.posts.some(p => p.slug === slug.replace(/^\//, "")));

    // Save to blog_posts
    const insertData = {
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt,
      content: postData.content,
      category: postData.category || "faith",
      author: "Serenity Scrolls Team",
      meta_title: postData.meta_title,
      meta_description: postData.meta_description,
      og_title: postData.og_title || postData.meta_title,
      og_description: postData.og_description || postData.meta_description,
      primary_keyword: postData.primary_keyword,
      secondary_keywords: postData.secondary_keywords || [],
      seo_keywords: postData.seo_keywords || postData.secondary_keywords || [],
      long_tail_queries: postData.long_tail_queries || [],
      search_intent: postData.search_intent || "informational",
      target_persona: postData.target_persona,
      format_type: postData.format_type || formatNeeded,
      post_type: postData.post_type || postType,
      cluster_id: assignedClusterId || null,
      image_prompt: postData.image_prompt,
      faq_schema: faqSchema,
      internal_links: internalLinks,
      word_count: wordCount,
      published: false,
      status: "draft",
      publish_at: body.publishAt || null,
    };

    const shouldAutoSave = action === "generate-and-save" || action === "auto-publish";

    if (shouldAutoSave) {
      const { data: saved, error: saveErr } = await supabase
        .from("blog_posts")
        .insert([insertData])
        .select()
        .single();

      if (saveErr) throw saveErr;

      // Mark backlog item as used
      if (backlogItemId) {
        await supabase.from("topic_backlog").update({ status: "used" }).eq("id", backlogItemId);
      }

      // Update cluster pillar if this is a pillar
      if (postType === "pillar" && assignedClusterId && saved) {
        await supabase.from("topic_clusters").update({ pillar_post_id: saved.id }).eq("id", assignedClusterId);
      }

      // Auto-publish if requested
      if (action === "auto-publish") {
        await supabase.from("blog_posts").update({
          published: true,
          status: "published",
          published_at: new Date().toISOString(),
        }).eq("id", saved.id);

        await supabase.from("publish_log").insert([{
          post_id: saved.id,
          scheduled_for: body.scheduledFor || new Date().toISOString(),
          attempted_at: new Date().toISOString(),
          status: "success",
          action_type: "publish",
        }]);
      }

      return new Response(JSON.stringify({ ...postData, id: saved.id, word_count: wordCount, faq_schema: faqSchema, saved: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Just return generated data without saving
    return new Response(JSON.stringify({ ...postData, word_count: wordCount, faq_schema: faqSchema, cluster_id: assignedClusterId, saved: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("SEO engine error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
