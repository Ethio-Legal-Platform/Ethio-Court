const fs = require('fs');
const path = require('path');
const { mongoose } = require('../db');

const Case = require('../models/Case');
const Lawyer = require('../models/Lawyer');
const Judge = require('../models/Judge');
const Staff = require('../models/Staff');
const Notification = require('../models/Notification');
const SmsLog = require('../models/SmsLog');

const DB_PATH = p => path.join(__dirname, '..', 'db', p);

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH(file), 'utf8'));
  } catch {
    return [];
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(DB_PATH(file), JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
  }
}

const isMongoActive = () => mongoose.connection.readyState === 1;

// -- Cases -------------------------------------------------------------------
async function getCases(query = {}) {
  if (isMongoActive()) {
    return await Case.find(query).lean();
  }
  const all = readJSON('cases.json');
  return all;
}

async function getCaseById(caseId) {
  if (isMongoActive()) {
    return await Case.findOne({ caseId }).lean();
  }
  const all = readJSON('cases.json');
  return all.find(c => c.caseId === caseId) || null;
}

async function createCase(caseData) {
  // Always mirror write to JSON for backup
  const all = readJSON('cases.json');
  all.unshift(caseData);
  writeJSON('cases.json', all);

  if (isMongoActive()) {
    try {
      const doc = await Case.create(caseData);
      return doc.toObject();
    } catch (err) {
      console.warn('[MongoDB Create Case]', err.message);
    }
  }
  return caseData;
}

async function updateCase(caseId, updateData) {
  const all = readJSON('cases.json');
  const idx = all.findIndex(c => c.caseId === caseId);
  let updated = null;
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updateData, updatedAt: new Date().toISOString() };
    writeJSON('cases.json', all);
    updated = all[idx];
  }

  if (isMongoActive()) {
    try {
      const doc = await Case.findOneAndUpdate(
        { caseId },
        { $set: { ...updateData, updatedAt: new Date() } },
        { new: true, upsert: true }
      ).lean();
      return doc || updated;
    } catch (err) {
      console.warn('[MongoDB Update Case]', err.message);
    }
  }
  return updated;
}

// -- Lawyers -----------------------------------------------------------------
async function getLawyers() {
  if (isMongoActive()) {
    return await Lawyer.find({}).lean();
  }
  return readJSON('lawyers.json');
}

async function getLawyerByLicense(licenseNumber) {
  if (isMongoActive()) {
    return await Lawyer.findOne({ licenseNumber }).lean();
  }
  const all = readJSON('lawyers.json');
  return all.find(l => l.licenseNumber === licenseNumber) || null;
}

async function updateLawyer(licenseNumber, updateData) {
  const all = readJSON('lawyers.json');
  const idx = all.findIndex(l => l.licenseNumber === licenseNumber);
  let updated = null;
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updateData };
    writeJSON('lawyers.json', all);
    updated = all[idx];
  }

  if (isMongoActive()) {
    try {
      const doc = await Lawyer.findOneAndUpdate(
        { licenseNumber },
        { $set: updateData },
        { new: true, upsert: true }
      ).lean();
      return doc || updated;
    } catch (err) {
      console.warn('[MongoDB Update Lawyer]', err.message);
    }
  }
  return updated;
}

async function createLawyer(lawyerData) {
  const all = readJSON('lawyers.json');
  all.push(lawyerData);
  writeJSON('lawyers.json', all);

  if (isMongoActive()) {
    try {
      await Lawyer.create(lawyerData);
    } catch (err) {
      console.warn('[MongoDB Create Lawyer]', err.message);
    }
  }
  return lawyerData;
}

// -- Staff & Judges ----------------------------------------------------------
async function getJudges() {
  if (isMongoActive()) {
    return await Judge.find({}).lean();
  }
  return readJSON('judges.json');
}

