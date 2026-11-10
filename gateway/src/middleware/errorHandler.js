'use strict';

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Payload too large' });
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
};
