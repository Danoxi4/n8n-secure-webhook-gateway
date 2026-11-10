'use strict';
/** FR-05: one internal schema, whatever the provider. n8n workflows only ever see this shape. */
const crypto = require('node:crypto');

function extractEventType(provider, headers, payload) {
  switch (provider) {
    case 'stripe':
      return payload?.type || 'stripe.unknown';
    case 'github':
      return headers['x-github-event'] || 'github.unknown';
    case 'shopify':
      return headers['x-shopify-topic'] || 'shopify.unknown';
    default:
      return payload?.event || headers['x-event-type'] || 'custom.event';
  }
}

function normalize({ provider, eventType, payload, clientIp, eventId }) {
  return {
    id: crypto.randomUUID(),
    auditId: eventId ? String(eventId) : null, // links the n8n execution back to the Mongo audit log
    source: provider,
    eventType,
    receivedAt: new Date().toISOString(),
    meta: { clientIp, signatureVerified: true },
    data: payload,
  };
}

module.exports = { normalize, extractEventType };
