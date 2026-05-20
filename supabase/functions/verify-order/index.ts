import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
        const { orderId, email, mode } = await req.json();

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

            // Look up the user by email in auth.users
            const { data: users } = await supabase.auth.admin.listUsers();
            const matchedUser = users?.users?.find(
                (u: any) => u.email?.toLowerCase() === email.trim().toLowerCase()
            );

            if (!matchedUser) {
                return new Response(
                    JSON.stringify({
                        verified: false,
                        error: "No account found with this email. Please use the 'New User' tab to verify your purchase first.",
                    }),
                    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Check if this user actually has access
            const { data: profile } = await supabase
                .from("profiles")
                .select("has_access, subscription_status, access_expires_at")
                .eq("id", matchedUser.id)
                .single();

            if (!profile?.has_access) {
                return new Response(
                    JSON.stringify({
                        verified: false,
                        error: "This account doesn't have active access. Please verify your purchase using the 'New User' tab.",
                    }),
                    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Check if access is expired
            if (profile.access_expires_at && profile.subscription_status !== "active") {
                const expiresAt = new Date(profile.access_expires_at);
                if (expiresAt < new Date()) {
                    return new Response(
                        JSON.stringify({
                            verified: false,
                            error: "Your access has expired. Please renew your subscription or make a new purchase.",
                        }),
                        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }
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
        const isInternalOrder = cleanOrderId.startsWith("SS-");
        const isMCFOrder = cleanOrderId.startsWith("CONSUMER-");

        if (!isInternalOrder && !isMCFOrder && !AMAZON_ORDER_PATTERN.test(cleanOrderId)) {
            return new Response(
                JSON.stringify({
                    error: "Invalid Order ID format. Order IDs look like: 123-4567890-1234567 (Amazon standard), CONSUMER-... (MCF), or SS-... (Website)",
                    hint: "You can find your Order ID in your order confirmation email."
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

        // Connect to Supabase
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let verificationMethod = "format-only";

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

        // Check if this Order ID has already been redeemed
        const { data: existingRequest } = await supabase
            .from("access_requests")
            .select("*")
            .eq("order_id", cleanOrderId)
            .maybeSingle();

        if (existingRequest) {
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
        }

        // Calculate access window
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

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
                    order_id: cleanOrderId,
                    status: "approved",
                    activated_at: now.toISOString(),
                    access_expires_at: expiresAt.toISOString(),
                    redemption_count: 1,
                    verification_method: verificationMethod,
                });
        }

        // Create or find user account
        // Check if user exists by email
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        let userId = null;

        const existingUser = existingUsers?.users?.find(
            (u: any) => u.email === email.toLowerCase()
        );

        if (existingUser) {
            userId = existingUser.id;
        } else {
            // Create new user
            const tempPassword = `servant-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
                email: email.toLowerCase(),
                password: tempPassword,
                email_confirm: true,
            });

            if (signUpError) {
                console.error("Error creating user:", signUpError);
            } else {
                userId = newUser.user?.id;
            }
        }

        // Update profile with access
        if (userId) {
            await supabase
                .from("profiles")
                .upsert({
                    id: userId,
                    email: email.toLowerCase(),
                    has_access: true,
                    access_granted_at: now.toISOString(),
                    access_expires_at: expiresAt.toISOString(),
                    subscription_status: "trial",
                });
        }

        // Generate a magic link for passwordless login
        const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: email.toLowerCase(),
        });

        // ── Admin redemption notification ─────────────────────────────────────
        try {
            const resendKey = Deno.env.get("RESEND_API_KEY");
            const siteUrl = Deno.env.get("SITE_URL") || "https://serenityscrolls.faith";
            if (resendKey) {
                const isNewUser = !existingUser;
                const verifyLabel = verificationMethod === "sp-api" ? "✅ SP-API Verified" : "⚠️ Format-Only (unverified)";
                const expiryStr = expiresAt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                const html = `
                <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fafaf9;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
                  <div style="background:#14532d;padding:18px 24px;">
                    <p style="margin:0;color:#bbf7d0;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Serenity Scrolls · Admin Notification</p>
                    <h2 style="margin:4px 0 0;color:#fff;font-size:20px;">🎉 New Redemption</h2>
                  </div>
                  <div style="padding:24px;">
                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                      <tr><td style="padding:8px 0;color:#6b7280;width:160px;">Customer Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#14532d;font-weight:600;">${email}</a></td></tr>
                      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">Order ID</td><td style="padding:8px 0;font-family:monospace;color:#111827;font-weight:600;">${cleanOrderId}</td></tr>
                      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">Verification</td><td style="padding:8px 0;font-weight:700;color:${verificationMethod === "sp-api" ? "#16a34a" : "#d97706"};">${verifyLabel}</td></tr>
                      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">User Status</td><td style="padding:8px 0;color:#111827;">${isNewUser ? "🆕 New account created" : "🔄 Existing user — access renewed"}</td></tr>
                      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">Trial Expires</td><td style="padding:8px 0;color:#111827;">${expiryStr}</td></tr>
                      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">Trial Length</td><td style="padding:8px 0;color:#16a34a;font-weight:700;">30 days</td></tr>
                      <tr style="border-top:1px solid #f3f4f6;"><td style="padding:8px 0;color:#6b7280;">Redeemed At</td><td style="padding:8px 0;color:#6b7280;font-size:13px;">${now.toUTCString()}</td></tr>
                    </table>
                  </div>
                  <div style="background:#f0fdf4;border-top:1px solid #bbf7d0;padding:12px 24px;">
                    <p style="margin:0;font-size:12px;color:#16a34a;">✓ Trial access activated · 30-day window started</p>
                  </div>
                </div>`;

                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
                        to: ["teamsienvi@gmail.com", "sienvirodneygray@gmail.com"],
                        subject: `🎉 [NEW REDEEM] ${email} · ${verificationMethod === "sp-api" ? "SP-API ✅" : "Format-Only ⚠️"}`,
                        html,
                    }),
                });
            }
        } catch (notifyErr) {
            // Non-fatal — log but don't block the response
            console.error("Admin notify error:", notifyErr);
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "Access granted! Your 30-day free trial has started.",
                accessExpiresAt: expiresAt.toISOString(),
                daysRemaining: 30,
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
