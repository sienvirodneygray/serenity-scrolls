import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * create-course-enrollment
 * Called by: Stripe webhook (after successful course payment) OR directly from frontend for free previews.
 * Writes a course_enrollments row and sends the welcome email.
 *
 * Body: { courseId, userId, stripeSessionId, stripePaymentIntentId, amountPaidCents }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { courseId, userId, stripeSessionId, stripePaymentIntentId, amountPaidCents, track } = await req.json();

    if (!courseId || !userId) {
      return new Response(JSON.stringify({ error: "courseId and userId are required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Upsert enrollment (idempotent — safe for webhook retries)
    const { data: enrollment, error } = await supabase
      .from("course_enrollments")
      .upsert({
        user_id: userId,
        course_id: courseId,
        stripe_session_id: stripeSessionId,
        stripe_payment_intent_id: stripePaymentIntentId,
        amount_paid_cents: amountPaidCents,
        track: track || "parent",
        enrolled_at: new Date().toISOString(),
      }, { onConflict: "user_id,course_id", ignoreDuplicates: true })
      .select()
      .single();

    if (error) throw error;

    // Fetch user email for welcome email
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const email = userData?.user?.email;

    // Fetch course details
    const { data: course } = await supabase
      .from("courses")
      .select("title, slug")
      .eq("id", courseId)
      .single();

    // Fire welcome email (non-blocking)
    if (email && course) {
      const siteUrl = Deno.env.get("SITE_URL") || "https://serenityscrolls.faith";
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Serenity Scrolls <info@serenityscrolls.faith>",
            to: email,
            subject: `Welcome to ${course.title} — You're enrolled! 🎉`,
            html: `
              <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#faf9f6;">
                <h1 style="color:#4c1d95;font-size:24px;margin-bottom:8px;">${course.title}</h1>
                <p style="font-size:16px;color:#374151;margin-bottom:24px;">
                  You're officially enrolled. Your faith-based bullying guidance course is ready.
                </p>
                <a href="${siteUrl}/learn/${course.slug}" style="display:inline-block;background:#6B46C1;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
                  Start Module 1 →
                </a>
                <p style="margin-top:32px;font-size:13px;color:#9ca3af;">
                  This course is a Scripture-based devotional and educational framework. It is not therapy, legal advice, or crisis intervention.
                </p>
              </div>
            `,
          }),
        }).catch(console.error);
      }
    }

    return new Response(JSON.stringify({ success: true, enrollment }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("create-course-enrollment error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
