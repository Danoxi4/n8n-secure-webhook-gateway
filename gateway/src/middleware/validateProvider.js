'use strict';
const { PROVIDERS } = require('../utils/signature');

module.exports = function validateProvider(req, res, next) {
  if (!PROVIDERS.includes(req.params.provider)) {
    return res.status(404).json({ error: 'Unknown provider' });
  }
  next();
};
