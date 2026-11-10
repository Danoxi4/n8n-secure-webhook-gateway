'use strict';
const { secrets } = require('../config/env');
const { verifySignature } = require('../utils/signature');
const audit = require('../services/audit.service');

module.exports = async function verifySignatureMiddleware(req, res, next) {
  const { provider } = req.params;
  const result = verifySignature(provider, req.headers, req.rawBody, secrets[provider]);

  if (!result.ok) {
    await audit.logRejected(req, result.reason);
    // Generic message to the caller; the precise reason lives only in the audit log.
    return res.status(401).json({ error: 'Invalid signature' });
  }

  req.signatureTimestamp = result.timestamp; // undefined for providers that don't sign a timestamp
  next();
};
