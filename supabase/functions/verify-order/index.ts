import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Amazon Order ID format: XXX-XXXXXXX-XXXXXXX
const AMAZON_ORDER_PATTERN = /^\d{3}-\d{7}-\d{7}$/;

/**
 * Exchange LWA (Login With Amazon) refresh token for an access token.
 * Used to authenticate SP-API requests.
 */
async function getLWAAccessToken(): Promise<string | null> {
    const clientId = Deno.env.get("AMAZON_SP_CLIENT_ID");
    const clientSecret = Deno.env.get("AMAZON_SP_CLIENT_SECRET");
    const refreshToken = Deno.env.get("AMAZON_SP_REFRESH_TOKEN");

    if (!clientId || !clientSecret || !refreshToken) {
        return null; // SP-API not configured — fall back to format-only
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
        console.error("LWA token exchange failed:", await response.text());
        return null;
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Verify an Amazon Order ID exists via SP-API Orders endpoint.
 * Returns the order object if found, null otherwise.
 */
async function verifyOrderViaSPAPI(orderId: string): Promise<{ verified: boolean; orderStatus?: string; error?: string }> {
    const accessToken = await getLWAAccessToken();
    if (!accessToken) {
        console.error("SP-API credentials not configured — blocking verification");
        return { verified: false, error: "System Error: Amazon verification is currently unavailable. Please contact support." };
    }

    const marketplace = Deno.env.get("AMAZON_MARKETPLACE_ID") || "ATVPDKIKX0DER"; // US marketplace default
    const endpoint = `https://sellingpartnerapi-na.amazon.com/orders/v0/orders/${orderId}`;

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
            return { verified: false, error: "Could not verify this order with Amazon at this time." };
        }

        const data = await response.json();
        const order = data.payload;

        if (!order) {
            return { verified: false, error: "Order not found." };
        }

        // Check the order status — only allow completed/shipped orders
        const validStatuses = ["Shipped", "Unshipped", "PartiallyShipped", "Pending"];
        if (!validStatuses.includes(order.OrderStatus)) {
            return {
                verified: false,
                error: `Order status is "${order.OrderStatus}". Only active orders qualify.`,
            };
        }

        return { verified: true, orderStatus: order.OrderStatus };
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
        const { orderId, email } = await req.json();

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
            const spVerification = await verifyOrderViaSPAPI(cleanOrderId);
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
