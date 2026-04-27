/**
 * test-stripe-ids.mjs
 *
 * Validates Stripe price IDs and coupon by invoking create-subscription
 * for each plan variant. If Stripe accepts them, a checkout URL is returned.
 * If a price ID or coupon is invalid, Stripe returns a clear error.
 *
 * Usage:
 *   node test-stripe-ids.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env.local ────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, ".env.local");

try {
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch (e) {
  console.error("Could not read .env.local:", e.message);
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const FN_URL       = `${SUPABASE_URL}/functions/v1/create-subscription`;

// Use a throwaway test email so Stripe doesn't associate to a real customer
const TEST_EMAIL = "stripe-test-validate@serenity-test.invalid";

const TESTS = [
  {
    label: "Monthly Plan (STRIPE_SERVANT_PRICE_ID)",
    body: { email: TEST_EMAIL, userId: "test-user", plan: "monthly" },
  },
  {
    label: "Monthly Plan + SERENITY10 Coupon",
    body: { email: TEST_EMAIL, userId: "test-user", plan: "monthly", coupon: "SERENITY10" },
  },
  {
    label: "Annual Plan (STRIPE_SERVANT_ANNUAL_PRICE_ID)",
    body: { email: TEST_EMAIL, userId: "test-user", plan: "annual" },
  },
];

async function runTest({ label, body }) {
  process.stdout.write(`\n  Testing: ${label}\n`);
  try {
    const res = await fetch(FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok && data.url) {
      console.log(`  ✅ VALID — Stripe returned a checkout URL`);
      // Show just the session ID portion so we don't expose the full URL in logs
      const sessionMatch = data.url.match(/cs_(test|live)_[a-zA-Z0-9]+/);
      if (sessionMatch) {
        console.log(`     Session: ${sessionMatch[0]}`);
      }
    } else if (data.error) {
      console.log(`  ❌ ERROR — ${data.error}`);
    } else {
      console.log(`  ⚠️  Unexpected response (HTTP ${res.status}):`, JSON.stringify(data));
    }
  } catch (err) {
    console.log(`  ❌ FETCH FAILED — ${err.message}`);
  }
}

console.log("=".repeat(60));
console.log(" Serenity Scrolls — Stripe Price ID Validator");
console.log(" Project:", SUPABASE_URL);
console.log("=".repeat(60));

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Missing env vars. Check .env.local");
  process.exit(1);
}

for (const test of TESTS) {
  await runTest(test);
}

console.log("\n" + "=".repeat(60));
console.log(" Done. ✅ = price ID valid | ❌ = invalid or missing");
console.log("=".repeat(60) + "\n");
