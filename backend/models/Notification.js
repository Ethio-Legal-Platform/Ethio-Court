const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  id: String,
  recipient: String,
  lawyerLicenseNumber: String,
  title: String,
  message: String,
  caseId: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
