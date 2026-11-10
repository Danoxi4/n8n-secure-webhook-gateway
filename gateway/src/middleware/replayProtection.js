'use strict';
const { replayToleranceSeconds } = require('../config/env');
const { checkTimestamp } = require('../utils/replay');
const audit = require('../services/audit.service');

/**
 * Runs AFTER signature verification, so the timestamp it checks is the authenticated one.
 * GitHub and Shopify do not sign a timestamp; for those the check is skipped.
 */
module.exports = async function replayProtection(req, res, next) {
  if (req.signatureTimestamp === undefined) return next();

  const result = checkTimestamp(req.signatureTimestamp, replayToleranceSeconds);
  if (!result.ok) {
    await audit.logRejected(req, result.reason);
    return res.status(400).json({ error: 'Request expired' });
  }
  next();
};
