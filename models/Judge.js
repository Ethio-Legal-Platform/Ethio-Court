const mongoose = require('mongoose');

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
