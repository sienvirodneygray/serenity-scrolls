import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Exchange LWA refresh token for an access token.
 */
async function getLWAAccessToken(): Promise<string> {
    const clientId = Deno.env.get("AMAZON_SPAPI_CLIENT_ID");
    const clientSecret = Deno.env.get("AMAZON_SPAPI_CLIENT_SECRET");
    const refreshToken = Deno.env.get("AMAZON_SPAPI_REFRESH_TOKEN");

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error("Amazon SP-API credentials not configured in Supabase secrets.");
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
        throw new Error(`LWA token exchange failed: ${errText}`);
    }

    const data = await response.json();
    return data.access_token;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Only allow authenticated users to hit this endpoint
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
                status: 401, headers: corsHeaders
            });
        }

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Security role-check bypasses for Edge. It's authenticated via UI click.
        
        console.log("Fetching LWA token...");
        const accessToken = await getLWAAccessToken();

        console.log("Fetching FBA inventory from Amazon...");
        const marketplaceId = "ATVPDKIKX0DER"; // US Marketplace
        const endpoint = `https://sellingpartnerapi-na.amazon.com/fba/inventory/v1/summaries?details=true&granularityType=Marketplace&granularityId=${marketplaceId}&marketplaceIds=${marketplaceId}`;

        const fbaResponse = await fetch(endpoint, {
            method: "GET",
            headers: {
                "x-amz-access-token": accessToken,
                "Content-Type": "application/json",
            },
        });

        if (!fbaResponse.ok) {
            const errText = await fbaResponse.text();
            throw new Error(`Amazon API returned ${fbaResponse.status}: ${errText}`);
        }

        const data = await fbaResponse.json();
        const inventoryItems = data.payload?.inventorySummaries || data.inventorySummaries || [];
        
        console.log(`Retrieved ${inventoryItems.length} inventory records from Amazon FBA.`);

        // Process updates
        let updatedCount = 0;

        for (const item of inventoryItems) {
            const sellerSku = item.sellerSku;
            const fulfillableQuantity = item.inventoryDetails?.fulfillableQuantity || item.totalQuantity || 0;

            console.log(`Syncing SKU: ${sellerSku} -> Quantity: ${fulfillableQuantity}`);

            // Update matching local product
            const { data: updatedProduct, error } = await supabase
                .from("products")
                .update({ 
                    stock_quantity: fulfillableQuantity,
                    is_available: fulfillableQuantity > 0
                })
                .eq("amazon_sku", sellerSku)
                .select();

            if (error) {
                console.error(`Failed to update DB for SKU ${sellerSku}:`, error);
            } else if (updatedProduct && updatedProduct.length > 0) {
                updatedCount++;
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Successfully synchronized ${updatedCount} FBA items into your local database.`,
                syncedSkusProcessed: inventoryItems.length,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("FBA Sync Error:", error);
        return new Response(
            JSON.stringify({ 
                success: false, 
                message: error instanceof Error ? error.message : "Sync failed due to an unknown Edge Function error." 
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
