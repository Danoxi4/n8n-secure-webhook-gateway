'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { verifySignature, hmac, safeEqual } = require('../src/utils/signature');
const { checkTimestamp } = require('../src/utils/replay');
const { normalize, extractEventType } = require('../src/utils/normalize');

const SECRET = 'test_secret';
const body = Buffer.from(JSON.stringify({ hello: 'world' }));
const now = Math.floor(Date.now() / 1000);

test('safeEqual handles equal, different and mismatched-length input without throwing', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'abcd'), false);
});

test('stripe: valid signature passes and exposes the signed timestamp', () => {
  const sig = hmac(SECRET, `${now}.${body}`, 'hex');
  const r = verifySignature('stripe', { 'stripe-signature': `t=${now},v1=${sig}` }, body, SECRET);
  assert.equal(r.ok, true);
  assert.equal(r.timestamp, now);
});

test('stripe: tampered body is rejected', () => {
  const sig = hmac(SECRET, `${now}.${body}`, 'hex');
  const r = verifySignature('stripe', { 'stripe-signature': `t=${now},v1=${sig}` }, Buffer.from('{"hello":"evil"}'), SECRET);
  assert.equal(r.ok, false);
});

test('github: valid and invalid', () => {
  const good = `sha256=${hmac(SECRET, body, 'hex')}`;
  assert.equal(verifySignature('github', { 'x-hub-signature-256': good }, body, SECRET).ok, true);
  assert.equal(verifySignature('github', { 'x-hub-signature-256': 'sha256=deadbeef' }, body, SECRET).ok, false);
});

test('shopify: base64 signature', () => {
  const good = hmac(SECRET, body, 'base64');
  assert.equal(verifySignature('shopify', { 'x-shopify-hmac-sha256': good }, body, SECRET).ok, true);
});

test('custom: timestamp is covered by the signature', () => {
  const sig = hmac(SECRET, `${now}.${body}`, 'hex');
  assert.equal(verifySignature('custom', { 'x-signature': sig, 'x-timestamp': String(now) }, body, SECRET).ok, true);
  // attacker swaps in a fresh timestamp on a captured request
  assert.equal(verifySignature('custom', { 'x-signature': sig, 'x-timestamp': String(now + 1) }, body, SECRET).ok, false);
});

test('missing header and missing secret are rejected', () => {
  assert.equal(verifySignature('github', {}, body, SECRET).ok, false);
  assert.equal(verifySignature('github', { 'x-hub-signature-256': 'x' }, body, undefined).ok, false);
});

test('replay: 300s window', () => {
  assert.equal(checkTimestamp(now - 10, 300).ok, true);
  assert.equal(checkTimestamp(now - 301, 300).ok, false);
  assert.equal(checkTimestamp(now + 400, 300).ok, false);
  assert.equal(checkTimestamp(NaN, 300).ok, false);
});

test('normalize produces the internal schema', () => {
  const n = normalize({ provider: 'github', eventType: 'push', payload: { a: 1 }, clientIp: '1.2.3.4', eventId: 'abc' });
  assert.equal(n.source, 'github');
  assert.equal(n.eventType, 'push');
  assert.equal(n.auditId, 'abc');
  assert.deepEqual(n.data, { a: 1 });
  assert.match(n.id, /^[0-9a-f-]{36}$/);
  assert.equal(extractEventType('github', { 'x-github-event': 'push' }, {}), 'push');
  assert.equal(extractEventType('stripe', {}, { type: 'invoice.paid' }), 'invoice.paid');
});
