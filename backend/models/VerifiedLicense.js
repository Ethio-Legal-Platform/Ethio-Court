const mongoose = require('mongoose');

const VerifiedLicenseSchema = new mongoose.Schema({
  licenseNumber: { type: String, required: true, unique: true, index: true },
  fullName: { type: String, required: true, index: true },
  status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED'], default: 'ACTIVE', index: true },
  issueDate: { type: String, required: true },
  expiryDate: { type: String, required: true },
  specialization: { type: String, required: true },
  tier: { type: String, default: 'Federal High Court' },
  barAssociation: { type: String, default: 'Ethiopian Federal Bar Association' },
  phone: String,
  email: String,
  disciplinaryReason: String
});

module.exports = mongoose.models.VerifiedLicense || mongoose.model('VerifiedLicense', VerifiedLicenseSchema);
