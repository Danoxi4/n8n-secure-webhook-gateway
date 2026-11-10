'use strict';
/**
 * Provider-specific HMAC-SHA256 verification (FR-02, NFR-01).
 * Pure functions, no Express/Mongo imports, so they are trivial to unit test.
 *
 * Every verifier receives the RAW request bytes. Re-serialising parsed JSON
 * would change the bytes and break the signature.
 */
const crypto = require('node:crypto');

function hmac(secret, data, encoding) {
  return crypto.createHmac('sha256', secret).update(data).digest(encoding);
}

/** Constant-time string comparison. timingSafeEqual throws on length mismatch, so guard first. */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const fail = (reason) => ({ ok: false, reason });

/** Stripe: header `t=<unix>,v1=<hex>[,v1=<hex>]`, signed payload is `${t}.${rawBody}` */
function verifyStripe(headers, rawBody, secret) {
  const header = headers['stripe-signature'];
  if (!header) return fail('Missing Stripe-Signature header');
  const parts = header.split(',').map((p) => p.trim().split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || sigs.length === 0) return fail('Malformed Stripe-Signature header');
  const expected = hmac(secret, `${t}.${rawBody.toString('utf8')}`, 'hex');
  const ok = sigs.some((s) => safeEqual(s, expected));
  return ok ? { ok, timestamp: Number(t) } : fail('Signature mismatch');
}

/** GitHub: `X-Hub-Signature-256: sha256=<hex>` over the raw body. No timestamp is provided. */
function verifyGithub(headers, rawBody, secret) {
  const header = headers['x-hub-signature-256'];
  if (!header) return fail('Missing X-Hub-Signature-256 header');
  const expected = `sha256=${hmac(secret, rawBody, 'hex')}`;
  return safeEqual(header, expected) ? { ok: true } : fail('Signature mismatch');
}

/** Shopify: `X-Shopify-Hmac-Sha256: <base64>` over the raw body. No timestamp is provided. */
function verifyShopify(headers, rawBody, secret) {
  const header = headers['x-shopify-hmac-sha256'];
  if (!header) return fail('Missing X-Shopify-Hmac-Sha256 header');
  const expected = hmac(secret, rawBody, 'base64');
  return safeEqual(header, expected) ? { ok: true } : fail('Signature mismatch');
}

/**
 * Custom clients: `X-Signature: <hex>` (optional `sha256=` prefix) and `X-Timestamp: <unix seconds>`.
 * Signed payload is `${timestamp}.${rawBody}`, same scheme as Stripe, so the timestamp is
 * covered by the signature and cannot be swapped to dodge replay protection.
 */
function verifyCustom(headers, rawBody, secret) {
  const sig = (headers['x-signature'] || '').replace(/^sha256=/, '');
  const ts = headers['x-timestamp'];
  if (!sig) return fail('Missing X-Signature header');
  if (!ts) return fail('Missing X-Timestamp header');
  const expected = hmac(secret, `${ts}.${rawBody.toString('utf8')}`, 'hex');
  return safeEqual(sig, expected) ? { ok: true, timestamp: Number(ts) } : fail('Signature mismatch');
}

const VERIFIERS = {
  stripe: verifyStripe,
  github: verifyGithub,
  shopify: verifyShopify,
  custom: verifyCustom,
};

/** @returns {{ok: boolean, reason?: string, timestamp?: number}} */
function verifySignature(provider, headers, rawBody, secret) {
  const verifier = VERIFIERS[provider];
  if (!verifier) return fail(`Unsupported provider: ${provider}`);
  if (!secret) return fail(`No secret configured for provider: ${provider}`);
  return verifier(headers, rawBody, secret);
}

module.exports = { verifySignature, hmac, safeEqual, PROVIDERS: Object.keys(VERIFIERS) };
