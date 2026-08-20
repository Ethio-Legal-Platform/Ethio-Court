const mongoose = require('mongoose');

const LawyerSchema = new mongoose.Schema({
  id: String,
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  email: String,
  phone: String,
  licenseNumber: { type: String, required: true, unique: true, index: true },
  specialization: String,
  role: { type: String, default: 'lawyer' },
  isGovernmentLawyer: { type: Boolean, default: false },
  currentCaseload: { type: Number, default: 0 },
  registeredAt: { type: Date, default: Date.now },
  blockedFilers: [String],
  ratings: [mongoose.Schema.Types.Mixed],
  averageRating: { type: Number, default: 5 },
  ratingCount: { type: Number, default: 0 },
  clientReviews: [mongoose.Schema.Types.Mixed],
  clientAverageRating: Number,
  clientRatingCount: Number
});

module.exports = mongoose.models.Lawyer || mongoose.model('Lawyer', LawyerSchema);
