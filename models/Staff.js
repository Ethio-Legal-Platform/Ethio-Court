const mongoose = require('mongoose');

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
