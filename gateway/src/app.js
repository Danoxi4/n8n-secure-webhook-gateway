'use strict';
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { trustProxy } = require('./config/env');
const webhookRoutes = require('./routes/webhook.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', trustProxy); // so req.ip is the real client behind Nginx Proxy Manager
app.use(helmet());

app.get('/health', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', mongo: dbUp });
});

app.use('/webhooks', webhookRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

module.exports = app;
