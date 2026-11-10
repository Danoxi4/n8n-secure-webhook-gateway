'use strict';
/**
 * Sends a correctly signed "custom" webhook, or a tampered / stale one, to the gateway.
 *   node scripts/send-test-webhook.js                 -> valid (expect 202)
 *   node scripts/send-test-webhook.js --tamper        -> bad signature (expect 401)
 *   node scripts/send-test-webhook.js --stale         -> 10-minute-old timestamp (expect 400)
 * Env: GATEWAY_URL (default http://localhost:3000), CUSTOM_WEBHOOK_SECRET
 */
const crypto = require('node:crypto');

const url = `${process.env.GATEWAY_URL || 'http://localhost:3000'}/webhooks/custom`;
const secret = process.env.CUSTOM_WEBHOOK_SECRET;
if (!secret) {
  console.error('Set CUSTOM_WEBHOOK_SECRET (same value as in .env)');
  process.exit(1);
}

const args = process.argv.slice(2);
const timestamp = Math.floor(Date.now() / 1000) - (args.includes('--stale') ? 600 : 0);
const body = JSON.stringify({ event: 'customer.registered', customer: { email: 'demo@example.com', tier: 'enterprise' } });
let signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
if (args.includes('--tamper')) signature = signature.replace(/.$/, (c) => (c === '0' ? '1' : '0'));

(async () => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Signature': signature, 'X-Timestamp': String(timestamp) },
    body,
  });
  console.log(res.status, await res.text());
})();
