const fs = require('fs');
if (!fs.existsSync('models')) fs.mkdirSync('models');

fs.writeFileSync('db.js', `require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/efcourt';

let isConnected = false;

async function connectDB() {
  if (isConnected) return mongoose.connection;
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[MongoDB] Connected to: ' + conn.connection.host + '/' + conn.connection.name);
    return conn;
  } catch (err) {
    console.warn('[MongoDB] Connection warning (using JSON DB fallback): ' + err.message);
    return null;
  }
}

module.exports = { connectDB, mongoose };
`);

fs.writeFileSync('models/Case.js', `const mongoose = require('mongoose');

const EvidenceSchema = new mongoose.Schema({
  id: String,
  title: String,
  fileName: String,
  submittedBy: String,
  status: { type: String, default: 'pending_review' },
  stage: { type: Number, default: 1 },
  confidential: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now },
  reviewNotes: String,
  reviewedBy: String,
  fileUrl: String
}, { _id: false });

const AppointmentSchema = new mongoose.Schema({
  id: String,
  date: String,
  time: String,
  courtroom: String,
  type: String,
  notes: String,
  status: { type: String, default: 'scheduled' },
  scheduledBy: String,
  scheduledAt: { type: Date, default: Date.now }
}, { _id: false });

const VerdictSchema = new mongoose.Schema({
  winningParty: String,
  winningSide: String,
  losingSide: String,
  winnerName: String,
  loserName: String,
  outcomeSummary: String,
  judgmentRemedy: String,
  finalStatement: String,
  verdictDate: Date,
  appealDeadline: Date,
  appealFiled: { type: Boolean, default: false },
  judgeId: String,
  judgeName: String,
  advocateRatings: [mongoose.Schema.Types.Mixed],
  appeal: mongoose.Schema.Types.Mixed
}, { _id: false });

const CaseSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true, index: true },
  caseTitle: { type: String, required: true },
  caseType: { type: String, required: true },
  jurisdiction: String,
  description: String,
  status: { type: String, default: 'pending_review', index: true },
  tempPin: String,
  filer: {
    name: String,
    phone: { type: String, index: true },
    role: String,
    email: String,
    address: String,
    city: String
  },
  defendant: {
    name: String,
    phone: { type: String, index: true },
    email: String,
    defendantType: String,
    address: String,
    tempPassword: String,
    isActivated: { type: Boolean, default: false },
    representationType: { type: String, default: 'unassigned' },
    appointedLawyerLicense: String
  },
  plaintiffLawyerLicense: { type: String, index: true },
  plaintiffLawyerStatus: String,
  defendantLawyerLicense: { type: String, index: true },
  defendantLawyerStatus: String,
  assignedBranchId: { type: String, index: true },
  assignedJudgeId: { type: String, index: true },
  assignedClerkId: String,
  courtroom: String,
  applicableLaw: String,
  adminNote: String,
  postponements: [mongoose.Schema.Types.Mixed],
  twoStageEvidence: [EvidenceSchema],
  appointments: [AppointmentSchema],
  verdict: VerdictSchema,
  clientReviews: {
    plaintiff: mongoose.Schema.Types.Mixed,
    defendant: mongoose.Schema.Types.Mixed
  },
  auditLogs: [mongoose.Schema.Types.Mixed],
  isProsecutor: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Case || mongoose.model('Case', CaseSchema);
`);

fs.writeFileSync('models/Lawyer.js', `const mongoose = require('mongoose');

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
`);

fs.writeFileSync('models/Judge.js', `const mongoose = require('mongoose');

const JudgeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  email: String,
  phone: String,
  assignedBranchId: String,
  courtroom: String,
  caseload: { type: Number, default: 0 },
  role: { type: String, default: 'judge' }
});

module.exports = mongoose.models.Judge || mongoose.model('Judge', JudgeSchema);
`);

fs.writeFileSync('models/Staff.js', `const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  email: String,
  phone: String,
  role: { type: String, required: true, index: true },
  branchId: String,
  branchName: String,
  jurisdiction: String,
  licenseNumber: String,
  department: String
});

module.exports = mongoose.models.Staff || mongoose.model('Staff', StaffSchema);
`);

fs.writeFileSync('models/Notification.js', `const mongoose = require('mongoose');

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
`);

fs.writeFileSync('models/SmsLog.js', `const mongoose = require('mongoose');

const SmsLogSchema = new mongoose.Schema({
  id: String,
  recipient: String,
  message: String,
  sentAt: { type: Date, default: Date.now },
  status: { type: String, default: 'delivered' }
});

module.exports = mongoose.models.SmsLog || mongoose.model('SmsLog', SmsLogSchema);
`);

console.log('All MongoDB Models successfully generated!');
