/**
 * test-subscription-offers.mjs
 *
 * Sends all 3 subscription offer emails to a test address by invoking
 * the `send-subscription-offers` edge function with test overrides.
 *
 * Usage:
 *   node test-subscription-offers.mjs
 *
 * Reads credentials from .env.local automatically.
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
    let val = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch (e) {
  console.error("Could not read .env.local:", e.message);
  process.exit(1);
}

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY      = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const TEST_EMAIL    = "ivllnv.000@gmail.com";
const FUNCTION_URL  = `${SUPABASE_URL}/functions/v1/send-subscription-offers`;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local");
  process.exit(1);
}

// ── Helper ─────────────────────────────────────────────────────────────────
async function invokeStage(stage, label) {
  console.log(`\n📧 Sending Email ${label} (stage: ${stage}) → ${TEST_EMAIL}`);

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ANON_KEY}`,
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({
      test_email: TEST_EMAIL,
      test_stage: stage,
    }),
  });

  const body = await res.json();

  if (res.ok) {
    console.log(`   ✅ Success:`, JSON.stringify(body, null, 2));
  } else {
    console.error(`   ❌ Error (HTTP ${res.status}):`, JSON.stringify(body, null, 2));
  }
  return body;
}

// ── Run all 3 stages ───────────────────────────────────────────────────────
console.log("=".repeat(60));
console.log(" Serenity Scrolls — Subscription Offer Email Test");
console.log(" Target:", TEST_EMAIL);
console.log("=".repeat(60));

await invokeStage("7day",   "1 — 7-Day Exclusive Offer (10% off monthly OR 4 months free annual)");
await invokeStage("3day",   "2 — 3-Day Reminder (no discount)");
await invokeStage("expiry", "3 — Expiry / Access Ended");

console.log("\n✅ All 3 test emails dispatched. Check ivllnv.000@gmail.com\n");
