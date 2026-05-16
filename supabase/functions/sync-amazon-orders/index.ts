import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Exchange LWA refresh token for a short-lived SP-API access token.
 * Matches the pattern used in sync-amazon-inventory.
 */
async function getLWAAccessToken(): Promise<string> {
    const clientId = Deno.env.get("AMAZON_SPAPI_CLIENT_ID") || Deno.env.get("AMAZON_SP_CLIENT_ID");
    const clientSecret = Deno.env.get("AMAZON_SPAPI_CLIENT_SECRET") || Deno.env.get("AMAZON_SP_CLIENT_SECRET");
    const refreshToken = Deno.env.get("AMAZON_SPAPI_REFRESH_TOKEN") || Deno.env.get("AMAZON_SP_REFRESH_TOKEN");

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error("Amazon SP-API credentials not configured (AMAZON_SPAPI_CLIENT_ID / SECRET / REFRESH_TOKEN).");
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

/**
 * Fetch paginated Amazon orders for a given date range.
 */
async function fetchOrders(accessToken: string, createdAfter: string, createdBefore: string): Promise<any[]> {
    const marketplaceId = "ATVPDKIKX0DER"; // US Marketplace
    const allOrders: any[] = [];
    let nextToken: string | null = null;

    do {
        const params = new URLSearchParams({
            MarketplaceIds: marketplaceId,
            CreatedAfter: createdAfter,
            CreatedBefore: createdBefore,
            OrderStatuses: "Shipped,Unshipped,PartiallyShipped",
        });
        if (nextToken) params.set("NextToken", nextToken);

        const url = `https://sellingpartnerapi-na.amazon.com/orders/v0/orders?${params.toString()}`;
        const res = await fetch(url, {
            method: "GET",
            headers: {
                "x-amz-access-token": accessToken,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Orders API error ${res.status}: ${errText}`);
        }

        const data = await res.json();
        const orders = data.payload?.Orders || [];
        allOrders.push(...orders);

        nextToken = data.payload?.NextToken || null;
    } while (nextToken);

    return allOrders;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

        // Auth check: allow service role (cron), anon key, or authenticated admin user
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
                status: 401, headers: corsHeaders
            });
        }

        const token = authHeader.replace("Bearer ", "");
        if (token !== supabaseServiceKey && token !== supabaseAnonKey) {
            const { createClient: createAuthClient } = await import("https://esm.sh/@supabase/supabase-js@2");
            const authClient = createAuthClient(supabaseUrl, supabaseAnonKey);
            const { data: userData, error: userError } = await authClient.auth.getUser(token);
            if (userError || !userData.user) {
                return new Response(JSON.stringify({ error: "Unauthorized: " + userError?.message }), {
                    status: 401, headers: corsHeaders
                });
            }
        }

        // Parse optional date override from request body
        let body: any = {};
        try { body = await req.json(); } catch { /* no body = defaults */ }

        const { days = 1, startDate: customStart, endDate: customEnd } = body;

        // Default: sync yesterday
        const now = new Date();
        const end = customEnd
            ? new Date(customEnd)
            : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const start = customStart
            ? new Date(customStart)
            : new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

        const createdAfter = start.toISOString();
        const createdBefore = end.toISOString();

        console.log(`Syncing Amazon orders from ${createdAfter} to ${createdBefore}`);

        const accessToken = await getLWAAccessToken();
        const orders = await fetchOrders(accessToken, createdAfter, createdBefore);

        console.log(`Retrieved ${orders.length} orders from Amazon`);

        // Group orders by date and aggregate metrics
        const byDate: Record<string, { orders: number; units: number; revenue: number }> = {};

        for (const order of orders) {
            const dateStr = (order.PurchaseDate || order.LastUpdateDate || "").substring(0, 10);
            if (!dateStr) continue;

            if (!byDate[dateStr]) {
                byDate[dateStr] = { orders: 0, units: 0, revenue: 0 };
            }
            byDate[dateStr].orders += 1;

            // Sum units from OrderItems if available, otherwise default to 1
            const items = order.OrderItems || [];
            for (const item of items) {
                byDate[dateStr].units += parseInt(item.QuantityOrdered || "1", 10);
                const amount = parseFloat(item.ItemPrice?.Amount || "0");
                byDate[dateStr].revenue += amount;
            }

            // Fallback: use order-level totals if no items
            if (items.length === 0) {
                const amount = parseFloat(order.OrderTotal?.Amount || "0");
                byDate[dateStr].revenue += amount;
                byDate[dateStr].units += 1;
            }
        }

        // Upsert into amazon_sales_metrics
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const rows = Object.entries(byDate).map(([date, metrics]) => ({
            date,
            total_orders: metrics.orders,
            total_units: metrics.units,
            total_revenue_usd: parseFloat(metrics.revenue.toFixed(2)),
            synced_at: new Date().toISOString(),
        }));

        if (rows.length > 0) {
            const { error: upsertError } = await supabase
                .from("amazon_sales_metrics")
                .upsert(rows, { onConflict: "date" });

            if (upsertError) {
                throw new Error(`DB upsert failed: ${upsertError.message}`);
            }
        }

        console.log(`Upserted ${rows.length} date rows into amazon_sales_metrics`);

        return new Response(
            JSON.stringify({
                success: true,
                message: `Synced ${orders.length} orders across ${rows.length} days.`,
                dateRange: { from: createdAfter, to: createdBefore },
                rows,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("sync-amazon-orders error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
