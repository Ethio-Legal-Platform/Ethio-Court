require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB, mongoose } = require('../db');

const Case = require('../models/Case');
const Lawyer = require('../models/Lawyer');
const Judge = require('../models/Judge');
const Staff = require('../models/Staff');
const Notification = require('../models/Notification');
const SmsLog = require('../models/SmsLog');
const VerifiedLicense = require('../models/VerifiedLicense');

function readJSON(filename) {
  const p = path.join(__dirname, '..', 'db', filename);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return [];
  }
}

async function migrate() {
  console.log('[Migration] Connecting to MongoDB...');
  const conn = await connectDB();
  if (!conn) {
    console.error('[Migration] Failed to connect to MongoDB. Ensure your MONGODB_URI in .env is valid.');
    process.exit(1);
  }

  console.log('[Migration] Migrating Verified MoJ Advocate Licenses...');
  const mojLicenses = readJSON('moj_licenses.json');
  for (const ml of mojLicenses) {
    await VerifiedLicense.findOneAndUpdate(
      { licenseNumber: ml.licenseNumber },
      ml,
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log(`  ? ${mojLicenses.length} verified Bar licenses migrated.`);

  console.log('[Migration] Migrating Cases...');
  const cases = readJSON('cases.json');
  for (const c of cases) {
    await Case.findOneAndUpdate({ caseId: c.caseId }, c, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  ? ${cases.length} cases migrated.`);

  console.log('[Migration] Migrating Lawyers...');
  const lawyers = readJSON('lawyers.json');
  for (const l of lawyers) {
    await Lawyer.findOneAndUpdate({ licenseNumber: l.licenseNumber }, l, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  ? ${lawyers.length} lawyers migrated.`);

  console.log('[Migration] Migrating Judges...');
  const judges = readJSON('judges.json');
  for (const j of judges) {
    await Judge.findOneAndUpdate({ id: j.id }, j, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  ? ${judges.length} judges migrated.`);

  console.log('[Migration] Migrating Staff (Admins, Officers, Clerks, Prosecutors)...');
  const admins = readJSON('admins.json').map(a => ({ ...a, role: 'admin' }));
  const officers = readJSON('officers.json').map(o => ({ ...o, role: 'officer' }));
  const clerks = readJSON('clerks.json').map(c => ({ ...c, role: 'clerk' }));
  const prosecutors = readJSON('prosecutors.json').map(p => ({ ...p, role: 'prosecutor' }));

  const allStaff = [...admins, ...officers, ...clerks, ...prosecutors];
  for (const s of allStaff) {
    await Staff.findOneAndUpdate({ id: s.id }, s, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  ? ${allStaff.length} staff accounts migrated.`);

  console.log('[Migration] Migrating Notifications & SMS Logs...');
  const notifs = readJSON('notifications.json');
  for (const n of notifs) {
    await Notification.findOneAndUpdate({ id: n.id }, n, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  ? ${notifs.length} notifications migrated.`);

  const smsLogs = readJSON('sms_logs.json');
  for (const s of smsLogs) {
    await SmsLog.findOneAndUpdate({ id: s.id }, s, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  ? ${smsLogs.length} SMS logs migrated.`);

  console.log('\n?? All court records and MoJ licenses successfully migrated to MongoDB!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('[Migration Error]', err);
  process.exit(1);
});
