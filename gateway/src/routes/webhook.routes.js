'use strict';
const { Router } = require('express');
const validateProvider = require('../middleware/validateProvider');
const rateLimiter = require('../middleware/rateLimiter');
const captureRawBody = require('../middleware/captureRawBody');
const verifySignature = require('../middleware/verifySignature');
const replayProtection = require('../middleware/replayProtection');
const controller = require('../controllers/webhook.controller');

const router = Router();

// Order matters: cheap checks first, expensive ones later.
router.post(
  '/:provider',
  validateProvider,
  rateLimiter,
  captureRawBody,
  verifySignature,
  replayProtection,
  controller.receive
);

module.exports = router;
