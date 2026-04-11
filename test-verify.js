async function testVerify() {
    const res = await fetch("https://ytaporbcmtlidafbssyc.supabase.co/functions/v1/verify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            orderId: "CONSUMER-2026411-01424",
            email: "test@example.com"
        })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
}

testVerify();
