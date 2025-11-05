import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASSISTANT_ID = "asst_w8jcbRmFnDOCwRQc854yOOE6";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, threadId } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("Processing request with threadId:", threadId);

    // Create a new thread if none exists
    let currentThreadId = threadId;
    if (!currentThreadId) {
      console.log("Creating new thread...");
      const threadResponse = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
      });

      if (!threadResponse.ok) {
        const error = await threadResponse.text();
        console.error("Thread creation error:", error);
        throw new Error("Failed to create thread");
      }

      const thread = await threadResponse.json();
      currentThreadId = thread.id;
      console.log("Created thread:", currentThreadId);
    }

    // Add the user's message to the thread
    console.log("Adding message to thread...");
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        role: "user",
        content: message,
      }),
    });

    if (!messageResponse.ok) {
      const error = await messageResponse.text();
      console.error("Message creation error:", error);
      throw new Error("Failed to add message");
    }

    // Run the assistant
    console.log("Running assistant...");
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID,
        stream: true,
      }),
    });

    if (!runResponse.ok) {
      const error = await runResponse.text();
      console.error("Run creation error:", error);
      
      if (runResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error("Failed to run assistant");
    }

    // Stream the response back to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send the thread ID first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "thread_id", threadId: currentThreadId })}\n\n`));

        const reader = runResponse.body?.getReader();
        if (!reader) {
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
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  
                  console.log("Event:", parsed.event);
                  
                  // Forward relevant events to the client
                  if (parsed.event === "thread.message.delta") {
                    const delta = parsed.data?.delta;
                    if (delta?.content) {
                      for (const contentPart of delta.content) {
                        if (contentPart.type === "text" && contentPart.text?.value) {
                          console.log("Sending content:", contentPart.text.value);
                          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            type: "content",
                            content: contentPart.text.value
                          })}\n\n`));
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.error("Parse error:", e);
                }
              }
            }
          }
        } catch (e) {
          console.error("Stream error:", e);
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
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
