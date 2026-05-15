

const clientId = process.env.AMAZON_SPAPI_CLIENT_ID;
const clientSecret = process.env.AMAZON_SPAPI_CLIENT_SECRET;
const refreshToken = process.env.AMAZON_SPAPI_REFRESH_TOKEN;

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

    const marketplaceId = "ATVPDKIKX0DER"; // US Marketplace
    const endpoint = `https://sellingpartnerapi-na.amazon.com/fba/inventory/v1/summaries?details=true&granularityType=Marketplace&granularityId=${marketplaceId}&marketplaceIds=${marketplaceId}`;
    
    console.log(`\n2. Querying Amazon SP-API for FBA Inventory...`);
    
    try {
        const fbaResponse = await fetch(endpoint, {
            method: "GET",
            headers: {
                "x-amz-access-token": accessToken,
                "Content-Type": "application/json",
            },
        });

        console.log(`Response Status: ${fbaResponse.status}`);
        const fbaData = await fbaResponse.json();
        console.log("Response Body:");
        console.dir(fbaData, { depth: null });

    } catch (e) {
        console.error("Error making SP-API request:", e);
    }
}

testConnection();
