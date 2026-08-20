const mongoose = require('mongoose');

const SmsLogSchema = new mongoose.Schema({
  id: String,
  recipient: String,
  message: String,
  sentAt: { type: Date, default: Date.now },
  status: { type: String, default: 'delivered' }
});

module.exports = mongoose.models.SmsLog || mongoose.model('SmsLog', SmsLogSchema);
