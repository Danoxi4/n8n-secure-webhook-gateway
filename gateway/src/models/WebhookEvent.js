'use strict';
const mongoose = require('mongoose');

// Note: Mongoose field type key is lowercase `type` (the SRS draft had `Type`, which Mongoose ignores).
const WebhookEventSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, enum: ['stripe', 'github', 'shopify', 'custom'], index: true },
    eventType: { type: String, required: true, default: 'unknown' },
    signatureVerified: { type: Boolean, required: true },
    clientIp: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    processingStatus: {
      type: String,
      enum: ['RECEIVED', 'VERIFIED', 'REJECTED', 'PROCESSED', 'FAILED'],
      default: 'RECEIVED',
      index: true,
    },
    errorDetails: { type: String },
  },
  { timestamps: true }
);

WebhookEventSchema.index({ provider: 1, createdAt: -1 });

module.exports = mongoose.model('WebhookEvent', WebhookEventSchema);
