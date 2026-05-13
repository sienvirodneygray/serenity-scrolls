import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * create-course-checkout
 * Creates a Stripe Checkout Session for a course purchase.
 * On success, Stripe webhook calls create-course-enrollment to write the enrollment row.
 *
 * Body: { courseSlug, userId, email, successUrl?, cancelUrl? }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { courseSlug, userId, email, successUrl, cancelUrl, tierId } = await req.json();
    if (!courseSlug || !email) {
      return new Response(JSON.stringify({ error: "courseSlug and email are required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const TIER_MAP: Record<string, { price: number, name: string, track: string }> = {
      starter: { price: 9700, name: "Courage Starter", track: "parent" },
      full: { price: 19700, name: "Courage Covenant™ Full", track: "parent" },
      leader: { price: 49700, name: "Leader Kit™", track: "leader" }
    };

    const selectedTier = TIER_MAP[tierId] || TIER_MAP.full;

    // Fetch course details for ID
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select("id, title")
      .eq("slug", courseSlug)
      .single();

    if (courseErr || !course) {
      return new Response(JSON.stringify({ error: "Course not found." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const priceCents = selectedTier.price;
    const productName = `${course.title} — ${selectedTier.name}`;
    const siteUrl = Deno.env.get("SITE_URL") || "https://serenityscrolls.faith";

    const sessionParams = new URLSearchParams({
      mode: "payment",
      customer_email: email,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(priceCents),
      "line_items[0][price_data][product_data][name]": productName,
      "line_items[0][price_data][product_data][description]": "Serenity Scrolls Faith-Based Course",
      "line_items[0][quantity]": "1",
      "success_url": successUrl || `${siteUrl}/learn/${courseSlug}?enrolled=true&session_id={CHECKOUT_SESSION_ID}`,
      "cancel_url": cancelUrl || `${siteUrl}/learn/${courseSlug}?cancelled=true`,
      "metadata[source]": "serenity-lms",
      "metadata[course_id]": course.id,
      "metadata[course_slug]": courseSlug,
      "metadata[user_id]": userId || "",
      "metadata[customer_email]": email,
      "metadata[amount_paid_cents]": String(priceCents),
      "metadata[track]": selectedTier.track,
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: sessionParams,
    });

    const session = await res.json();
    if (session.error) throw new Error(session.error.message);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("create-course-checkout error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
