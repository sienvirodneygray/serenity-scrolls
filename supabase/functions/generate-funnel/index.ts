import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Poll the OpenAI run until it reaches a terminal state.
async function pollRun(
  apiKey: string,
  threadId: string,
  runId: string,
  maxWaitMs = 60_000
): Promise<"completed" | "failed" | "expired" | "cancelled" | "requires_action"> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 1500));

    const res = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      { headers: { Authorization: `Bearer ${apiKey}`, "OpenAI-Beta": "assistants=v2" } }
    );
    const run = await res.json();

    if (["completed", "failed", "expired", "cancelled", "requires_action"].includes(run.status)) {
      return run.status;
    }
  }
  throw new Error("Run timed out after 60s");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const OPENAI_ASSISTANT_ID = Deno.env.get("OPENAI_ASSISTANT_ID");

    if (!OPENAI_API_KEY || !OPENAI_ASSISTANT_ID) {
      console.error("Missing OPENAI_API_KEY or OPENAI_ASSISTANT_ID");
      return new Response(
        JSON.stringify({ error: "AI service is not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { purpose, target_age_group, link, feedback } = await req.json();

    if (!purpose || !target_age_group) {
      return new Response(
        JSON.stringify({ error: "purpose and target_age_group are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userMessage = [
      `Create a 5-part email sales funnel for Serenity Scrolls with these parameters:`,
      `- Campaign Purpose: ${purpose}`,
      `- Target Demographic: ${target_age_group}`,
      link ? `- Call-To-Action Link: ${link}` : null,
      feedback ? `- Requested Adjustments: ${feedback}` : null,
      ``,
      `Return ONLY a valid JSON object in this exact format — no markdown, no explanation:`,
      `{`,
      `  "emails": [`,
      `    { "sequence_order": 1, "subject": "...", "content": "<p>Full HTML content...</p>" },`,
      `    { "sequence_order": 2, "subject": "...", "content": "<p>...</p>" },`,
      `    { "sequence_order": 3, "subject": "...", "content": "<p>...</p>" },`,
      `    { "sequence_order": 4, "subject": "...", "content": "<p>...</p>" },`,
      `    { "sequence_order": 5, "subject": "...", "content": "<p>...</p>" }`,
      `  ]`,
      `}`,
      ``,
      `The 5 emails must follow this funnel structure:`,
      `1. Welcome / Hook — introduce and build connection`,
      `2. Problem / Empathy — acknowledge the struggle`,
      `3. Solution / Education — present the offering with storytelling`,
      `4. Social Proof / Trust — testimonials or results`,
      `5. Strong CTA / Urgency — drive the conversion`,
    ]
      .filter(Boolean)
      .join("\n");

    // ── 1. Create a new thread ─────────────────────────────────────────────
    const threadRes = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({ messages: [{ role: "user", content: userMessage }] }),
    });

    if (!threadRes.ok) {
      const err = await threadRes.text();
      console.error("Thread creation failed:", err);
      throw new Error("Failed to start AI session.");
    }

    const thread = await threadRes.json();
    const threadId = thread.id;
    console.log("Thread created:", threadId);

    // ── 2. Run the assistant ───────────────────────────────────────────────
    const runRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({
          assistant_id: OPENAI_ASSISTANT_ID,
          // Override instructions to enforce JSON-only output
          additional_instructions:
            "You are generating marketing email funnels. Always respond with ONLY a valid JSON object — no markdown code blocks, no extra text.",
        }),
      }
    );

    if (!runRes.ok) {
      const err = await runRes.text();
      console.error("Run creation failed:", err);
      throw new Error("Failed to run AI assistant.");
    }

    const run = await runRes.json();
    console.log("Run started:", run.id);

    // ── 3. Poll until complete ─────────────────────────────────────────────
    const finalStatus = await pollRun(OPENAI_API_KEY, threadId, run.id);

    if (finalStatus !== "completed") {
      throw new Error(`AI run ended with status: ${finalStatus}`);
    }

    // ── 4. Fetch messages ──────────────────────────────────────────────────
    const messagesRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages?order=desc&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    const messages = await messagesRes.json();
    const lastMessage = messages.data?.[0];
    const rawText = lastMessage?.content?.[0]?.text?.value ?? "";

    console.log("Raw AI response length:", rawText.length);

    // ── 5. Parse JSON (strip markdown fences if present) ──────────────────
    let funnelData: { emails: { sequence_order: number; subject: string; content: string }[] };

    try {
      // Strip ```json ... ``` or ``` ... ``` wrappers if the model added them
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      funnelData = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse failed. Raw text was:", rawText);
      throw new Error("AI returned an invalid response format. Please try again.");
    }

    if (!Array.isArray(funnelData?.emails) || funnelData.emails.length === 0) {
      throw new Error("AI did not return a valid email sequence.");
    }

    console.log(`Successfully generated ${funnelData.emails.length} funnel emails.`);

    return new Response(JSON.stringify(funnelData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate funnel error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
