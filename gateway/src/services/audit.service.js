'use strict';
/** FR-04: every attempt, success or failure, becomes a MongoDB document. */
const WebhookEvent = require('../models/WebhookEvent');

/** Parse the raw body for the audit record without ever throwing on garbage input. */
function safePayload(rawBody) {
  if (!rawBody || rawBody.length === 0) return {};
  const text = rawBody.toString('utf8');
  try {
    return JSON.parse(text);
  } catch {
    return { _unparsed: text.slice(0, 10_000) };
  }
}

async function logRejected(req, reason) {
  try {
    await WebhookEvent.create({
      provider: req.params.provider,
      eventType: 'unknown',
      signatureVerified: false,
      clientIp: req.ip,
      payload: safePayload(req.rawBody),
      processingStatus: 'REJECTED',
      errorDetails: reason,
    });
  } catch (err) {
    // Auditing must never turn a clean 401 into a 500.
    console.error('Audit log failed (rejected event):', err.message);
  }
}

async function logVerified({ provider, eventType, payload, clientIp }) {
  return WebhookEvent.create({
    provider,
    eventType,
    signatureVerified: true,
    clientIp,
    payload,
    processingStatus: 'VERIFIED',
  });
}

async function setStatus(id, processingStatus, errorDetails) {
  try {
    await WebhookEvent.updateOne({ _id: id }, { processingStatus, ...(errorDetails && { errorDetails }) });
  } catch (err) {
    console.error('Audit status update failed:', err.message);
  }
}

module.exports = { logRejected, logVerified, setStatus, safePayload };
