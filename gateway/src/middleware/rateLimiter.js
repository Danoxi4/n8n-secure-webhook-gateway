'use strict';
const rateLimit = require('express-rate-limit');
const { rateLimit: cfg } = require('../config/env');

// Runs before body parsing and HMAC so floods are cut off cheaply.
module.exports = rateLimit({
  windowMs: cfg.windowMs,
  max: cfg.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});
