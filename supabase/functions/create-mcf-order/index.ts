import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Amazon MCF (Multi-Channel Fulfillment) Edge Function
 *
 * Creates fulfillment orders through Amazon's SP-API so that
 * website orders are shipped via FBA inventory.
 *
 * Required Supabase secrets:
 *   AMAZON_SP_CLIENT_ID
 *   AMAZON_SP_CLIENT_SECRET
 *   AMAZON_SP_REFRESH_TOKEN
 *   AMAZON_SELLER_ID          — Your Amazon Seller/Merchant ID
 *   AMAZON_MARKETPLACE_ID     — Default: ATVPDKIKX0DER (US)
 *
 * Required per-order data (passed in request body):
 *   orderId       — Internal order ID from the `orders` table
 *   sellerSku     — Amazon Seller SKU (e.g., "PI-8N6M-AB86")
 *   quantity      — Number of items
 *   shippingSpeed — "Standard" | "Expedited" | "Priority"
 *   address       — { name, line1, line2?, city, stateOrRegion, postalCode, countryCode }
 */

interface ShippingAddress {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    stateOrRegion: string;
    postalCode: string;
    countryCode: string;
}

interface MCFRequest {
    orderId: string;
    sellerSku: string;
    quantity: number;
    shippingSpeed?: "Standard" | "Expedited" | "Priority";
    address: ShippingAddress;
}

/**
 * Exchange LWA refresh token for an access token.
 */
async function getLWAAccessToken(): Promise<string> {
    const clientId = Deno.env.get("AMAZON_SP_CLIENT_ID");
    const clientSecret = Deno.env.get("AMAZON_SP_CLIENT_SECRET");
    const refreshToken = Deno.env.get("AMAZON_SP_REFRESH_TOKEN");

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error(
            "Amazon SP-API credentials not configured. " +
            "Set AMAZON_SP_CLIENT_ID, AMAZON_SP_CLIENT_SECRET, and AMAZON_SP_REFRESH_TOKEN in Supabase secrets."
        );
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
        const errText = await response.text();
        throw new Error(`LWA token exchange failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Create an MCF fulfillment order via SP-API.
 */
async function createMCFFulfillmentOrder(
    accessToken: string,
    order: MCFRequest
): Promise<{ success: boolean; fulfillmentOrderId?: string; error?: string }> {
    const sellerId = Deno.env.get("AMAZON_SELLER_ID");
    if (!sellerId) {
        throw new Error("AMAZON_SELLER_ID not configured in Supabase secrets.");
    }

    const fulfillmentOrderId = `SS-MCF-${order.orderId}-${Date.now()}`;

    const payload = {
        sellerFulfillmentOrderId: fulfillmentOrderId,
        displayableOrderId: `SS-${order.orderId.slice(-8)}`,
        displayableOrderDate: new Date().toISOString(),
        displayableOrderComment: "Thank you for your Serenity Scrolls order!",
        shippingSpeedCategory: order.shippingSpeed || "Standard",
        destinationAddress: {
            name: order.address.name,
            addressLine1: order.address.line1,
            addressLine2: order.address.line2 || "",
            city: order.address.city,
            stateOrRegion: order.address.stateOrRegion,
            postalCode: order.address.postalCode,
            countryCode: order.address.countryCode || "US",
        },
        items: [
            {
                sellerSku: order.sellerSku,
                sellerFulfillmentOrderItemId: `${fulfillmentOrderId}-item-1`,
                quantity: order.quantity,
            },
        ],
    };

    const endpoint = "https://sellingpartnerapi-na.amazon.com/fba/outbound/2020-07-01/fulfillmentOrders";

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "x-amz-access-token": accessToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("MCF order creation failed:", response.status, errText);
        return {
            success: false,
            error: `Amazon MCF API returned ${response.status}: ${errText}`,
        };
    }

    return { success: true, fulfillmentOrderId };
}

/**
 * Check the status of an existing MCF fulfillment order.
 */
async function getMCFOrderStatus(
    accessToken: string,
    fulfillmentOrderId: string
): Promise<any> {
    const endpoint = `https://sellingpartnerapi-na.amazon.com/fba/outbound/2020-07-01/fulfillmentOrders/${fulfillmentOrderId}`;

    const response = await fetch(endpoint, {
        method: "GET",
        headers: {
            "x-amz-access-token": accessToken,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`MCF status check failed (${response.status}): ${errText}`);
    }

    return await response.json();
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const action = body.action || "create"; // "create" or "status"

        // Connect to Supabase
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get Amazon access token
        const accessToken = await getLWAAccessToken();

        if (action === "status") {
            // ---- Check fulfillment status ----
            const { fulfillmentOrderId } = body;
            if (!fulfillmentOrderId) {
                return new Response(
                    JSON.stringify({ error: "fulfillmentOrderId is required for status check." }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const status = await getMCFOrderStatus(accessToken, fulfillmentOrderId);
            return new Response(
                JSON.stringify({ success: true, ...status }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ---- Create fulfillment order ----
        const { orderId, sellerSku, quantity, shippingSpeed, address } = body as MCFRequest;

        if (!orderId || !sellerSku || !quantity || !address) {
            return new Response(
                JSON.stringify({
                    error: "Missing required fields: orderId, sellerSku, quantity, address",
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!address.name || !address.line1 || !address.city || !address.stateOrRegion || !address.postalCode) {
            return new Response(
                JSON.stringify({
                    error: "Address must include: name, line1, city, stateOrRegion, postalCode",
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create MCF order via Amazon
        const result = await createMCFFulfillmentOrder(accessToken, {
            orderId,
            sellerSku,
            quantity,
            shippingSpeed,
            address,
        });

        if (!result.success) {
            // Update order in DB to mark MCF failure
            await supabase
                .from("orders")
                .update({
                    fulfillment_status: "mcf_failed",
                    fulfillment_error: result.error,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", orderId);

            return new Response(
                JSON.stringify({ error: result.error }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Update order in DB with MCF fulfillment ID
        await supabase
            .from("orders")
            .update({
                fulfillment_status: "mcf_submitted",
                mcf_fulfillment_order_id: result.fulfillmentOrderId,
                updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

        return new Response(
            JSON.stringify({
                success: true,
                fulfillmentOrderId: result.fulfillmentOrderId,
                message: "MCF fulfillment order created successfully.",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("MCF order error:", error);
        const message = error instanceof Error ? error.message : "Something went wrong.";
        return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
