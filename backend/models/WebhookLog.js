const mongoose = require('mongoose');

const WebhookLogSchema = new mongoose.Schema({
  id: { type: String, required: true, index: true },
  targetUrl: { type: String, required: true },
  eventType: { type: String, enum: ['CASE_DECIDED', 'CASE_RATING_UPDATED', 'MOJ_LICENSE_SYNC', 'BULK_CASES_SYNC', 'BULK_LICENSES_SYNC'], required: true },
  resourceId: String, // e.g. caseId or licenseNumber
  payload: mongoose.Schema.Types.Mixed,
  attempts: { type: Number, default: 1 },
  statusCode: Number,
  success: { type: Boolean, default: false, index: true },
  errorMessage: String,
  dispatchedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.models.WebhookLog || mongoose.model('WebhookLog', WebhookLogSchema);