async function getStaff(role) {
  if (isMongoActive()) {
    return await Staff.find(role ? { role } : {}).lean();
  }
  const fileMap = {
    officer: 'officers.json',
    clerk: 'clerks.json',
    admin: 'admins.json',
    prosecutor: 'prosecutors.json'
  };
  if (role && fileMap[role]) return readJSON(fileMap[role]);
  return [
    ...readJSON('admins.json').map(a => ({ ...a, role: 'admin' })),
    ...readJSON('officers.json').map(o => ({ ...o, role: 'officer' })),
    ...readJSON('clerks.json').map(c => ({ ...c, role: 'clerk' })),
    ...readJSON('prosecutors.json').map(p => ({ ...p, role: 'prosecutor' }))
  ];
}

// -- Notifications & SMS -----------------------------------------------------
async function getNotifications(filter = {}) {
  if (isMongoActive()) {
    return await Notification.find(filter).lean();
  }
  const all = readJSON('notifications.json');
  if (filter.lawyerLicenseNumber) {
    return all.filter(n => n.lawyerLicenseNumber === filter.lawyerLicenseNumber);
  }
  return all;
}

async function createNotification(notifData) {
  const all = readJSON('notifications.json');
  all.unshift(notifData);
  writeJSON('notifications.json', all);

  if (isMongoActive()) {
    try {
      await Notification.create(notifData);
    } catch (err) {
      console.warn('[MongoDB Create Notif]', err.message);
    }
  }
  return notifData;
}

async function getSmsLogs() {
  if (isMongoActive()) {
    return await SmsLog.find({}).sort({ sentAt: -1 }).limit(300).lean();
  }
  return readJSON('sms_logs.json');
}

async function saveSmsLog(entry) {
  const all = readJSON('sms_logs.json');
  all.unshift(entry);
  if (all.length > 300) all.pop();
  writeJSON('sms_logs.json', all);

  if (isMongoActive()) {
    try {
      await SmsLog.create(entry);
    } catch (err) {
      console.warn('[MongoDB Save SmsLog]', err.message);
    }
  }
  return entry;
}

// ── Verified Advocate Licenses (Ministry of Justice Registry) ─────────────
const VerifiedLicense = require('../models/VerifiedLicense');

async function getVerifiedLicenses(filter = {}) {
  if (isMongoActive()) {
    const q = {};
    if (filter.status) q.status = filter.status;
    if (filter.specialization) q.specialization = new RegExp(filter.specialization, 'i');
    if (filter.query) {
      q.$or = [
        { licenseNumber: new RegExp(filter.query, 'i') },
        { fullName: new RegExp(filter.query, 'i') }
      ];
    }
    return await VerifiedLicense.find(q).lean();
  }
  const all = readJSON('moj_licenses.json');
  return all.filter(l => {
    if (filter.status && l.status !== filter.status) return false;
    if (filter.specialization && !l.specialization.toLowerCase().includes(filter.specialization.toLowerCase())) return false;
    if (filter.query) {
      const q = filter.query.toLowerCase();
      return l.licenseNumber.toLowerCase().includes(q) || l.fullName.toLowerCase().includes(q);
    }
    return true;
  });
}

async function getVerifiedLicenseByNumber(licenseNumber) {
  if (!licenseNumber) return null;
  const num = String(licenseNumber).trim().toUpperCase();
  if (isMongoActive()) {
    return await VerifiedLicense.findOne({ licenseNumber: num }).lean();
  }
  const all = readJSON('moj_licenses.json');
  return all.find(l => l.licenseNumber.toUpperCase() === num) || null;
}

module.exports = {
  isMongoActive,
  getCases,
  getCaseById,
  createCase,
  updateCase,
  getLawyers,
  getLawyerByLicense,
  updateLawyer,
  createLawyer,
  getJudges,
  getStaff,
  getNotifications,
  createNotification,
  getSmsLogs,
  saveSmsLog,
  getVerifiedLicenses,
  getVerifiedLicenseByNumber,
  readJSON,
  writeJSON
};
