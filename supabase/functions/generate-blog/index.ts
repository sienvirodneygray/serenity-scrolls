import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { topic } = await req.json();

    const systemPrompt = `You are a Christian content writer for Serenity Scrolls, a faith-based product that provides color-coded Bible verse scrolls organized by emotion. 

Write engaging, faith-centered blog posts that:
- Connect Scripture with everyday emotional experiences
- Provide practical applications of Biblical wisdom
- Use a warm, encouraging, and accessible tone
- Include relevant Bible verses
- Appeal to families and individuals seeking spiritual growth

Your response must be valid JSON with this exact structure:
{
  "title": "Engaging blog post title",
  "slug": "url-friendly-slug",
  "excerpt": "A compelling 1-2 sentence summary",
  "content": "Full blog post content with markdown formatting (headers, paragraphs, bullet points, scripture references)",
  "category": "faith|emotions|family|devotional|scripture",
  "meta_title": "SEO-optimized title under 60 chars",
  "meta_description": "SEO meta description under 160 chars"
}`;

    const userPrompt = `Write a blog post about: ${topic || "finding peace through Scripture during emotional challenges"}

The post should be 600-800 words, include 2-3 Bible verses, and connect to how Serenity Scrolls helps people navigate emotions through God's Word.`;

    console.log("Generating blog post with AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    console.log("Raw AI response:", content);

    // Parse the JSON from the response
    let blogData;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      blogData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Fallback: create structured data from raw content
      blogData = {
        title: "Faith and Emotions: Finding Peace Through Scripture",
        slug: "faith-emotions-finding-peace-scripture",
        excerpt: "Discover how Scripture can guide you through life's emotional challenges.",
        content: content,
        category: "faith",
        meta_title: "Finding Peace Through Scripture | Serenity Scrolls",
        meta_description: "Learn how Bible verses can help you navigate emotions with faith.",
      };
    }

    console.log("Generated blog data:", blogData);

    return new Response(JSON.stringify(blogData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate blog error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
