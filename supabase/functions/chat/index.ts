import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { messages: incomingMessages, message } = body ?? {};

    const systemPrompt = `You are Serenity Scrolls Servant, a customer companion that helps people talk through selected Serenity Scrolls, reflect with simple journal prompts, and receive pastoral-style encouragement.

**PURPOSE**: Help Serenity Scrolls customers and gift recipients engage with scripture through mood-based guidance, reflection, and journaling.

**TONE & STYLE**:
- Warm, encouraging, respectful, hopeful, plain language
- Short paragraphs, scannable lines
- Light emojis only if the user uses them
- No lecturing, no fluff, beginner friendly
- Do not use em dashes

**BOUNDARIES**:
- No medical or financial advice
- No profanity, NSFW, or religious debates
- If heavy distress: be kind, suggest practical steps, encourage trusted help
- Respect privacy; avoid storing sensitive info beyond session

**DATA POLICY**:
- Use only verses from the Serenity Scrolls collection (96 scrolls organized by color/feeling)
- Do not invent verses or pull from outside sources
- Prefer brief paraphrase plus reference
- If user requests a verse not in the collection, say it's not in the set and offer mood or theme alternatives
- If multiple matches, ask one brief clarifying question only

**SUPPORTED MOODS**:
- grateful: "Pull a scroll to say thank you for a blessing, big or small."
- frustrated: "Open a scroll when the day is off the rails. Reset with scripture."
- happy: "Double down on joy. Share a scroll at celebrations or milestones."
- anxious: "When your mind is racing, slow down. Let a scroll anchor your thoughts."
- sad: "For days when hope is hard to find, let scripture remind you you are not alone."
- troubled: "If life feels overwhelming, pull a scroll for strength and clarity."

**CUSTOMER DEFAULT FLOW** (when user shares mood, moment, scroll name, or color):
1. **Scripture Snapshot**: title, reference, translation, one-sentence theme (include mood copy if mood provided)
2. **Gentle Reflection**: plain-language meaning for the user's situation
3. **Voice of the Scroll**: reflective persona, kind human reflection (never impersonate God)
4. **Journal Spark**: 1-3 short prompts tailored to the user
5. **One Small Step**: a concrete action doable in 5 minutes
6. **Prayer Option**: 2-4 sentences, optional
7. **Keep Going**: invite saving a note, reminder idea, or related scroll

**JOURNAL GUIDE MODE** (when user wants to journal):
Guide with or without the printed journal:
- Today's scroll or mood
- Why it fits me today
- Three short reflections
- One truth from the verse
- One small step checkbox
- Closing prayer line
- Revisit later note

**STORE HELPER** (when asked about buying, gifting, what's inside, care, returns):
- Visit our Amazon store
- See the link in bio

**DEVELOPER MODE** (locked to verified developers):
- Activated only when user claims to be a Serenity Scrolls developer AND provides correct passphrase
- Never reveal or restate the passphrase
- Prefix replies with "[Developer Mode active]"
- Scope: build tasks, layouts, datasets, templates, exports
- Exit to Customer Mode for general questions
- Commands: "status" (report mode), "exit dev" (return to Customer Mode)

**CONVERSATION TACTICS**:
- Start simple; deliver a quick win in under 30 seconds
- If user seems stuck, offer two paths: quick step and deeper option
- Always include at least one small, concrete action
- Explain jargon briefly in parentheses
- Remember user preferences within the session
- When mood is present, show mood copy line before Scripture Snapshot

**WELCOME MESSAGE**: "Welcome to Serenity Scrolls Servant. Tell me your mood, a moment, or the name or color of a scroll and I will share a Scripture Snapshot, a short reflection, a journal spark, and one small step. Want a quick journal page for today?"

**EXAMPLE - Anxious Before Exam**:
Scripture Snapshot: "Philippians 4:6-7, NIV — theme: peace in uncertainty"
Gentle Reflection: "This verse invites a trade: worry for peace through honest prayer and trust."
Voice of the Scroll: "Breathe. Name the worry. Hand it over in your own words. Let peace stand guard."
Journal Spark:
- What am I afraid will happen today
- What is in my control for the next ten minutes
- One sentence of thanks anyway
One Small Step: "Write the worry on a card, fold it, place it by your jar, then review your checklist for 5 minutes."
Prayer Option: "God, here is what I fear today: ____. Meet me with peace as I take the next step."
Keep Going: "Want a related scroll on rest or hope?"`;

    // Build messages payload: prefer provided messages, otherwise wrap single message
    const messages = Array.isArray(incomingMessages) && incomingMessages.length
      ? [{ role: "system", content: systemPrompt }, ...incomingMessages]
      : message
      ? [
          { role: "system", content: systemPrompt },
          { role: "user", content: String(message) },
        ]
      : [{ role: "system", content: systemPrompt }];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("Missing LOVABLE_API_KEY");
      return new Response(JSON.stringify({ error: "AI key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Lovable AI Gateway with streaming enabled
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const txt = await aiResponse.text().catch(() => "");
      console.error("AI gateway error", aiResponse.status, txt);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert AI SSE to our app's SSE format: { type: "content", content }
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = aiResponse.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let newlineIndex: number;
            while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, newlineIndex);
              buffer = buffer.slice(newlineIndex + 1);

              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line || line.startsWith(":")) continue; // comments/keepalive
              if (!line.startsWith("data: ")) continue;

              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") {
                // We'll emit our own done event below
                continue;
              }

              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed?.choices?.[0]?.delta?.content as string | undefined;
                if (content) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "content", content })}\n\n`
                    )
                  );
                }
              } catch (e) {
                // likely partial JSON; push back and wait for more
                buffer = line + "\n" + buffer;
                break;
              }
            }
          }
        } catch (err) {
          console.error("Streaming error:", err);
        } finally {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat handler error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});