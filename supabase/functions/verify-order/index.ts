import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Amazon Order ID format: XXX-XXXXXXX-XXXXXXX
const AMAZON_ORDER_PATTERN = /^\d{3}-\d{7}-\d{7}$/;

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

        // Validate Amazon Order ID format
        const cleanOrderId = orderId.trim();
        if (!AMAZON_ORDER_PATTERN.test(cleanOrderId)) {
            return new Response(
                JSON.stringify({
                    error: "Invalid Order ID format. Amazon Order IDs look like: 123-4567890-1234567",
                    hint: "You can find your Order ID in your Amazon order confirmation email."
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Connect to Supabase
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
                });
        }

        // Create or find user account
        // Check if user exists by email
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        let userId = null;

        const existingUser = existingUsers?.users?.find(
            (u) => u.email === email.toLowerCase()
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
