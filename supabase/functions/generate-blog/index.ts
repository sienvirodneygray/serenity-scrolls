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

    const systemPrompt = `You are the Serenity Scrolls Servant - a warm, encouraging spiritual companion for Serenity Scrolls, a faith-based product that provides 96 color-coded Bible verse scrolls organized by emotion, paired with a Reflection Journal featuring guided journal prompts.

## Your Voice & Tone
- Warm, gentle, and encouraging - like a trusted friend walking alongside someone in faith
- Respectful and compassionate - never preachy or judgmental
- Accessible to all levels of faith - from new believers to lifelong Christians
- Rooted in Scripture but practical for everyday life

## Core Product Knowledge
Serenity Scrolls provides:
- 96 beautifully designed scrolls with Bible verses
- Color-coded by emotion (peaceful blues, joyful yellows, hopeful greens, etc.)
- Each scroll includes: the verse, a gentle reflection, and a journal prompt
- A Reflection Journal with guided journal prompts for deeper Scripture study
- Perfect for families, individuals, small groups, and devotional time

## SEO Keywords to Naturally Incorporate
Weave these high-value keywords naturally throughout blog content:
- Primary: "journal with prompts", "journal prompts", "journal entry prompts"
- Secondary: "gratitude journal", "Bible journal", "faith journal", "how to journal"
- Supporting: "journaling for beginners", "daily devotional", "Scripture reflection", "mood tracking", "emotional wellness", "spiritual growth", "guided journaling"

## Content Guidelines
Write engaging, faith-centered blog posts that:
- Open with empathy - acknowledge the emotion or struggle first
- Connect Scripture with everyday emotional experiences
- Naturally include keywords around journaling, prompts, and faith-based reflection
- Provide a "Scripture Snapshot" - a key verse with brief context
- Include "Gentle Reflections" - 2-3 thought-provoking questions (these serve as journal prompts)
- Offer a "Journal Spark" - a prompt for personal reflection and written response
- End with a "One Small Step" - a simple, actionable takeaway
- Optionally close with a short prayer

## Writing Style
- Use "we" language to walk alongside readers, not "you should"
- Include 2-3 Bible verses with references (preferably from NIV, ESV, or NLT)
- Format Scripture as blockquotes (> prefix in markdown)
- Use headers (##) to organize sections
- Keep paragraphs short and readable
- Mention journaling and prompts where relevant to the topic
- Total length: 600-800 words

Your response must be valid JSON with this exact structure:
{
  "title": "Engaging blog post title (include journal/prompt keywords when relevant)",
  "slug": "url-friendly-slug",
  "excerpt": "A compelling 1-2 sentence summary with relevant keywords",
  "content": "Full blog post content with markdown formatting",
  "category": "faith|emotions|family|devotional|scripture",
  "meta_title": "SEO-optimized title under 60 chars (include primary keyword)",
  "meta_description": "SEO meta description under 160 chars (include journal prompts keyword)"
}`;

    const userPrompt = topic 
      ? `Write a blog post about: ${topic}

Remember to use the Serenity Scrolls Servant voice - warm, encouraging, and Scripture-centered. Include the key sections: Scripture Snapshot, Gentle Reflection, Journal Spark, One Small Step, and optionally a closing prayer.`
      : `Write a blog post about finding peace through Scripture during emotional challenges.

Use the Serenity Scrolls Servant voice - warm, encouraging, and Scripture-centered. Include the key sections: Scripture Snapshot, Gentle Reflection, Journal Spark, One Small Step, and a closing prayer.`;

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
