import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Amazon Order ID format: XXX-XXXXXXX-XXXXXXX
const AMAZON_ORDER_PATTERN = /^\d{3}-\d{7}-\d{7}$/;

/**
 * Exchange LWA (Login With Amazon) refresh token for a short-lived access token.
 * This is the ONLY auth required for self-authorized SP-API apps.
 * No AWS Signature v4 / IAM role assumption is needed.
 *
 * Required Supabase secrets (either prefix works):
 *   AMAZON_SPAPI_CLIENT_ID    — LWA Client ID (preferred)
 *   AMAZON_SP_CLIENT_ID       — LWA Client ID (legacy fallback)
 *   AMAZON_SPAPI_CLIENT_SECRET / AMAZON_SP_CLIENT_SECRET
 *   AMAZON_SPAPI_REFRESH_TOKEN / AMAZON_SP_REFRESH_TOKEN
 */
async function getLWAAccessToken(): Promise<string | null> {
    const clientId = Deno.env.get("AMAZON_SPAPI_CLIENT_ID") || Deno.env.get("AMAZON_SP_CLIENT_ID");
    const clientSecret = Deno.env.get("AMAZON_SPAPI_CLIENT_SECRET") || Deno.env.get("AMAZON_SP_CLIENT_SECRET");
    const refreshToken = Deno.env.get("AMAZON_SPAPI_REFRESH_TOKEN") || Deno.env.get("AMAZON_SP_REFRESH_TOKEN");

    if (!clientId || !clientSecret || !refreshToken) {
        console.error("SP-API credentials not set. Ensure AMAZON_SPAPI_CLIENT_ID, AMAZON_SPAPI_CLIENT_SECRET, and AMAZON_SPAPI_REFRESH_TOKEN are configured in Supabase secrets.");
        return null;
    }

    const response = await fetch("https://api.amazon.com/auth/o2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
        }),
    });

    if (!response.ok) {
        console.error("LWA token exchange failed:", response.status, await response.text());
        return null;
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Verify an Amazon Order ID exists via SP-API Orders endpoint.
 * Returns the order object if found, null otherwise.
 */
async function verifyOrderViaSPAPI(orderId: string, isMCF: boolean): Promise<{ verified: boolean; orderStatus?: string; error?: string }> {
    const accessToken = await getLWAAccessToken();
    if (!accessToken) {
        return { verified: false, error: "Amazon verification is currently unavailable. Please contact support." };
    }

    const marketplace = Deno.env.get("AMAZON_MARKETPLACE_ID") || "ATVPDKIKX0DER"; // US marketplace default
    const endpoint = isMCF
      ? `https://sellingpartnerapi-na.amazon.com/fba/outbound/2020-07-01/fulfillmentOrders/${orderId}`
      : `https://sellingpartnerapi-na.amazon.com/orders/v0/orders/${orderId}`;

    try {
        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                "x-amz-access-token": accessToken,
                "Content-Type": "application/json",
            },
        });

        if (response.status === 404) {
            return { verified: false, error: "Order not found in Amazon system. Please double-check your Order ID." };
        }

        if (!response.ok) {
            const errText = await response.text();
            console.error("SP-API order lookup failed:", response.status, errText);
            return { verified: false, error: "Could not verify this order with Amazon at this time. Amazon said: " + errText };
        }

        const data = await response.json();
        const order = data.payload;

        if (!order || Object.keys(order).length === 0) {
            return { verified: false, error: "Order not found." };
        }

        const actualStatus = isMCF ? order.fulfillmentOrderStatus : order.OrderStatus;

        if (!actualStatus) {
            return { verified: false, error: "Order not found." };
        }

        const validStatuses = isMCF 
            ? ["Received", "Planning", "Processing", "Complete", "CompletePartialled", "Validating", "Invalid"] // MCF statuses
            : ["Shipped", "Unshipped", "PartiallyShipped", "Pending"]; // Regular AMZ statuses
            
        if (!validStatuses.includes(actualStatus)) {
            if (actualStatus === "Cancelled" || actualStatus === "Unfulfillable") {
                return {
                    verified: false,
                    error: `Order is cancelled or invalid. Please provide an active order.`,
                };
            }
            return {
                verified: false,
                error: `Order status is not recognized for approval (${actualStatus}). Please double-check your Order ID.`,
            };
        }

        return { verified: true, orderStatus: actualStatus };
    } catch (err) {
        console.error("SP-API verification error:", err);
        return { verified: false, error: "Network error occurred while contacting Amazon." };
    }
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { orderId, email, mode, isBeta } = await req.json();


        // ─── "Check Email" mode: verify this is a returning customer ───
        if (mode === "check-email") {
            if (!email) {
                return new Response(
                    JSON.stringify({ error: "Email is required." }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            // Look up the user by email in public.profiles first
            let { data: profile } = await supabase
                .from("profiles")
                .select("id, has_access, subscription_status, access_expires_at")
                .eq("email", email.trim().toLowerCase())
                .maybeSingle();

            let matchedUser = profile ? { id: profile.id } : null;

            if (!matchedUser) {
                // Fallback scan if they exist in GoTrue auth.users but profiles triggers didn't sync yet
                const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
                const foundUser = usersData?.users?.find(
                    (u: any) => u.email?.toLowerCase() === email.trim().toLowerCase()
                );
                if (foundUser) {
                    matchedUser = { id: foundUser.id };
                }
            }

            if (!matchedUser) {
                return new Response(
                    JSON.stringify({
                        verified: false,
                        error: "No account found with this email. Please use the 'New User' tab to verify your purchase first.",
                    }),
                    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Get profile details (fetched from auth fallback if profile is null)
            if (!profile) {
                const { data: fetchProfile } = await supabase
                    .from("profiles")
                    .select("id, has_access, subscription_status, access_expires_at")
                    .eq("id", matchedUser.id)
                    .maybeSingle();
                profile = fetchProfile || { id: matchedUser.id, has_access: false, subscription_status: "none", access_expires_at: null };
            }

            // Check if user has active companion app access
            let hasActiveAccess = false;
            if (profile?.has_access) {
                if (profile.access_expires_at && profile.subscription_status !== "active") {
                    const expiresAt = new Date(profile.access_expires_at);
                    if (expiresAt >= new Date()) {
                        hasActiveAccess = true;
                    }
                } else {
                    hasActiveAccess = true;
                }
            }

            // Fallback: Check if they have an active course enrollment
            if (!hasActiveAccess) {
                const { data: enrollment } = await supabase
                    .from("course_enrollments")
                    .select("id")
                    .eq("user_id", matchedUser.id)
                    .maybeSingle();
                
                if (enrollment) {
                    hasActiveAccess = true;
                }
            }

            if (!hasActiveAccess) {
                return new Response(
                    JSON.stringify({
                        verified: false,
                        error: "This account doesn't have active access. Please verify your purchase using the 'New User' tab.",
                    }),
                    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({ verified: true, email: email.trim().toLowerCase() }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ─── Standard order verification flow ───
        if (!orderId || !email) {
            return new Response(
                JSON.stringify({ error: "Order ID and email are required." }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(
                JSON.stringify({ error: "Please enter a valid email address." }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const cleanOrderId = orderId.trim();
        const promoCodes = ["SERVANT2026", "SSBETA2026", "COVENANT2026"];
        const isPromoCode = promoCodes.includes(cleanOrderId.toUpperCase());
        const isCourseBeta = cleanOrderId.toUpperCase() === "COVENANT2026";
        const finalOrderId = isPromoCode ? `PROMO-${cleanOrderId.toUpperCase()}` : cleanOrderId;

        const isInternalOrder = cleanOrderId.startsWith("SS-");
        const isMCFOrder = cleanOrderId.startsWith("CONSUMER-");

        // Connect to Supabase
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let verificationMethod = "format-only";

        if (isPromoCode) {
            verificationMethod = "promo-code";
        } else {
            if (!isInternalOrder && !isMCFOrder && !AMAZON_ORDER_PATTERN.test(cleanOrderId)) {
                return new Response(
                    JSON.stringify({
                        error: isBeta 
                            ? "Invalid Beta Access Code. Please double-check your code and try again." 
                            : "Invalid Order ID format. Order IDs look like: 123-4567890-1234567 (Amazon standard), CONSUMER-... (MCF), or SS-... (Website)",
                        hint: isBeta
                            ? "Enter the custom access code provided for the beta cohort."
                            : "You can find your Order ID in your order confirmation email."
                    }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Explicitly block standard test/dummy Order IDs from being used in production
            // Amazon treats ANY order starting with '123-' as a sandbox ID and returns dummy 200 OK payloads!
            if (cleanOrderId.startsWith("123-") || cleanOrderId.startsWith("CONSUMER-[TEST]")) {
                return new Response(
                    JSON.stringify({
                        error: "Test order IDs cannot be used to unlock access.",
                        hint: "Please use your real Amazon Order ID found in your confirmation email."
                    }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            if (isInternalOrder) {
                // Verify internal order via database
                const { data: order } = await supabase
                    .from("orders")
                    .select("id, status")
                    .eq("order_number", cleanOrderId)
                    .maybeSingle();

                if (!order || (order.status !== "paid" && order.status !== "processing" && order.status !== "shipped" && order.status !== "delivered")) {
                    return new Response(
                        JSON.stringify({
                            error: "Order not found or payment not completed.",
                            hint: "Please double-check your Order ID. If this issue persists, contact support."
                        }),
                        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }
                verificationMethod = "website-order";
            } else {
                // ---- SP-API Real-Time Verification ----
                const spVerification = await verifyOrderViaSPAPI(cleanOrderId, isMCFOrder);
                if (!spVerification.verified) {
                    return new Response(
                        JSON.stringify({
                            error: spVerification.error || "Could not verify this Amazon Order ID.",
                            hint: "Please double-check your Order ID. If this issue persists, contact support."
                        }),
                        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }
                if (spVerification.orderStatus) {
                    verificationMethod = "sp-api";
                }
            }
        }

        // Check if this Order ID has already been redeemed
        // If it's a promo code, check if THIS specific email has redeemed it.
        // Otherwise, check if ANYONE has redeemed it.
        let requestQuery = supabase
            .from("access_requests")
            .select("*")
            .eq("order_id", finalOrderId);

        if (isPromoCode) {
            requestQuery = requestQuery.eq("email", email.toLowerCase());
        }

        const { data: existingRequest } = await requestQuery.maybeSingle();

        if (existingRequest) {
            // Same email checking back - return existing access
            if (existingRequest.email === email.toLowerCase() && existingRequest.status === "approved") {
                return new Response(
                    JSON.stringify({
                        success: true,
                        message: "Your access is still active!",
                        accessExpiresAt: existingRequest.access_expires_at,
                        email: existingRequest.email,
                    }),
                    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Order ID already used
            if (existingRequest.redemption_count >= (existingRequest.max_redemptions || 1)) {
                return new Response(
                    JSON.stringify({
                        error: "This Order ID has already been redeemed.",
                        hint: "Each order can only be used once. If you believe this is an error, please contact support."
                    }),
                    { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        // Calculate access window
        const now = new Date();
        const trialDays = isPromoCode ? 90 : 30;
        const expiresAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000); // 30 or 90 days

        if (existingRequest) {
            // Update existing request (same order, different verification attempt)
            await supabase
                .from("access_requests")
                .update({
                    email: email.toLowerCase(),
                    status: "approved",
                    activated_at: now.toISOString(),
                    access_expires_at: expiresAt.toISOString(),
                    redemption_count: (existingRequest.redemption_count || 0) + 1,
                    verification_method: verificationMethod,
                })
                .eq("id", existingRequest.id);
        } else {
            // Create new access request
            await supabase
                .from("access_requests")
                .insert({
                    email: email.toLowerCase(),
                    order_id: finalOrderId,
                    status: "approved",
                    activated_at: now.toISOString(),
                    access_expires_at: expiresAt.toISOString(),
                    redemption_count: 1,
                    verification_method: verificationMethod,
                });
        }

        // Create or find user account
        // 1. Try to find the existing user ID from public.profiles first
        const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email.toLowerCase())
            .maybeSingle();

        let userId = existingProfile?.id || null;
        let existingUser = existingProfile ? { id: existingProfile.id } : null;

        if (!userId) {
            // 2. If profile doesn't exist, try creating a new user
            const tempPassword = `servant-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
                email: email.toLowerCase(),
                password: tempPassword,
                email_confirm: true,
            });

            if (!signUpError && newUser?.user) {
                userId = newUser.user.id;
            } else {
                // 3. Fallback scan if they exist in GoTrue auth.users but profiles triggers didn't sync yet
                console.warn("User creation failed, scanning list users fallback:", signUpError?.message);
                const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
                const matched = userList?.users?.find(
                    (u: any) => u.email?.toLowerCase() === email.toLowerCase()
                );
                if (matched) {
                    userId = matched.id;
                    existingUser = { id: matched.id };
                }
            }
        }

        // Update profile with access
        if (userId) {
            const profileUpdate: any = {
                id: userId,
                email: email.toLowerCase(),
            };
            // Both course and app promo/trial activations grant companion app access
            profileUpdate.has_access = true;
            profileUpdate.access_granted_at = now.toISOString();
            profileUpdate.access_expires_at = expiresAt.toISOString();
            profileUpdate.subscription_status = "trial";
            await supabase
                .from("profiles")
                .upsert(profileUpdate);
        }

        // If it's the course beta, enroll user in Courage Covenant
        if (isCourseBeta && userId) {
            const { data: courseData } = await supabase
                .from("courses")
                .select("id")
                .eq("slug", "courage-covenant")
                .maybeSingle();

            if (courseData?.id) {
                const { error: enrollError } = await supabase
                    .from("course_enrollments")
                    .upsert({
                        user_id: userId,
                        course_id: courseData.id,
                        stripe_session_id: `PROMO-${cleanOrderId.toUpperCase()}`,
                        stripe_payment_intent_id: null,
                        amount_paid_cents: 0,
                        track: "parent",
                        enrolled_at: now.toISOString(),
                    }, { onConflict: "user_id,course_id", ignoreDuplicates: true });

                if (enrollError) {
                    console.error("Failed to enroll promo user in course:", enrollError);
                } else {
                    console.log(`Enrolled promo user ${userId} in course ${courseData.id}`);
                }
            } else {
                console.error("Could not find course with slug 'courage-covenant' in database.");
            }
        }

        // Generate a magic link for passwordless login
        const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: email.toLowerCase(),
        });

        // ── Admin redemption notification ─────────────────────────────────────
        try {
            const resendKey = Deno.env.get("RESEND_API_KEY");
            if (resendKey && !email.toLowerCase().endsWith("@test.com")) {
                const resend = new Resend(resendKey);
                const isNewUser = !existingUser;
                const verifyLabel = verificationMethod === "sp-api" 
                    ? "✅ SP-API Verified" 
                    : verificationMethod === "promo-code"
                    ? "✨ Promo Code Activated"
                    : "⚠️ Format-Only (unverified)";
                const verifyColor = verificationMethod === "sp-api" 
                    ? "#16a34a" 
                    : verificationMethod === "promo-code"
                    ? "#7c3aed"
                    : "#d97706";
                const expiryStr = expiresAt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                const html = `
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fafaf9;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                  <div style="background:${verificationMethod === "promo-code" ? "#5b21b6" : "#14532d"};padding:18px 24px;">
                    <p style="margin:0;color:${verificationMethod === "promo-code" ? "#ddd6fe" : "#bbf7d0"};font-size:11px;letter-spacing:1px;text-transform:uppercase;">Serenity Scrolls · Admin Notification</p>
                    <h2 style="margin:4px 0 0;color:#fff;font-size:20px;">🎉 New Redemption</h2>
                  </div>
                  <div style="padding:24px;">
                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                      <tr><td style="padding:8px 0;color:#6b7280;width:160px;">Customer Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:${verificationMethod === "promo-code" ? "#7c3aed" : "#14532d"};font-weight:600;">${email}</a></td></tr>
                      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">Order ID</td><td style="padding:8px 0;font-family:monospace;color:#111827;font-weight:600;">${finalOrderId}</td></tr>
                      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">Verification</td><td style="padding:8px 0;font-weight:700;color:${verifyColor};">${verifyLabel}</td></tr>
                      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">User Status</td><td style="padding:8px 0;color:#111827;">${isNewUser ? "🆕 New account created" : "🔄 Existing user — access renewed"}</td></tr>
                      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">Trial Expires</td><td style="padding:8px 0;color:#111827;">${expiryStr}</td></tr>
                      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">Trial Length</td><td style="padding:8px 0;color:${verifyColor};font-weight:700;">${trialDays} days</td></tr>
                      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">Redeemed At</td><td style="padding:8px 0;color:#6b7280;font-size:13px;">${now.toUTCString()}</td></tr>
                    </table>
                  </div>
                  <div style="background:${verificationMethod === "promo-code" ? "#f5f3ff" : "#f0fdf4"};border-top:1px solid ${verificationMethod === "promo-code" ? "#ddd6fe" : "#bbf7d0"};padding:12px 24px;">
                    <p style="margin:0;font-size:12px;color:${verifyColor};">✓ ${verificationMethod === "promo-code" ? "Promo trial access activated · 90-day window" : "Trial access activated · 30-day window"} started</p>
                  </div>
                </div>`;

                const text = `
Serenity Scrolls · Admin Notification

🎉 New Redemption Received
Customer Email: ${email}
Order ID: ${finalOrderId}
Verification: ${verifyLabel}
User Status: ${isNewUser ? "New account created" : "Existing user — access renewed"}
Trial Expires: ${expiryStr}
Trial Length: ${trialDays} days
Redeemed At: ${now.toUTCString()}
                `.trim();

                const emailResponse = await resend.emails.send({
                    from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
                    to: ["teamsienvi@gmail.com", "sienvirodneygray@gmail.com", "mccmetro@comcast.net"],
                    reply_to: "teamsienvi@gmail.com",
                    subject: `🎉 [NEW REDEEM] ${email} · ${
                        verificationMethod === "sp-api" 
                            ? "SP-API ✅" 
                            : verificationMethod === "promo-code"
                            ? "Promo Code ✨"
                            : "Format-Only ⚠️"
                    }`,
                    html,
                    text,
                });
                if (emailResponse.error) {
                    console.error("Admin notification email failed to send. Error:", emailResponse.error);
                } else {
                    console.log("Admin notification email sent successfully:", emailResponse.data);
                }

                // ── Send Welcome Email to the User ──────────────────────────────────
                const isPromo = verificationMethod === "promo-code";
                const isCourseBeta = cleanOrderId.toUpperCase() === "COVENANT2026";
                const welcomeSubject = isCourseBeta
                    ? "Welcome to Courage Covenant™ Course Beta! 🎓"
                    : isPromo 
                    ? "Your Serenity Scrolls Beta Access is Active! 🌿" 
                    : "Your Serenity Scrolls Access is Active! 🎉";
                const welcomeHeadline = isCourseBeta
                    ? "Welcome to the Courage Covenant™ Course! 🎓"
                    : isPromo
                    ? "Welcome to Serenity Scrolls Servant! 🌿"
                    : "Your Access Has Been Activated! 🎉";
                const welcomeIntro = isCourseBeta
                    ? "Thank you for joining our exclusive beta course program! Your access to the Courage Covenant™ Course is now fully active."
                    : isPromo
                    ? "Thank you for joining our exclusive beta program! Your access to the AI Scripture Companion is now fully active."
                    : "Thank you for your purchase! Your access to the AI Scripture Companion has been verified and is now fully active.";
                const accessPeriodLabel = isCourseBeta
                    ? "🗓️ Access Period: Full Course Beta"
                    : isPromo
                    ? `🗓️ Access Period: ${trialDays} Days (Beta Trial)`
                    : `🗓️ Access Period: ${trialDays} Days`;
                const welcomeClosing = isCourseBeta
                    ? "We are excited to have you shape the future of the Courage Covenant course. If you have any feedback or encounter issues, please reply directly to this email."
                    : isPromo
                    ? "We are excited to have you shape the future of Serenity Scrolls. If you have any feedback or encounter issues, please reply directly to this email."
                    : "We are excited to walk alongside you. If you have any feedback or encounter issues, please reply directly to this email.";

                const accessLink = isCourseBeta
                    ? "https://serenityscrolls.faith/learn/courage-covenant"
                    : "https://serenityscrolls.faith/servant";
                const accessButtonText = isCourseBeta
                    ? "Go to the Course"
                    : "Go to Scripture Companion";

                const userHtml = `
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                  <div style="background:#4f46e5;padding:24px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${welcomeHeadline}</h1>
                  </div>
                  <div style="padding:24px;color:#374151;font-size:15px;line-height:1.6;">
                    <p>Hello,</p>
                    <p>${welcomeIntro}</p>
                    
                    <div style="text-align:center;margin:24px 0;">
                      <a href="${accessLink}" style="background-color:#4f46e5;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                        ${accessButtonText}
                      </a>
                    </div>
                    
                    <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #4f46e5;">
                      <p style="margin:0;font-weight:600;color:#111827;">${accessPeriodLabel}</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Your trial is set to run through ${expiryStr}.</p>
                    </div>

                    <h3 style="color:#111827;font-size:16px;margin-top:24px;margin-bottom:8px;">🔑 How to Log Back In Later</h3>
                    <p>If you ever get logged out or want to access the app on another device:</p>
                    <ol style="margin:0;padding-left:20px;">
                      <li style="margin-bottom:8px;">Visit <a href="https://serenityscrolls.faith/unlock" style="color:#4f46e5;font-weight:600;text-decoration:underline;">serenityscrolls.faith/unlock</a></li>
                      <li style="margin-bottom:8px;">Select the <strong>"Welcome Back"</strong> tab.</li>
                      <li style="margin-bottom:8px;">Enter your email address (<strong>${email}</strong>) and click <strong>"Send Login Link"</strong>.</li>
                      <li style="margin-bottom:0;">Click the secure login link sent to your inbox to log in instantly.</li>
                    </ol>

                    <p style="margin-top:24px;">${welcomeClosing}</p>
                    
                    <p style="margin-top:24px;margin-bottom:0;">Warmly,<br><strong>The Serenity Scrolls Team</strong></p>
                  </div>
                </div>`;

                const userText = `
${welcomeHeadline}

${welcomeIntro}

👉 Access Link: ${accessLink}

${accessPeriodLabel}
Your trial is set to run through ${expiryStr}.

🔑 How to Log Back In Later
If you ever get logged out or want to access the app on another device:
1. Visit: https://serenityscrolls.faith/unlock
2. Select the "Welcome Back" tab.
3. Enter your email address (${email}) and click "Send Login Link".
4. Click the secure login link sent to your inbox to log in instantly.

${welcomeClosing}

Warmly,
The Serenity Scrolls Team
                `.trim();

                const userEmailResponse = await resend.emails.send({
                    from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
                    to: [email],
                    reply_to: "teamsienvi@gmail.com",
                    subject: welcomeSubject,
                    html: userHtml,
                    text: userText,
                });
                if (userEmailResponse.error) {
                    console.error("Welcome email failed to send. Error:", userEmailResponse.error);
                } else {
                    console.log("Welcome email sent to user successfully:", userEmailResponse.data);
                }
            }
        } catch (notifyErr) {
            // Non-fatal — log but don't block the response
            console.error("Admin notify error:", notifyErr);
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Access granted! Your ${trialDays}-day free trial has started.`,
                accessExpiresAt: expiresAt.toISOString(),
                daysRemaining: trialDays,
                email: email.toLowerCase(),
                verificationMethod: verificationMethod,
                // Include magic link token for auto-login
                token: magicLinkData?.properties?.hashed_token || null,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Verify order error:", error);
        return new Response(
            JSON.stringify({ error: "Something went wrong. Please try again." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
