import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tool definition for structured output
const blogPostTool = {
  type: "function",
  function: {
    name: "create_blog_post",
    description: "Creates a structured blog post with SEO optimization",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Engaging blog post title (include journal/prompt keywords when relevant)"
        },
        slug: {
          type: "string",
          description: "URL-friendly slug (lowercase, hyphens only)"
        },
        excerpt: {
          type: "string",
          description: "Compelling 1-2 sentence summary with relevant keywords (100-160 chars)"
        },
        content: {
          type: "string",
          description: "Full blog post content with markdown formatting"
        },
        category: {
          type: "string",
          enum: ["faith", "emotions", "family", "devotional", "scripture", "prayer", "gratitude", "healing"],
          description: "Post category"
        },
        meta_title: {
          type: "string",
          description: "SEO-optimized title under 60 characters"
        },
        meta_description: {
          type: "string",
          description: "SEO meta description under 160 characters"
        },
        seo_keywords: {
          type: "array",
          items: { type: "string" },
          description: "5-8 SEO keywords for the post"
        },
        long_tail_queries: {
          type: "array",
          items: { type: "string" },
          description: "3-5 question phrases people search for (AEO optimization)"
        }
      },
      required: ["title", "slug", "excerpt", "content", "category", "meta_title", "meta_description", "seo_keywords", "long_tail_queries"]
    }
  }
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

    const { topic, additionalContext } = await req.json();

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

## AEO (Answer Engine Optimization) RULES - CRITICAL
These rules optimize content for AI assistants and featured snippets:

1. **Question-Style Headings**: Use H2/H3 headings phrased as questions that searchers ask
   - Example: "## Why Does Anxiety Make Us Feel Alone?"
   - Example: "## How Can Scripture Help With Daily Stress?"

2. **Front-Load Answers**: Start each section with a direct 1-2 sentence answer before elaborating
   - Good: "Peace comes from trusting God's promises. When we anchor ourselves..."
   - Bad: "Many people wonder about finding peace. There are various ways..."

3. **Short Paragraphs**: Keep paragraphs under 80 words for scannability

4. **Natural Keyword Integration**: Weave these keywords naturally:
   - Primary: "journal with prompts", "journal prompts", "journal entry prompts"
   - Secondary: "gratitude journal", "Bible journal", "faith journal", "how to journal"
   - Supporting: "journaling for beginners", "daily devotional", "Scripture reflection"

## Content Structure
Write engaging, faith-centered blog posts with:
1. **Hook** (1-2 sentences): Acknowledge the emotion/struggle empathetically
2. **Scripture Snapshot**: A key verse with brief context (use blockquote format)
3. **Gentle Reflections** (2-3 sections): Each with question-style H2, front-loaded answer, and under-80-word paragraphs
4. **Journal Spark**: A prompt for personal reflection
5. **One Small Step**: A simple, actionable takeaway
6. **Optional Closing Prayer**: Short, heartfelt prayer

## Writing Guidelines
- Use "we" language to walk alongside readers
- Include 2-3 Bible verses with references (NIV, ESV, or NLT)
- Format Scripture as blockquotes (> prefix)
- Use headers (##) for main sections, (###) for subsections
- Total length: 600-800 words

You MUST call the create_blog_post function with all required fields.`;

    const userPrompt = topic 
      ? `Write a blog post about: ${topic}${additionalContext ? `\n\nAdditional context: ${additionalContext}` : ''}

Remember to:
- Use question-style H2 headings for AEO optimization
- Front-load answers at the start of each section
- Keep paragraphs under 80 words
- Include Scripture Snapshot, Gentle Reflections, Journal Spark, and One Small Step sections
- Generate relevant SEO keywords and long-tail query questions`
      : `Write a blog post about finding peace through Scripture during emotional challenges.

Remember to:
- Use question-style H2 headings for AEO optimization
- Front-load answers at the start of each section
- Keep paragraphs under 80 words
- Include Scripture Snapshot, Gentle Reflections, Journal Spark, and One Small Step sections
- Generate relevant SEO keywords and long-tail query questions`;

    console.log("Generating AEO-optimized blog post with tool calling...");

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
          { role: "user", content: userPrompt },
        ],
        tools: [blogPostTool],
        tool_choice: { type: "function", function: { name: "create_blog_post" } },
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
    console.log("AI Response:", JSON.stringify(aiResponse, null, 2));

    // Extract tool call arguments
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      let blogData;
      try {
        blogData = JSON.parse(toolCall.function.arguments);
      } catch (parseError) {
        console.error("Failed to parse tool call arguments:", parseError);
        throw new Error("Failed to parse AI response");
      }

      console.log("Generated blog data via tool calling:", blogData);

      return new Response(JSON.stringify(blogData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to extract from content if tool calling didn't work
    const content = aiResponse.choices?.[0]?.message?.content;
    if (content) {
      console.log("Falling back to content parsing...");
      let blogData;
      try {
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        blogData = JSON.parse(jsonStr);
        
        // Ensure arrays exist
        blogData.seo_keywords = blogData.seo_keywords || blogData.seoKeywords || [];
        blogData.long_tail_queries = blogData.long_tail_queries || blogData.longTailQueries || [];
        
        return new Response(JSON.stringify(blogData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (parseError) {
        console.error("Failed to parse fallback content:", parseError);
      }
    }

    throw new Error("No valid blog data generated");
  } catch (error) {
    console.error("Generate blog error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
