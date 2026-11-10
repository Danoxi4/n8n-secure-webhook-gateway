'use strict';
const audit = require('../services/audit.service');
const { forwardToN8n } = require('../services/n8n.service');
const { normalize, extractEventType } = require('../utils/normalize');

/**
 * Reached only after: rate limit -> raw body -> signature (FR-02) -> replay check (FR-03).
 * Persist first, acknowledge fast (providers retry on slow responses), forward in the background.
 */
exports.receive = async (req, res, next) => {
  try {
    const { provider } = req.params;

    let payload;
    try {
      payload = JSON.parse(req.rawBody.toString('utf8'));
    } catch {
      await audit.logRejected(req, 'Body is not valid JSON');
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    const eventType = extractEventType(provider, req.headers, payload);
    const event = await audit.logVerified({ provider, eventType, payload, clientIp: req.ip });

    res.status(202).json({ status: 'accepted', id: event.id });

    // Fire-and-track: the outcome is written back to the audit document.
    const normalized = normalize({ provider, eventType, payload, clientIp: req.ip, eventId: event.id });
    forwardToN8n(normalized)
      .then(() => audit.setStatus(event.id, 'PROCESSED'))
      .catch((err) => audit.setStatus(event.id, 'FAILED', err.message));
  } catch (err) {
    next(err);
  }
};
