'use strict';
/**
 * HMAC needs the exact bytes the provider signed, so the webhook route uses express.raw()
 * instead of express.json(). The parsed JSON is produced later, only after verification.
 */
const express = require('express');
const { maxBodyBytes } = require('../config/env');

const raw = express.raw({ type: () => true, limit: maxBodyBytes });

module.exports = function captureRawBody(req, res, next) {
  raw(req, res, (err) => {
    if (err) return next(err);
    // body-parser leaves {} when there is no body; normalise to an empty Buffer.
    req.rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    next();
  });
};
