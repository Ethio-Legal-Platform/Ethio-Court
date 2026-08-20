const mongoose = require('mongoose');

const courtCaseSchema = new mongoose.Schema({
  caseId:                  { type: String, required: true, unique: true, index: true },
  caseTitle:               { type: String, required: true },
  caseType:                { type: String, default: 'Civil' },
  dateDecided:             { type: String },
  status:                  { type: String, default: 'Decided', index: true },

  judgeId:                 { type: String },
  judgeName:               { type: String },

  plaintiffClientId:       { type: String },
  plaintiffClientName:     { type: String },
  plaintiffLawyerLicense:  { type: String, index: true },
  plaintiffLawyerName:     { type: String },
  judgeRatingPlaintiff:    { type: Number, default: 5.0 },
  clientRatingPlaintiff:   { type: Number, default: null },

  defendantClientId:       { type: String },
  defendantClientName:     { type: String },
  defendantLawyerLicense:  { type: String, index: true },
  defendantLawyerName:     { type: String },
  judgeRatingDefendant:    { type: Number, default: 4.0 },
  clientRatingDefendant:   { type: Number, default: null },

  verdict:                 { type: mongoose.Schema.Types.Mixed, default: 'Decided' },

  // System & Portal extensions
  jurisdiction:            { type: String },
  description:             { type: String },
  tempPin:                 { type: String },
  filer:                   { type: mongoose.Schema.Types.Mixed },
  defendant:               { type: mongoose.Schema.Types.Mixed },
  plaintiffLawyerStatus:   { type: String },
  defendantLawyerStatus:   { type: String },
  assignedBranchId:        { type: String, index: true },
  assignedJudgeId:         { type: String, index: true },
  assignedClerkId:         { type: String },
  courtroom:               { type: String },
  applicableLaw:           { type: String },
  adminNote:               { type: String },
  postponements:           [mongoose.Schema.Types.Mixed],
  twoStageEvidence:        [mongoose.Schema.Types.Mixed],
  appointments:            [mongoose.Schema.Types.Mixed],
  clientReviews:           { type: mongoose.Schema.Types.Mixed },
  auditLogs:               [mongoose.Schema.Types.Mixed],
  isProsecutor:            { type: Boolean, default: false }
}, { timestamps: true, strict: false });

module.exports = mongoose.models.Case || mongoose.model('Case', courtCaseSchema);
