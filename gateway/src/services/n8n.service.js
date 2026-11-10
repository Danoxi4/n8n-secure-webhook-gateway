'use strict';
/** FR-06: dispatch the normalized payload to n8n over the internal Docker network. */
const { n8n } = require('../config/env');

async function forwardToN8n(normalized) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), n8n.timeoutMs);
  try {
    const res = await fetch(n8n.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Defence in depth: the n8n Webhook node is set to Header Auth, so a request that
        // bypasses the gateway (e.g. via the public n8n hostname) is rejected by n8n itself.
        'X-Gateway-Token': n8n.token,
      },
      body: JSON.stringify(normalized),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`n8n responded ${res.status}`);
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { forwardToN8n };
