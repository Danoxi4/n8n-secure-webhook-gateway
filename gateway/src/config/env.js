'use strict';
/** Single place where process.env is read (NFR-01 / FR-104: secrets come only from the environment). */
require('dotenv').config();

const required = ['MONGO_URI', 'N8N_WEBHOOK_URL', 'N8N_GATEWAY_TOKEN'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const int = (value, fallback) => (Number.isFinite(Number(value)) && value !== '' && value != null ? Number(value) : fallback);

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: int(process.env.PORT, 3000),
  mongoUri: process.env.MONGO_URI,
  trustProxy: int(process.env.TRUST_PROXY_HOPS, 1), // number of proxies in front (Nginx Proxy Manager = 1)
  replayToleranceSeconds: int(process.env.REPLAY_TOLERANCE_SECONDS, 300), // FR-03
  maxBodyBytes: process.env.MAX_BODY_SIZE || '1mb',
  rateLimit: {
    windowMs: int(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: int(process.env.RATE_LIMIT_MAX, 100),
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL, // internal Docker URL, e.g. http://n8n:5678/webhook/gateway-intake
    token: process.env.N8N_GATEWAY_TOKEN, // sent as header; n8n Webhook node uses Header Auth to check it
    timeoutMs: int(process.env.N8N_TIMEOUT_MS, 10_000),
  },
  secrets: {
    stripe: process.env.STRIPE_WEBHOOK_SECRET,
    github: process.env.GITHUB_WEBHOOK_SECRET,
    shopify: process.env.SHOPIFY_WEBHOOK_SECRET,
    custom: process.env.CUSTOM_WEBHOOK_SECRET,
  },
};
