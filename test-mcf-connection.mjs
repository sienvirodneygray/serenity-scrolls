const clientId = process.env.AMAZON_SP_CLIENT_ID || "";
const clientSecret = process.env.AMAZON_SP_CLIENT_SECRET || "";
const refreshToken = process.env.AMAZON_SP_REFRESH_TOKEN || "";

async function testConnection() {
    console.log("1. Requesting Access Token...");
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
        console.error("Token exchange failed:", await response.text());
        return;
    }

    const data = await response.json();
    const accessToken = data.access_token;
    console.log("✅ Access token received.");

    // Now test verify-order logic
    const testOrderId = "113-5555555-5555555"; // Fake order ID
    const endpoint = `https://sellingpartnerapi-eu.amazon.com/orders/v0/orders/${testOrderId}`;
    console.log(`\n2. Querying Amazon SP-API for Fake Order: ${testOrderId}...`);
    
    try {
        const orderResponse = await fetch(endpoint, {
            method: "GET",
            headers: {
                "x-amz-access-token": accessToken,
                "Content-Type": "application/json",
            },
        });

        // We expect a 404 or 400 since the order is fake, but NOT a 401/403.
        console.log(`Response Status: ${orderResponse.status}`);
        const orderData = await orderResponse.json();
        console.log("Response Body:");
        console.dir(orderData, { depth: null });

        if (orderResponse.status === 404) {
            console.log("\n✅ AMAZING! We got a 404 Not Found from Amazon's core systems.");
            console.log("This means our SP-API credentials are fully authorized and successfully authenticated via IAM/SP-API boundaries.");
        } else if (orderResponse.status === 403 || orderResponse.status === 401) {
            console.log("\n❌ Authentication or Permissions error.");
        }
    } catch (e) {
        console.error("Error making SP-API request:", e);
    }
}

testConnection();
