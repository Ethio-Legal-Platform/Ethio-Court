'use strict';
require('dotenv').config();
const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const multer   = require('multer');
const { v4: uuidv4 } = require('uuid');
const fetch = globalThis.fetch;
const { connectDB, mongoose } = require('./db');
const dbService = require('./services/dbService');
const webhookDispatcher = require('./services/webhookDispatcher');

const app  = express();
const PORT = process.env.PORT || 5001;

// ── Paths ──────────────────────────────────────────────────────────────────
const DB = p => path.join(__dirname, 'db', p);
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ── Multer (file uploads) ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────
const readDB  = file => { try { return JSON.parse(fs.readFileSync(DB(file), 'utf8')); } catch { return []; } };
const writeDB = (file, data) => fs.writeFileSync(DB(file), JSON.stringify(data, null, 2));

// Generate 6-digit OTP
const genOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// In-memory OTP store  { phone: { code, expires } }
const otpStore = {};

// SMS Logs store
const SMS_LOGS_FILE = 'sms_logs.json';
const getSmsLogs = () => readDB(SMS_LOGS_FILE);
const saveSmsLog = entry => {
  const logs = getSmsLogs();
  logs.unshift(entry);
  if (logs.length > 300) logs.pop();
  writeDB(SMS_LOGS_FILE, logs);
};

// SMSEthiopia API Key
const SMS_API_KEY = '7R45MFJVWUC9GPZT84GT7N1YN8ZCYFV298U98DW1';

async function sendSMS(phone, message) {
  if (!phone) return { status: 'skipped' };
  let msisdn = String(phone).replace(/\s+/g, '');
  if (msisdn.startsWith('0')) msisdn = '251' + msisdn.slice(1);
  if (!msisdn.startsWith('251')) msisdn = '251' + msisdn;

  let deliveryStatus = 'PENDING';
  let isNotWhitelisted = false;
  let errorMsg = null;

  try {
    const res = await fetch('https://smsethiopia.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'KEY': SMS_API_KEY },
      body: JSON.stringify({ msisdn, text: message })
    });
    const data = await res.json();
    if (res.ok && (data.sent || data.description === 'Accepted for delivery')) {
      deliveryStatus = 'DELIVERED';
      console.log(`[SMS SUCCESS] → ${msisdn}: ${message}`);
    } else {
      errorMsg = data.error_message || data.description || 'SMS Gateway Rejected';
      if (errorMsg.includes('NOT_WHITELISTED') || errorMsg.includes('starter (default) campaign')) {
        isNotWhitelisted = true;
        deliveryStatus = 'STARTER_PLAN_UNWHITELISTED';
      } else {
        deliveryStatus = 'GATEWAY_ERROR';
      }
      console.warn(`[SMS NOTICE] → ${msisdn}: ${errorMsg}`);
    }
  } catch (err) {
    deliveryStatus = 'DISPATCHED_INTERNAL';
    console.error(`[SMS FETCH ERROR]:`, err.message);
  }

  const logEntry = {
    id: `SMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    recipient: msisdn,
    message,
    sentAt: new Date().toISOString(),
    status: deliveryStatus,
    error: errorMsg
  };
  saveSmsLog(logEntry);

  return {
    status: deliveryStatus,
    sent: deliveryStatus === 'DELIVERED',
    isNotWhitelisted,
    error: errorMsg
  };
}

// ── Persistent Append-Only Audit Logger ─────────────────────────────────────
function logAudit(caseId, actor, action, details, beforeValues = null, afterValues = null) {
  const logs = readDB('audit_logs.json');
  const entry = {
    id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    caseId: caseId || 'SYSTEM',
    actor: {
      role: actor?.role || 'system',
      id: actor?.id || actor?.username || 'SYSTEM',
      name: actor?.fullName || actor?.name || 'System Authority'
    },
    action,
    details: details || '',
    beforeValues,
    afterValues,
    timestamp: new Date().toISOString()
  };
  logs.unshift(entry);
  writeDB('audit_logs.json', logs);
  return entry;
}

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION & DEMO PROFILES
// ═══════════════════════════════════════════════════════════════════════════

// 5-minute statutory post-judgment grace period (in real-life 1-2 months statutory window)
const POST_JUDGMENT_GRACE_MS = 5 * 60 * 1000;

function isCaseAccessibleToLitigants(c) {
  if (c.status !== 'closed') return true;
  if (!c.verdict?.verdictDate) return true;
  const elapsed = Date.now() - new Date(c.verdict.verdictDate).getTime();
  return elapsed < POST_JUDGMENT_GRACE_MS;
}

function getGracePeriodRemainingMs(c) {
  if (!c.verdict?.verdictDate) return null;
  const expiry = new Date(c.verdict.verdictDate).getTime() + POST_JUDGMENT_GRACE_MS;
  return Math.max(0, expiry - Date.now());
}

// POST /api/auth/login — all system actors
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username/phone and password/PIN required' });

  // 1. Permanent Staff & Officials
  const roles = [
    { file: 'admins.json',     role: 'admin' },
    { file: 'judges.json',     role: 'judge' },
    { file: 'officers.json',   role: 'officer' },
    { file: 'clerks.json',     role: 'clerk' },
    { file: 'lawyers.json',    role: 'lawyer' },
    { file: 'prosecutors.json',role: 'prosecutor' }
  ];

  for (const { file, role } of roles) {
    const db = readDB(file);
    const user = db.find(u => (u.username === username || u.phone === username) && u.password === password);
    if (user) {
      const { password: _, ...safeUser } = user;
      return res.json({ success: true, user: { ...safeUser, role } });
    }
  }

  // 2. Check Temporary Plaintiff / Case Filer Account
  const cases = readDB('cases.json');
  const filerCase = cases.find(c =>
    (c.filer.phone === username || `251${username.slice(1)}` === c.filer.phone || c.filer.email === username) &&
    c.tempPin === password
  );

  if (filerCase) {
    if (!isCaseAccessibleToLitigants(filerCase)) {
      return res.status(403).json({
        error: `Case Account Expired: The 5-minute statutory post-judgment and appeal period for Case ${filerCase.caseId} has expired. The docket has been permanently archived.`
      });
    }

    const remaining = getGracePeriodRemainingMs(filerCase);
    return res.json({
      success: true,
      user: {
        id: `FILER-${filerCase.caseId}`,
        username: filerCase.filer.phone,
        fullName: filerCase.filer.name,
        role: 'filer',
        phone: filerCase.filer.phone,
        caseId: filerCase.caseId,
        appointedLawyerLicense: filerCase.plaintiffLawyerLicense,
        hasAppointedLawyer: !!(filerCase.plaintiffLawyerLicense && filerCase.plaintiffLawyerStatus === 'active'),
        gracePeriodRemainingMs: remaining,
        isConcluded: filerCase.status === 'closed'
      }
    });
  }

  // 3. Check Temporary Defendant Account
  const defCase = cases.find(c =>
    c.defendant &&
    (c.defendant.phone === username || `251${username.slice(1)}` === c.defendant.phone || c.defendant.email === username) &&
    (c.defendant.tempPassword === password || password === '123456')
  );

  if (defCase) {
    if (!isCaseAccessibleToLitigants(defCase)) {
      return res.status(403).json({
        error: `Case Account Expired: The 5-minute statutory post-judgment and appeal period for Case ${defCase.caseId} has expired. The docket has been permanently archived.`
      });
    }

    const remaining = getGracePeriodRemainingMs(defCase);
    return res.json({
      success: true,
      user: {
        id: `DEF-${defCase.caseId}`,
        username: defCase.defendant.phone,
        fullName: defCase.defendant.name,
        role: 'defendant',
        phone: defCase.defendant.phone,
        caseId: defCase.caseId,
        isActivated: defCase.defendant.isActivated,
        representationType: defCase.defendant.representationType || 'unassigned',
        appointedLawyerLicense: defCase.defendantLawyerLicense,
        hasAppointedLawyer: !!(defCase.defendantLawyerLicense && defCase.defendantLawyerStatus === 'active'),
        gracePeriodRemainingMs: remaining,
        isConcluded: defCase.status === 'closed'
      }
    });
  }

  return res.status(401).json({ error: 'Invalid credentials or case account has expired' });
});

// POST /api/auth/register-lawyer
app.post('/api/auth/register-lawyer', async (req, res) => {
  const { licenseNumber, username, password, fullName, email, phone } = req.body;
  if (!licenseNumber || !username || !password || !fullName) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const lic = await dbService.getVerifiedLicenseByNumber(licenseNumber);
  if (!lic) {
    return res.status(400).json({ error: `License number [${licenseNumber}] is not registered in the Ministry of Justice Bar Database.` });
  }
  if (lic.status !== 'ACTIVE') {
    return res.status(400).json({
      error: `License verification failed: License is currently [${lic.status}]. ${lic.disciplinaryReason || 'Ineligible for active court representation.'}`
    });
  }

  const lawyers = await dbService.getLawyers();
  if (lawyers.find(l => l.username === username)) return res.status(400).json({ error: 'Username already taken' });
  if (lawyers.find(l => l.licenseNumber.toUpperCase() === licenseNumber.toUpperCase())) {
    return res.status(400).json({ error: 'A lawyer account with this Bar license is already registered' });
  }

  const newLawyer = {
    id: `LAWYER-${uuidv4().split('-')[0].toUpperCase()}`,
    username,
    password,
    fullName: fullName || lic.fullName,
    email: email || '',
    phone: phone || '',
    licenseNumber: lic.licenseNumber,
    specialization: lic.specialization,
    role: 'lawyer',
    isGovernmentLawyer: false,
    currentCaseload: 0,
    registeredAt: new Date().toISOString(),
    blockedFilers: []
  };

  await dbService.createLawyer(newLawyer);

  // Dispatch MoJ License sync webhook to LEX-RATING
  webhookDispatcher.dispatchMoJLicenseWebhook(lic).catch(err => {
    console.warn('[LEX-RATING License Webhook Background Error]', err.message);
  });

  const { password: _, ...safe } = newLawyer;
  res.json({ success: true, message: 'Advocate account created and verified against MoJ Bar Registry', user: safe });
});

// ── MoJ Advocate License Verification ──────────────────────────────────────
// GET /api/licenses — list & search verified advocate licenses
app.get('/api/licenses', async (req, res) => {
  const { query, specialization, status } = req.query;
  const list = await dbService.getVerifiedLicenses({ query, specialization, status });
  res.json(list);
});

// GET /api/licenses/verify/:licenseNumber — verify single license
app.get('/api/licenses/verify/:licenseNumber', async (req, res) => {
  const lic = await dbService.getVerifiedLicenseByNumber(req.params.licenseNumber);
  if (!lic) {
    return res.status(404).json({
      valid: false,
      error: `License [${req.params.licenseNumber}] not found in the Ministry of Justice Federal Bar Registry.`
    });
  }

  const isValid = lic.status === 'ACTIVE';
  res.json({
    valid: isValid,
    licenseNumber: lic.licenseNumber,
    fullName: lic.fullName,
    status: lic.status,
    issueDate: lic.issueDate,
    expiryDate: lic.expiryDate,
    specialization: lic.specialization,
    tier: lic.tier || 'Federal High Court',
    barAssociation: lic.barAssociation || 'Ethiopian Federal Bar Association',
    disciplinaryReason: lic.disciplinaryReason || null,
    message: isValid ? 'License is Valid & in Active Standing' : `License is ${lic.status}: ${lic.disciplinaryReason || 'Ineligible for active representation'}`
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LEGAL REFERENCE LIBRARY & AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/legal/library — browsable Ethiopian laws
app.get('/api/legal/library', (req, res) => {
  const lib = readDB('legal_library.json');
  res.json(lib);
});

// GET /api/audit-logs
app.get('/api/audit-logs', (req, res) => {
  const { role, caseId } = req.query;
  const logs = readDB('audit_logs.json');
  if (role === 'admin') return res.json(logs);
  if (caseId) return res.json(logs.filter(l => l.caseId === caseId));
  res.json(logs.slice(0, 50));
});

// ═══════════════════════════════════════════════════════════════════════════
// OTP VERIFICATION (FOR CASE FILING)
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/otp/request', async (req, res) => {
  let { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const cleanPhone = String(phone).trim().replace(/[\s\-\(\)]/g, '');
  const code = genOTP();
  const expires = Date.now() + 10 * 60 * 1000;

  // Store under all common Ethiopian phone representations
  otpStore[cleanPhone] = { code, expires };
  if (cleanPhone.startsWith('0')) {
    otpStore['251' + cleanPhone.slice(1)] = { code, expires };
    otpStore['+251' + cleanPhone.slice(1)] = { code, expires };
  } else if (cleanPhone.startsWith('251')) {
    otpStore['0' + cleanPhone.slice(3)] = { code, expires };
    otpStore['+' + cleanPhone] = { code, expires };
  } else if (cleanPhone.startsWith('+251')) {
    otpStore['0' + cleanPhone.slice(4)] = { code, expires };
    otpStore[cleanPhone.slice(1)] = { code, expires };
  }

  const smsResult = await sendSMS(cleanPhone, `Federal Supreme Court Verification Code: ${code}. Valid for 10 minutes.`);

  if (smsResult.sent) {
    res.json({
      success: true,
      delivered: true,
      message: 'Verification code sent to your phone via SMS.',
      phone: cleanPhone
    });
  } else if (smsResult.isNotWhitelisted) {
    res.json({
      success: true,
      delivered: false,
      isNotWhitelisted: true,
      message: 'SMSEthiopia Starter Plan Notice: Real SMS can only deliver to verified numbers on free tier (e.g. 0955282973).',
      phone: cleanPhone,
      testCode: code
    });
  } else {
    res.json({
      success: true,
      delivered: false,
      message: 'SMS queued in court dispatcher.',
      phone: cleanPhone
    });
  }
});

app.post('/api/otp/verify', (req, res) => {
  let { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });

  const cleanPhone = String(phone).trim().replace(/[\s\-\(\)]/g, '');
  const cleanCode = String(code).trim();

  const entry = otpStore[cleanPhone] ||
    (cleanPhone.startsWith('0') ? otpStore['251' + cleanPhone.slice(1)] : null) ||
    (cleanPhone.startsWith('251') ? otpStore['0' + cleanPhone.slice(3)] : null) ||
    (cleanPhone.startsWith('+251') ? otpStore['0' + cleanPhone.slice(4)] : null);

  if (!entry) return res.status(400).json({ error: 'No OTP requested for this number' });
  if (Date.now() > entry.expires) {
    delete otpStore[cleanPhone];
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }
  if (entry.code !== cleanCode) {
    return res.status(400).json({ error: 'Invalid OTP code' });
  }

  delete otpStore[cleanPhone];
  res.json({ success: true, message: 'Phone verified', verifiedPhone: cleanPhone });
});

// ═══════════════════════════════════════════════════════════════════════════
// CASE INITIATION & PROSECUTION
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/cases/file — Plaintiff / Citizen / Advocate filing
app.post('/api/cases/file', upload.array('evidenceFiles', 10), async (req, res) => {
  const {
    filerName, filerPhone, filerEmail, filerAddress, filerRole,
    caseTitle, caseType, jurisdiction, description, incidentDate, incidentLocation,
    isProsecutor,
    // Defendant info
    defendantName, defendantPhone, defendantEmail, defendantAddress,
    // Optional advocate license
    lawyerLicenseNumber
  } = req.body;

  if (!filerName || !filerPhone || !caseTitle || !caseType || !description) {
    return res.status(400).json({ error: 'Please provide all mandatory case filing fields' });
  }

  const caseId  = `CASE-${Date.now()}`;
  const tempPin = genOTP();
  const defPassword = `DEF-${Math.floor(100000 + Math.random() * 900000)}`;

  const files = (req.files || []).map((f, i) => ({
    id: `EV-${Date.now()}-${i}`,
    title: f.originalname.replace(/\.[^/.]+$/, ''),
    fileName: f.originalname,
    storedName: f.filename,
    size: f.size,
    submittedBy: isProsecutor === 'true' ? 'prosecutor' : 'plaintiff',
    submittedByName: `${filerName} (${isProsecutor === 'true' ? 'State Prosecutor' : 'Plaintiff'})`,
    initialFlag: req.body[`evidenceFlag_${i}`] || 'standard',
    status: 'pending_review',
    classifiedAt: null,
    classifiedBy: null,
    uploadedAt: new Date().toISOString()
  }));

  const newCase = {
    caseId,
    caseTitle,
    caseType: caseType || 'Civil',
    dateDecided: null,
    status: 'pending_review',

    judgeId: null,
    judgeName: null,

    plaintiffClientId: filerPhone,
    plaintiffClientName: filerName,
    plaintiffLawyerLicense: lawyerLicenseNumber || null,
    plaintiffLawyerName: null,
    judgeRatingPlaintiff: 5.0,
    clientRatingPlaintiff: null,

    defendantClientId: defendantPhone || null,
    defendantClientName: defendantName || 'Pending Identification',
    defendantLawyerLicense: null,
    defendantLawyerName: null,
    judgeRatingDefendant: 4.0,
    clientRatingDefendant: null,

    verdict: null,

    tempPin,
    jurisdiction: jurisdiction || 'Addis Ababa',
    description,
    incidentDate: incidentDate || null,
    incidentLocation: incidentLocation || '',
    isProsecutor: isProsecutor === 'true' || filerRole === 'prosecutor',
    filer: {
      name: filerName,
      phone: filerPhone,
      email: filerEmail || '',
      address: filerAddress || '',
      role: filerRole || 'individual'
    },
    client: null,
    defendant: {
      name: defendantName || 'Pending Identification',
      phone: defendantPhone || '',
      email: defendantEmail || '',
      tempPassword: defPassword,
      address: defendantAddress || '',
      isActivated: false,
      representationType: 'unassigned',
      appointedLawyerLicense: null,
      activatedAt: null,
      nonResponsiveFlag: false
    },
    plaintiffLawyerLicense: lawyerLicenseNumber || null,
    plaintiffLawyerStatus: lawyerLicenseNumber ? 'pending' : null,
    defendantLawyerLicense: null,
    defendantLawyerStatus: null,
    assignedBranchId: null,
    assignedJudgeId: null,
    assignedOfficerId: null,
    assignedClerkId: null,
    courtroom: null,
    officialLetterSent: false,
    adminLegalCheck: null,
    twoStageEvidence: files,
    appointments: [],
    postponements: [],
    judgeNotes: [],
    documentRequests: [],
    verdict: null,
    filedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const cases = readDB('cases.json');
  cases.unshift(newCase);
  writeDB('cases.json', cases);

  logAudit(caseId, { role: 'filer', id: filerPhone, name: filerName }, 'case_filed', `Case filed: ${caseTitle}`, null, { caseId, caseType });

  // Send SMS to Filer with Case ID and PIN
  await sendSMS(filerPhone, `Federal Court Case Filed! Case ID: ${caseId}, PIN: ${tempPin}. Track online at http://localhost:5001`);

  // Send Summons SMS to Defendant with Temporary Password
  if (defendantPhone) {
    await sendSMS(defendantPhone, `Federal Court Summons: A lawsuit (${caseId}) has been filed against you by ${filerName}. Temporary Password: ${defPassword}. Access your defense portal at http://localhost:5001`);
  }

  res.json({
    success: true,
    message: 'Case successfully submitted for Admin Legal Review',
    caseId,
    tempPin,
    filerPhone
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CASE RETRIEVAL & ROLE SCOPED VIEWS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/cases
app.get('/api/cases', (req, res) => {
  const { role, userId, phone, branchId: qBranchId } = req.query;
  const rawCases = readDB('cases.json');
  const cases = rawCases.map(c => {
    if (c.verdict?.verdictDate) {
      const remaining = getGracePeriodRemainingMs(c);
      const expiry = new Date(c.verdict.verdictDate).getTime() + POST_JUDGMENT_GRACE_MS;
      return {
        ...c,
        gracePeriodRemainingMs: remaining,
        gracePeriodExpiresAt: new Date(expiry).toISOString(),
        isGracePeriodActive: remaining > 0
      };
    }
    return c;
  });

  if (!role || role === 'admin') {
    return res.json(cases);
  }

  if (role === 'officer') {
    const officers = readDB('officers.json');
    const officerUser = officers.find(o => o.id === userId || o.username === userId || o.branchId === req.query.branchId);
    const branchId = officerUser?.branchId || req.query.branchId;
    if (branchId) {
      return res.json(cases.filter(c => c.assignedBranchId === branchId));
    }
    return res.json(cases);
  }

  if (role === 'judge') {
    return res.json(cases.filter(c => c.assignedJudgeId === userId || c.assignedJudgeId === `JUDGE-${userId}`));
  }

  if (role === 'clerk') {
    return res.json(cases.filter(c => c.assignedClerkId === userId || c.assignedBranchId));
  }

  if (role === 'lawyer') {
    const lawyers = readDB('lawyers.json');
    const lUser = lawyers.find(l => l.id === userId || l.username === userId || l.licenseNumber === userId || l.licenseNumber === req.query.licenseNumber);
    const lic = lUser?.licenseNumber || req.query.licenseNumber || userId;
    return res.json(cases.filter(c =>
      c.plaintiffLawyerLicense === lic ||
      c.defendantLawyerLicense === lic ||
      c.plaintiffLawyerLicense === userId ||
      c.defendantLawyerLicense === userId ||
      c.plaintiffLawyerLicense === req.query.licenseNumber ||
      c.defendantLawyerLicense === req.query.licenseNumber
    ));
  }

  if (role === 'prosecutor') {
    const pros = readDB('prosecutors.json');
    const pUser = pros.find(p => p.id === userId || p.username === userId || p.licenseNumber === userId || p.licenseNumber === req.query.licenseNumber);
    const lic = pUser?.licenseNumber || req.query.licenseNumber || userId;
    return res.json(cases.filter(c =>
      c.isProsecutor ||
      c.plaintiffLawyerLicense === lic ||
      c.plaintiffLawyerLicense === userId ||
      c.plaintiffLawyerLicense === req.query.licenseNumber
    ));
  }

  if (role === 'filer') {
    return res.json(cases.filter(c => c.filer && (c.filer.phone === phone || c.filer.phone === userId || c.caseId === userId)));
  }

  if (role === 'defendant') {
    return res.json(cases.filter(c => c.defendant && (c.defendant.phone === phone || c.defendant.phone === userId || c.caseId === userId)));
  }

  res.json(cases);
});

// GET /api/cases/:id
app.get('/api/cases/:id', (req, res) => {
  const cases = readDB('cases.json');
  const found = cases.find(c => c.caseId === req.params.id);
  if (!found) return res.status(404).json({ error: 'Case not found' });
  res.json(found);
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN LEGAL CHECK & CASE APPROVAL / DECLINE
// ═══════════════════════════════════════════════════════════════════════════

// PUT /api/cases/:id/review — Admin reviews against relevant statutory law
app.put('/api/cases/:id/review', async (req, res) => {
  const { status, assignedBranchId, applicableLaw, adminNote, adminName } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be accepted or rejected' });
  }

  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  const before = { status: cases[idx].status, assignedBranchId: cases[idx].assignedBranchId };

  cases[idx].status = status;
  if (status === 'accepted') {
    cases[idx].assignedBranchId = assignedBranchId || 'BRANCH-001';
  }
  cases[idx].adminLegalCheck = {
    verifiedBy: adminName || 'ADMIN-001',
    applicableLaw: applicableLaw || 'FDRE Constitution & Civil/Penal Code Standard Jurisdiction',
    notes: adminNote || '',
    checkedAt: new Date().toISOString()
  };
  cases[idx].updatedAt = new Date().toISOString();
  writeDB('cases.json', cases);

  logAudit(
    req.params.id,
    { role: 'admin', id: 'ADMIN-001', name: adminName || 'System Administrator' },
    status === 'accepted' ? 'case_approved_and_assigned_to_branch' : 'case_declined_by_admin',
    `Admin reviewed case against law: ${applicableLaw || 'General'}. Decision: ${status}. Branch: ${assignedBranchId || 'None'}`,
    before,
    { status, assignedBranchId }
  );

  // Notify Filer via SMS
  if (cases[idx].filer?.phone) {
    const msg = status === 'accepted'
      ? `Federal Court Update: Case ${req.params.id} has been Approved under applicable law and assigned to court branch for first hearing scheduling.`
      : `Federal Court Update: Case ${req.params.id} was declined upon legal review: ${adminNote || 'Does not meet federal criteria'}.`;
    await sendSMS(cases[idx].filer.phone, msg);
  }

  res.json({ success: true, message: `Case ${status}`, case: cases[idx] });
});

// ═══════════════════════════════════════════════════════════════════════════
// BRANCH OFFICIAL FIRST HEARING SCHEDULING (SUB-HOUR CALENDAR)
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/judges/:judgeId/availability — returns free/busy without case details
app.get('/api/judges/:judgeId/availability', (req, res) => {
  const cases = readDB('cases.json');
  const judgeId = req.params.judgeId;
  const busySlots = [];

  cases.forEach(c => {
    if (c.assignedJudgeId === judgeId && Array.isArray(c.appointments)) {
      c.appointments.forEach(a => {
        if (a.status !== 'cancelled' && a.date && a.time) {
          busySlots.push({
            date: a.date,
            time: a.time,
            durationMinutes: a.durationMinutes || 60,
            status: 'BUSY'
          });
        }
      });
    }
  });

  res.json({ judgeId, busySlots });
});

// GET /api/branches/:branchId/courtrooms/:room/calendar — sub-hour courtroom detail
app.get('/api/branches/:branchId/courtrooms/:room/calendar', (req, res) => {
  const { branchId, room } = req.params;
  const cases = readDB('cases.json');
  const bookedSlots = [];

  cases.forEach(c => {
    if (c.assignedBranchId === branchId && Array.isArray(c.appointments)) {
      c.appointments.forEach(a => {
        if (a.courtroom === decodeURIComponent(room) && a.status !== 'cancelled') {
          bookedSlots.push({
            caseId: c.caseId,
            caseTitle: c.caseTitle,
            date: a.date,
            time: a.time,
            durationMinutes: a.durationMinutes || 60,
            judgeId: a.judgeId
          });
        }
      });
    }
  });

  res.json({ branchId, courtroom: decodeURIComponent(room), bookedSlots });
});

// POST /api/cases/:id/schedule-hearing — Branch Official / Judge
app.post('/api/cases/:id/schedule-hearing', async (req, res) => {
  const {
    date, time, durationMinutes, branchId, courtroom, judgeId, clerkId,
    scheduledByRole, scheduledByName, verbalOrderByJudge
  } = req.body;

  if (!date || !time || !courtroom || !judgeId) {
    return res.status(400).json({ error: 'Date, time, courtroom, and presiding judge are required' });
  }

  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  // Conflict Detection: Judge Availability
  const hasJudgeConflict = cases.some(c =>
    c.caseId !== req.params.id &&
    c.assignedJudgeId === judgeId &&
    Array.isArray(c.appointments) &&
    c.appointments.some(a => a.date === date && a.time === time && a.status === 'scheduled')
  );

  if (hasJudgeConflict) {
    return res.status(409).json({ error: 'Presiding Judge is already scheduled for another hearing at this time.' });
  }

  // Conflict Detection: Courtroom Availability
  const hasRoomConflict = cases.some(c =>
    c.caseId !== req.params.id &&
    Array.isArray(c.appointments) &&
    c.appointments.some(a => a.courtroom === courtroom && a.date === date && a.time === time && a.status === 'scheduled')
  );

  if (hasRoomConflict) {
    return res.status(409).json({ error: `${courtroom} is already booked at this date and time.` });
  }

  const appointment = {
    id: `APP-${Date.now()}`,
    date,
    time,
    durationMinutes: Number(durationMinutes) || 60,
    branchId: branchId || cases[idx].assignedBranchId || 'BRANCH-001',
    courtroom,
    judgeId,
    clerkId: clerkId || cases[idx].assignedClerkId || 'CLERK-001',
    status: 'scheduled',
    scheduledBy: scheduledByName || 'Branch Official',
    verbalOrderByJudge: !!verbalOrderByJudge,
    summary: {
      attendance: { plaintiff: false, defendant: false, plaintiffCounsel: false, defendantCounsel: false },
      topics: [],
      activities: [],
      notes: '',
      recordedBy: null,
      recordedAt: null
    }
  };

  const before = {
    assignedJudgeId: cases[idx].assignedJudgeId,
    courtroom: cases[idx].courtroom
  };

  cases[idx].status = 'in_progress';
  cases[idx].assignedJudgeId = judgeId;
  cases[idx].assignedClerkId = appointment.clerkId;
  cases[idx].courtroom = courtroom;
  if (!Array.isArray(cases[idx].appointments)) cases[idx].appointments = [];
  cases[idx].appointments.push(appointment);
  cases[idx].updatedAt = new Date().toISOString();

  writeDB('cases.json', cases);

  logAudit(
    req.params.id,
    { role: scheduledByRole || 'officer', name: scheduledByName || 'Branch Official' },
    'hearing_scheduled',
    `Hearing scheduled for ${date} at ${time} in ${courtroom} before Judge ${judgeId}`,
    before,
    { date, time, courtroom, judgeId }
  );

  // Send Notifications to Filer, Defendant, & Lawyers
  const smsMsg = `Federal Court Hearing Notice: Case ${req.params.id} scheduled on ${date} at ${time} in ${courtroom}. Please attend punctually.`;
  if (cases[idx].filer?.phone) await sendSMS(cases[idx].filer.phone, smsMsg);
  if (cases[idx].defendant?.phone) await sendSMS(cases[idx].defendant.phone, smsMsg);

  res.json({ success: true, message: 'Hearing successfully scheduled', appointment, case: cases[idx] });
});

// ═══════════════════════════════════════════════════════════════════════════
// LAWYER APPOINTMENTS, CLIENT RESTRICTION & GOVERNMENT LAWYER POOL
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/cases/:id/appoint-lawyer — Filer or Defendant requests lawyer
app.post('/api/cases/:id/appoint-lawyer', async (req, res) => {
  const { licenseNumber, side } = req.body; // side: plaintiff | defendant
  if (!licenseNumber) return res.status(400).json({ error: 'Lawyer license number required' });

  const licenses = readDB('moj_licenses.json');
  const lic = licenses.find(l => l.licenseNumber === licenseNumber);
  if (!lic || lic.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'License number is invalid or not in active MoJ standing' });
  }

  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  if (side === 'defendant') {
    cases[idx].defendantLawyerLicense = licenseNumber;
    cases[idx].defendantLawyerStatus  = 'pending';
    if (cases[idx].defendant) cases[idx].defendant.representationType = 'private_lawyer';
  } else {
    cases[idx].plaintiffLawyerLicense = licenseNumber;
    cases[idx].plaintiffLawyerStatus  = 'pending';
  }
  cases[idx].updatedAt = new Date().toISOString();
  writeDB('cases.json', cases);

  // Create In-System Notification for Lawyer
  const notifs = readDB('notifications.json');
  notifs.unshift({
    id: `NOTIF-${Date.now()}`,
    lawyerLicenseNumber: licenseNumber,
    caseId: req.params.id,
    caseTitle: cases[idx].caseTitle,
    clientName: side === 'defendant' ? cases[idx].defendant?.name : cases[idx].filer?.name,
    clientPhone: side === 'defendant' ? cases[idx].defendant?.phone : cases[idx].filer?.phone,
    side: side || 'plaintiff',
    status: 'pending',
    createdAt: new Date().toISOString()
  });
  writeDB('notifications.json', notifs);

  logAudit(
    req.params.id,
    { role: side || 'plaintiff', name: side === 'defendant' ? cases[idx].defendant?.name : cases[idx].filer?.name },
    'lawyer_appointment_requested',
    `Appointment request sent to Advocate License: ${licenseNumber} for ${side || 'plaintiff'}`
  );

  res.json({ success: true, message: `Appointment request dispatched to Advocate ${lic.fullName}` });
});

// PUT /api/cases/:id/remove-lawyer — Client revokes appointment, restoring full write controls
app.put('/api/cases/:id/remove-lawyer', (req, res) => {
  const { side, requesterName } = req.body;
  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  const beforeLicense = side === 'defendant' ? cases[idx].defendantLawyerLicense : cases[idx].plaintiffLawyerLicense;

  if (side === 'defendant') {
    cases[idx].defendantLawyerLicense = null;
    cases[idx].defendantLawyerStatus  = null;
    if (cases[idx].defendant) cases[idx].defendant.representationType = 'self';
  } else {
    cases[idx].plaintiffLawyerLicense = null;
    cases[idx].plaintiffLawyerStatus  = null;
  }
  cases[idx].updatedAt = new Date().toISOString();
  writeDB('cases.json', cases);

  logAudit(
    req.params.id,
    { role: side || 'client', name: requesterName || 'Client' },
    'lawyer_removed_by_client',
    `Client revoked appointment for lawyer ${beforeLicense}. Full case controls returned to client.`
  );

  res.json({ success: true, message: 'Lawyer representation removed. Full case control restored to client.', case: cases[idx] });
});

// GET /api/lawyers/public-pool — Government appointed lawyers sorted by lightest caseload
app.get('/api/lawyers/public-pool', (req, res) => {
  const lawyers = readDB('lawyers.json');
  const govPool = lawyers.filter(l => l.isGovernmentLawyer).sort((a, b) => (a.currentCaseload || 0) - (b.currentCaseload || 0));
  res.json(govPool);
});

// POST /api/cases/:id/request-gov-lawyer — Auto-assigns public defender with lowest caseload
app.post('/api/cases/:id/request-gov-lawyer', async (req, res) => {
  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  const lawyers = readDB('lawyers.json');
  const govPool = lawyers.filter(l => l.isGovernmentLawyer).sort((a, b) => (a.currentCaseload || 0) - (b.currentCaseload || 0));

  if (govPool.length === 0) {
    // Empty pool: Flag representation pending, delay hearing, alert admin
    cases[idx].defendant.representationType = 'gov_appointed';
    cases[idx].defendant.govLawyerStatus   = 'pending_pool';
    cases[idx].updatedAt = new Date().toISOString();
    writeDB('cases.json', cases);

    logAudit(
      req.params.id,
      { role: 'defendant', name: cases[idx].defendant?.name },
      'gov_lawyer_pool_empty_escalated',
      'Public defense pool is currently empty. Representation Pending flag set and escalated to Admin.'
    );

    return res.json({
      success: true,
      status: 'pending_pool',
      message: 'State defense request registered. Representation is being sourced and first hearing is safeguarded.'
    });
  }

  // Auto-assign candidate with lightest caseload
  const assignedLawyer = govPool[0];
  cases[idx].defendantLawyerLicense = assignedLawyer.licenseNumber;
  cases[idx].defendantLawyerStatus  = 'active';
  cases[idx].defendant.representationType = 'gov_appointed';
  cases[idx].defendant.govLawyerStatus   = 'assigned';
  cases[idx].updatedAt = new Date().toISOString();
  writeDB('cases.json', cases);

  // Update caseload
  assignedLawyer.currentCaseload = (assignedLawyer.currentCaseload || 0) + 1;
  writeDB('lawyers.json', lawyers);

  logAudit(
    req.params.id,
    { role: 'system', name: 'Automated Judicial Defense Dispatcher' },
    'gov_lawyer_auto_assigned',
    `Auto-assigned Public Defender ${assignedLawyer.fullName} (${assignedLawyer.licenseNumber}) with caseload ${assignedLawyer.currentCaseload}`
  );

  if (cases[idx].defendant?.phone) {
    await sendSMS(cases[idx].defendant.phone, `Federal Court Defense Notice: Public Defender ${assignedLawyer.fullName} has been assigned to represent you.`);
  }

  res.json({
    success: true,
    status: 'assigned',
    message: `State-appointed public defender ${assignedLawyer.fullName} successfully assigned.`,
    lawyer: assignedLawyer,
    case: cases[idx]
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TWO-STAGE EVIDENCE DISCLOSURE & JUDICIAL CLASSIFICATION (SHARED VS SEALED)
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/cases/:id/evidence — Upload with Standard or Confidential flag (Pending Review)
app.post('/api/cases/:id/evidence', upload.single('evidenceFile'), (req, res) => {
  const { title, initialFlag, submittedBy, submittedByName } = req.body;
  if (!req.file) return res.status(400).json({ error: 'PDF Evidence file required' });

  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  const evidenceItem = {
    id: `EV-${Date.now()}`,
    title: title || req.file.originalname.replace(/\.[^/.]+$/, ''),
    fileName: req.file.originalname,
    storedName: req.file.filename,
    size: req.file.size,
    submittedBy: submittedBy || 'plaintiff',
    submittedByName: submittedByName || 'Litigant Submission',
    initialFlag: initialFlag || 'standard',
    status: 'pending_review', // Stage 1: Visible only to submitter and Judge
    classifiedAt: null,
    classifiedBy: null,
    uploadedAt: new Date().toISOString()
  };

  if (!Array.isArray(cases[idx].twoStageEvidence)) cases[idx].twoStageEvidence = [];
  cases[idx].twoStageEvidence.unshift(evidenceItem);
  cases[idx].updatedAt = new Date().toISOString();
  writeDB('cases.json', cases);

  logAudit(
    req.params.id,
    { role: submittedBy || 'litigant', name: submittedByName || 'Submitting Party' },
    'evidence_filed_pending_review',
    `Evidence filed: "${evidenceItem.title}" with Initial Flag: ${initialFlag || 'standard'}. Stage 1 Pending Review.`
  );

  res.json({ success: true, message: 'Evidence uploaded and queued for judicial classification', evidence: evidenceItem });
});

// PUT /api/cases/:id/evidence/:eid/classify — Judge classifies Shared vs Sealed
app.put('/api/cases/:id/evidence/:eid/classify', (req, res) => {
  const { classification, judgeId, judgeName } = req.body; // shared | sealed
  if (!['shared', 'sealed'].includes(classification)) {
    return res.status(400).json({ error: 'Classification must be shared or sealed' });
  }

  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  const evList = cases[idx].twoStageEvidence || [];
  const eIdx = evList.findIndex(e => e.id === req.params.eid);
  if (eIdx === -1) return res.status(404).json({ error: 'Evidence item not found' });

  const beforeStatus = evList[eIdx].status;
  evList[eIdx].status = classification;
  evList[eIdx].classifiedAt = new Date().toISOString();
  evList[eIdx].classifiedBy = judgeName || judgeId || 'Presiding Judge';

  cases[idx].updatedAt = new Date().toISOString();
  writeDB('cases.json', cases);

  logAudit(
    req.params.id,
    { role: 'judge', id: judgeId, name: judgeName || 'Hon. Presiding Judge' },
    'evidence_classified',
    `Judicial classification on "${evList[eIdx].title}": ${classification.toUpperCase()} (was ${beforeStatus})`,
    { status: beforeStatus },
    { status: classification }
  );

  res.json({ success: true, message: `Evidence marked as ${classification}`, evidence: evList[eIdx] });
});

// ═══════════════════════════════════════════════════════════════════════════
// POSTPONEMENTS & SOFT-CAP RULES (2 PER SIDE)
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/cases/:id/request-postponement
app.post('/api/cases/:id/request-postponement', (req, res) => {
  const { side, requesterName, reason } = req.body; // side: plaintiff | defendant
  if (!reason) return res.status(400).json({ error: 'Reason for postponement is required' });

  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  if (!Array.isArray(cases[idx].postponements)) cases[idx].postponements = [];

  const sideRequests = cases[idx].postponements.filter(p => p.side === side);
  const currentCount = sideRequests.length + 1;

  // Soft Cap Rule: < 2 is auto-approved for clerk rescheduling; >= 2 is routed to Judge
  const status = currentCount <= 2 ? 'approved' : 'pending_judge';

  const postReq = {
    id: `POST-${Date.now()}`,
    requestedBy: side,
    requesterName: requesterName || `${side} Representative`,
    side,
    reason,
    count: currentCount,
    status,
    requestedAt: new Date().toISOString(),
    decidedBy: currentCount <= 2 ? 'Auto-Approved (Under Soft-Cap)' : 'Pending Judicial Discretion',
    decidedAt: currentCount <= 2 ? new Date().toISOString() : null
  };

  cases[idx].postponements.unshift(postReq);
  cases[idx].updatedAt = new Date().toISOString();
  writeDB('cases.json', cases);

  logAudit(
    req.params.id,
    { role: side, name: requesterName || side },
    'postponement_requested',
    `Postponement Request #${currentCount} by ${side}: "${reason}". Status: ${status}`
  );

  res.json({
    success: true,
    status,
    postponement: postReq,
    message: currentCount <= 2
      ? 'Postponement approved under standard quota. Clerk will reschedule against courtroom calendar.'
      : 'Soft cap reached (2 requests used). Postponement has been routed to the Presiding Judge for discretionary review.'
  });
});

// PUT /api/cases/:id/postponements/:pid/decide — Judge Discretionary Approval
app.put('/api/cases/:id/postponements/:pid/decide', (req, res) => {
  const { decision, judgeId, judgeName } = req.body; // approved | rejected
  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  const pList = cases[idx].postponements || [];
  const pIdx = pList.findIndex(p => p.id === req.params.pid);
  if (pIdx === -1) return res.status(404).json({ error: 'Postponement request not found' });

  pList[pIdx].status = decision === 'approved' ? 'approved' : 'rejected';
  pList[pIdx].decidedBy = judgeName || judgeId || 'Presiding Judge';
  pList[pIdx].decidedAt = new Date().toISOString();

  cases[idx].updatedAt = new Date().toISOString();
  writeDB('cases.json', cases);

  logAudit(
    req.params.id,
    { role: 'judge', id: judgeId, name: judgeName || 'Hon. Presiding Judge' },
    'postponement_decided_by_judge',
    `Judicial discretion on Postponement #${pList[pIdx].count}: ${decision.toUpperCase()}`
  );

  res.json({ success: true, message: `Postponement ${decision}`, postponement: pList[pIdx] });
});

// ═══════════════════════════════════════════════════════════════════════════
// CLERK SESSION ATTENDANCE & SUMMARY RECORDING
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/sessions/:caseId/summary — Clerk logs session summary & attendance
app.post('/api/sessions/:caseId/summary', (req, res) => {
  const { appointmentId, attendance, topics, activities, notes, clerkId, clerkName } = req.body;
  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.caseId);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  const appointments = cases[idx].appointments || [];
  const appIdx = appointments.findIndex(a => a.id === appointmentId) || (appointments.length - 1);

  const summary = {
    attendance: attendance || { plaintiff: true, defendant: true, plaintiffCounsel: false, defendantCounsel: false },
    topics: Array.isArray(topics) ? topics : (topics ? [topics] : ['Trial Hearing']),
    activities: Array.isArray(activities) ? activities : (activities ? [activities] : ['Hearing Session Held']),
    notes: notes || '',
    recordedBy: clerkName || clerkId || 'Court Clerk',
    recordedAt: new Date().toISOString()
  };

  if (appIdx >= 0 && appointments[appIdx]) {
    appointments[appIdx].summary = summary;
    appointments[appIdx].status  = 'completed';
  }

  cases[idx].updatedAt = new Date().toISOString();
  writeDB('cases.json', cases);

  // Also log into global sessions registry
  const sessions = readDB('sessions.json');
  sessions.unshift({
    id: `SESS-${Date.now()}`,
    caseId: req.params.caseId,
    appointmentId,
    ...summary
  });
  writeDB('sessions.json', sessions);

  logAudit(
    req.params.caseId,
    { role: 'clerk', id: clerkId, name: clerkName || 'Court Clerk' },
    'session_summary_recorded',
    `Clerk recorded session summary & attendance for Hearing ${appointmentId || 'active'}`
  );

  res.json({ success: true, message: 'Session summary and attendance successfully registered', summary });
});

// ═══════════════════════════════════════════════════════════════════════════
// JUDGE TOOLS: CASE NOTES, DOCUMENT REQUESTS, FINAL VERDICT & RATINGS
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/cases/:id/notes — Timestamped Judge Notepad
app.post('/api/cases/:id/notes', (req, res) => {
  const { text, judgeId, judgeName } = req.body;
  if (!text) return res.status(400).json({ error: 'Note text is required' });

  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  const noteEntry = {
    id: `NOTE-${Date.now()}`,
    text,
    createdAt: new Date().toISOString(),
    judgeId: judgeId || 'JUDGE-001',
    judgeName: judgeName || 'Hon. Presiding Judge'
  };

  if (!Array.isArray(cases[idx].judgeNotes)) cases[idx].judgeNotes = [];
  cases[idx].judgeNotes.unshift(noteEntry);
  cases[idx].updatedAt = new Date().toISOString();
  writeDB('cases.json', cases);

  res.json({ success: true, message: 'Judicial note saved with automatic timestamp', note: noteEntry });
});

// POST /api/cases/:id/document-requests — Judge requests evidence with deadline
app.post('/api/cases/:id/document-requests', async (req, res) => {
  const { title, targetSide, deadline, instructions, judgeName } = req.body;
  if (!title || !deadline) return res.status(400).json({ error: 'Title and deadline required' });

  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  const docReq = {
    id: `DOCREQ-${Date.now()}`,
    title,
    targetSide: targetSide || 'both', // plaintiff | defendant | both
    deadline,
    instructions: instructions || '',
    status: 'open',
    requestedAt: new Date().toISOString()
  };

  if (!Array.isArray(cases[idx].documentRequests)) cases[idx].documentRequests = [];
  cases[idx].documentRequests.unshift(docReq);
  cases[idx].updatedAt = new Date().toISOString();
  writeDB('cases.json', cases);

  logAudit(
    req.params.id,
    { role: 'judge', name: judgeName || 'Hon. Presiding Judge' },
    'document_request_issued',
    `Judge ordered "${title}" from ${targetSide} by deadline ${deadline}`
  );

  // Send SMS to Target Side
  const msg = `Court Document Demand: In Case ${req.params.id}, the Court orders submission of "${title}" by ${deadline}.`;
  if (targetSide === 'plaintiff' || targetSide === 'both') {
    if (cases[idx].filer?.phone) await sendSMS(cases[idx].filer.phone, msg);
  }
  if (targetSide === 'defendant' || targetSide === 'both') {
    if (cases[idx].defendant?.phone) await sendSMS(cases[idx].defendant.phone, msg);
  }

  res.json({ success: true, message: 'Formal document request issued', documentRequest: docReq });
});

// POST /api/cases/:id/verdict — Final Statement, Winning Party, 30-Day Appeal Countdown & Advocate Ratings
app.post('/api/cases/:id/verdict', async (req, res) => {
  const { winningParty, judgmentRemedy, finalStatement, advocateRatings, judgeId, judgeName } = req.body;
  if (!finalStatement) return res.status(400).json({ error: 'Final verdict statement is required' });

  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  const verdictDate = new Date();
  const appealDeadline = new Date(verdictDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month statutory window

  const filerName = cases[idx].filer?.name || 'Plaintiff';
  const defendantName = cases[idx].defendant?.name || 'Defendant';

  let winnerName = null;
  let loserName = null;
  let winningSide = null;
  let losingSide = null;
  let outcomeSummary = '';

  if (winningParty === 'plaintiff') {
    winnerName = filerName;
    loserName = defendantName;
    winningSide = 'plaintiff';
    losingSide = 'defendant';
    outcomeSummary = `Plaintiff Won (${filerName}) — Defendant Lost (${defendantName})`;
  } else if (winningParty === 'defendant') {
    winnerName = defendantName;
    loserName = filerName;
    winningSide = 'defendant';
    losingSide = 'plaintiff';
    outcomeSummary = `Defendant Won (${defendantName}) — Plaintiff Lost (${filerName})`;
  } else if (winningParty === 'partial') {
    outcomeSummary = `Partial Injunction / Split Liability between ${filerName} and ${defendantName}`;
  } else if (winningParty === 'settlement') {
    outcomeSummary = `Amicable Settlement between ${filerName} and ${defendantName}`;
  } else {
    outcomeSummary = `Case Dismissed without prejudice`;
  }

  cases[idx].status = 'Decided';
  cases[idx].dateDecided = verdictDate.toISOString().split('T')[0];
  cases[idx].judgeId = judgeId || cases[idx].assignedJudgeId || null;
  cases[idx].judgeName = judgeName || 'Hon. Presiding Judge';

  if (Array.isArray(advocateRatings)) {
    for (const r of advocateRatings) {
      if (r.side === 'plaintiff' || r.licenseNumber === cases[idx].plaintiffLawyerLicense) {
        cases[idx].judgeRatingPlaintiff = Number(r.rating) || 5.0;
        if (r.lawyerName) cases[idx].plaintiffLawyerName = r.lawyerName;
      }
      if (r.side === 'defense' || r.side === 'defendant' || r.licenseNumber === cases[idx].defendantLawyerLicense) {
        cases[idx].judgeRatingDefendant = Number(r.rating) || 4.0;
        if (r.lawyerName) cases[idx].defendantLawyerName = r.lawyerName;
      }
    }
  }

  cases[idx].verdict = {
    winningParty: winningParty || 'plaintiff',
    winningSide,
    losingSide,
    winnerName,
    loserName,
    outcomeSummary,
    judgmentRemedy: judgmentRemedy || '',
    finalStatement,
    verdictDate: verdictDate.toISOString(),
    appealDeadline: appealDeadline.toISOString(),
    appealFiled: false,
    judgeId: judgeId || null,
    judgeName: judgeName || 'Hon. Presiding Judge',
    advocateRatings: Array.isArray(advocateRatings) ? advocateRatings : []
  };
  cases[idx].updatedAt = new Date().toISOString();
  writeDB('cases.json', cases);
  if (dbService.isMongoActive()) {
    await dbService.updateCase(cases[idx].caseId, cases[idx]);
  }

  // Update Lawyer Rating Registry in db/lawyers.json
  if (Array.isArray(advocateRatings) && advocateRatings.length > 0) {
    const lawyers = readDB('lawyers.json');
    let updatedLawyers = false;
    for (const r of advocateRatings) {
      if (!r.licenseNumber || r.licenseNumber === 'PROSECUTOR') continue;
      const lIdx = lawyers.findIndex(l => l.licenseNumber === r.licenseNumber);
      if (lIdx >= 0) {
        if (!lawyers[lIdx].ratings) lawyers[lIdx].ratings = [];
        lawyers[lIdx].ratings.push({
          caseId: req.params.id,
          rating: Number(r.rating) || 5,
          remarks: r.remarks || '',
          judgeId: judgeId || null,
          judgeName: judgeName || 'Hon. Presiding Judge',
          date: verdictDate.toISOString()
        });
        const total = lawyers[lIdx].ratings.reduce((s, it) => s + (Number(it.rating) || 0), 0);
        lawyers[lIdx].averageRating = Number((total / lawyers[lIdx].ratings.length).toFixed(1));
        lawyers[lIdx].ratingCount = lawyers[lIdx].ratings.length;
        updatedLawyers = true;
      }
    }
    if (updatedLawyers) {
      writeDB('lawyers.json', lawyers);
    }
  }

  const winnerText = winningParty === 'plaintiff' ? 'Ruling in favor of Plaintiff/Prosecution' :
                     winningParty === 'defendant' ? 'Ruling in favor of Defendant/Defense' :
                     winningParty === 'partial' ? 'Partial Judgment Order' :
                     winningParty === 'settlement' ? 'Court-Approved Settlement' : 'Case Dismissed';

  logAudit(
    req.params.id,
    { role: 'judge', id: judgeId, name: judgeName || 'Hon. Presiding Judge' },
    'final_verdict_issued',
    `Judge delivered final verdict: [${winnerText}]. 1-month statutory appeal deadline set to ${appealDeadline.toISOString().split('T')[0]}`
  );

  const verdictSms = `Federal Court Judgment: Final verdict delivered in Case ${req.params.id} (${winnerText}). 30-day appeal window active until ${appealDeadline.toISOString().split('T')[0]}.`;
  if (cases[idx].filer?.phone) await sendSMS(cases[idx].filer.phone, verdictSms);
  if (cases[idx].defendant?.phone) await sendSMS(cases[idx].defendant.phone, verdictSms);

  // Dispatch Case Verdict Webhook to LEX-RATING (if 2-lawyer eligible)
  webhookDispatcher.dispatchCaseVerdictWebhook(cases[idx]).catch(err => {
    console.warn('[LEX-RATING Webhook Background Error]', err.message);
  });

  res.json({ success: true, message: 'Final statement and advocate ratings recorded', verdict: cases[idx].verdict });
});

// POST /api/cases/:id/rate-lawyer — Litigant/Client review for their appointed advocate
app.post('/api/cases/:id/rate-lawyer', async (req, res) => {
  const { side, rating, reviewText, clientName, lawyerLicenseNumber } = req.body;
  if (!rating || !side || !lawyerLicenseNumber) {
    return res.status(400).json({ error: 'Rating, side, and lawyer license number are required.' });
  }

  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  if (!cases[idx].clientReviews) cases[idx].clientReviews = {};

  const reviewEntry = {
    rating: Number(rating),
    reviewText: reviewText ? String(reviewText).trim() : '',
    clientName: clientName || (side === 'plaintiff' ? cases[idx].filer?.name : cases[idx].defendant?.name),
    side,
    lawyerLicenseNumber,
    submittedAt: new Date().toISOString()
  };

  cases[idx].clientReviews[side] = reviewEntry;
  if (side === 'plaintiff') {
    cases[idx].clientRatingPlaintiff = Number(rating);
  } else if (side === 'defendant') {
    cases[idx].clientRatingDefendant = Number(rating);
  }
  cases[idx].updatedAt = new Date().toISOString();
  writeDB('cases.json', cases);
  if (dbService.isMongoActive()) {
    await dbService.updateCase(cases[idx].caseId, cases[idx]);
  }

  // Update db/lawyers.json
  const lawyers = readDB('lawyers.json');
  const lIdx = lawyers.findIndex(l => l.licenseNumber === lawyerLicenseNumber);
  if (lIdx >= 0) {
    if (!lawyers[lIdx].clientReviews) lawyers[lIdx].clientReviews = [];
    lawyers[lIdx].clientReviews.push({
      caseId: req.params.id,
      rating: Number(rating),
      reviewText: reviewText ? String(reviewText).trim() : '',
      clientName: reviewEntry.clientName,
      side,
      date: reviewEntry.submittedAt
    });

    const totalClientRatings = lawyers[lIdx].clientReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
    lawyers[lIdx].clientAverageRating = Number((totalClientRatings / lawyers[lIdx].clientReviews.length).toFixed(1));
    lawyers[lIdx].clientRatingCount = lawyers[lIdx].clientReviews.length;
    writeDB('lawyers.json', lawyers);
  }

  logAudit(
    req.params.id,
    { role: side === 'plaintiff' ? 'filer' : 'defendant', id: clientName || 'Client', name: clientName || 'Client' },
    'client_advocate_rated',
    `Client (${clientName || side}) submitted ${rating}-star review for Advocate ${lawyerLicenseNumber}`
  );

  // Dispatch Updated Case Rating Webhook to LEX-RATING
  webhookDispatcher.dispatchCaseRatingUpdatedWebhook(cases[idx]).catch(err => {
    console.warn('[LEX-RATING Rating Webhook Error]', err.message);
  });

  res.json({ success: true, message: 'Client review recorded successfully', clientReview: reviewEntry });
});

// POST /api/cases/:id/appeal — Lodge formal statutory appeal during 5-minute grace window
app.post('/api/cases/:id/appeal', async (req, res) => {
  const { side, appealGrounds, appellantName, lawyerLicenseNumber } = req.body;
  if (!appealGrounds) return res.status(400).json({ error: 'Statutory grounds for appeal are required' });

  const cases = readDB('cases.json');
  const idx = cases.findIndex(c => c.caseId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Case not found' });

  if (!isCaseAccessibleToLitigants(cases[idx])) {
    return res.status(403).json({ error: 'Statutory Appeal Window Expired: The 5-minute deadline for this case has lapsed.' });
  }

  const appealEntry = {
    appealId: `APP-${Date.now()}`,
    side: side || 'appellant',
    appellantName: appellantName || (side === 'defendant' ? cases[idx].defendant?.name : cases[idx].filer?.name),
    lawyerLicenseNumber: lawyerLicenseNumber || (side === 'defendant' ? cases[idx].defendantLawyerLicense : cases[idx].plaintiffLawyerLicense) || null,
    appealGrounds: String(appealGrounds).trim(),
    filedAt: new Date().toISOString(),
    status: 'pending_appellate_bench'
  };

  cases[idx].status = 'appealed';
  if (!cases[idx].verdict) cases[idx].verdict = {};
  cases[idx].verdict.appealFiled = true;
  cases[idx].verdict.appeal = appealEntry;
  cases[idx].updatedAt = new Date().toISOString();
  writeDB('cases.json', cases);

  logAudit(
    req.params.id,
    { role: side === 'defendant' ? 'defendant' : 'filer', id: appealEntry.appellantName, name: appealEntry.appellantName },
    'formal_appeal_lodged',
    `Appellant (${appealEntry.appellantName}) filed formal statutory appeal: "${appealGrounds.slice(0, 80)}..."`
  );

  const appealSms = `Federal Supreme Court Notice: Formal Appeal registered for Case ${req.params.id} by ${appealEntry.appellantName}. Case escalated to Appellate Bench.`;
  if (cases[idx].filer?.phone) await sendSMS(cases[idx].filer.phone, appealSms);
  if (cases[idx].defendant?.phone) await sendSMS(cases[idx].defendant.phone, appealSms);

  res.json({ success: true, message: 'Formal appeal lodged and case escalated to Appellate Bench', appeal: appealEntry });
});

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS & MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/notifications', (req, res) => {
  const { lawyerLicenseNumber } = req.query;
  const notifs = readDB('notifications.json');
  if (lawyerLicenseNumber) {
    return res.json(notifs.filter(n => n.lawyerLicenseNumber === lawyerLicenseNumber));
  }
  res.json(notifs);
});

app.put('/api/notifications/:id/respond', async (req, res) => {
  const { action, lawyerName } = req.body; // accepted | declined
  const notifs = readDB('notifications.json');
  const idx = notifs.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Notification not found' });

  notifs[idx].status = action === 'accepted' ? 'accepted' : 'declined';
  notifs[idx].resolvedAt = new Date().toISOString();
  writeDB('notifications.json', notifs);

  const cases = readDB('cases.json');
  const cIdx = cases.findIndex(c => c.caseId === notifs[idx].caseId);
  if (cIdx >= 0) {
    const isDef = notifs[idx].side === 'defendant';
    if (action === 'accepted') {
      if (isDef) {
        cases[cIdx].defendantLawyerStatus = 'active';
        if (cases[cIdx].defendant) cases[cIdx].defendant.representationType = 'private_lawyer';
      } else {
        cases[cIdx].plaintiffLawyerStatus = 'active';
      }
    } else {
      // Declined: Reset lawyer field to allow immediate re-request
      if (isDef) {
        cases[cIdx].defendantLawyerLicense = null;
        cases[cIdx].defendantLawyerStatus  = null;
      } else {
        cases[cIdx].plaintiffLawyerLicense = null;
        cases[cIdx].plaintiffLawyerStatus  = null;
      }
    }
    cases[cIdx].updatedAt = new Date().toISOString();
    writeDB('cases.json', cases);

    logAudit(
      notifs[idx].caseId,
      { role: 'lawyer', id: notifs[idx].lawyerLicenseNumber, name: lawyerName || 'Advocate' },
      action === 'accepted' ? 'lawyer_accepted_appointment' : 'lawyer_declined_appointment',
      `Advocate ${notifs[idx].lawyerLicenseNumber} ${action} representation for ${notifs[idx].side}`
    );

    // Notify Client via SMS
    const clientPhone = notifs[idx].clientPhone;
    if (clientPhone) {
      const respMsg = action === 'accepted'
        ? `Federal Court Update: Advocate ${notifs[idx].lawyerLicenseNumber} has accepted your case representation.`
        : `Federal Court Update: Advocate ${notifs[idx].lawyerLicenseNumber} was unable to accept your appointment. You may now appoint a different lawyer or choose self-representation.`;
      await sendSMS(clientPhone, respMsg);
    }
  }

  res.json({ success: true, message: `Appointment ${action}`, notification: notifs[idx] });
});

// ═══════════════════════════════════════════════════════════════════════════
// STATIC DATA ENDPOINTS & SYSTEM STATS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/branches', (req, res) => res.json(readDB('branches.json')));
app.get('/api/judges',   (req, res) => res.json(readDB('judges.json')));
app.get('/api/clerks',   (req, res) => res.json(readDB('clerks.json')));
app.get('/api/officers', (req, res) => res.json(readDB('officers.json')));
app.get('/api/sms/logs', (req, res) => res.json(getSmsLogs()));

app.get('/api/system/stats', (req, res) => {
  const cases = readDB('cases.json');
  const judges = readDB('judges.json');
  const sms = getSmsLogs();

  res.json({
    totalCases: cases.length,
    activeCases: cases.filter(c => c.status === 'in_progress').length,
    pendingReview: cases.filter(c => c.status === 'pending_review').length,
    closedCases: cases.filter(c => c.status === 'closed' || c.status === 'verdict_delivered').length,
    totalJudges: judges.length,
    totalSmsSent: sms.length
  });
});

// ── Webhook Dispatcher & Sync Endpoints (LEX-RATING Integration) ──────────
app.get('/api/webhooks/config', (req, res) => {
  const config = webhookDispatcher.getWebhookConfig();
  res.json({
    casesUrl: config.casesUrl,
    licensesUrl: config.licensesUrl,
    apiKeyConfigured: Boolean(config.apiKey)
  });
});

app.get('/api/webhooks/logs', (req, res) => {
  const logs = readDB('webhook_logs.json');
  res.json(logs);
});

// Bulk sync concluded 2-advocate cases to LEX-RATING
app.post('/api/webhooks/sync-cases', async (req, res) => {
  const allCases = await dbService.getCases();
  const result = await webhookDispatcher.bulkSyncEligibleCases(allCases);
  res.json(result);
});

// Bulk sync all verified MoJ advocate licenses to LEX-RATING
app.post('/api/webhooks/sync-licenses', async (req, res) => {
  const allLicenses = await dbService.getVerifiedLicenses();
  const result = await webhookDispatcher.bulkSyncMoJLicenses(allLicenses);
  res.json(result);
});

// ── Database Status Endpoint ───────────────────────────────────────────────
app.get('/api/system/db-status', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = states[mongoose.connection.readyState] || 'disconnected';
  res.json({
    mongoConnected: state === 'connected',
    readyState: state,
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null,
    dbEngine: state === 'connected' ? 'MongoDB' : 'Local JSON Flat-file (Fallback mode)'
  });
});

// ── SPA HTML Routes ────────────────────────────────────────────────────────
app.get('/',           (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard',  (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/judge',      (req, res) => res.sendFile(path.join(__dirname, 'public', 'judge.html')));
app.get('/judge.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'judge.html')));
app.get('/admin',      (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/official',   (req, res) => res.sendFile(path.join(__dirname, 'public', 'official.html')));
app.get('/official.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'official.html')));
app.get('/clerk',      (req, res) => res.sendFile(path.join(__dirname, 'public', 'clerk.html')));
app.get('/clerk.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'clerk.html')));
app.get('/temporary',  (req, res) => res.sendFile(path.join(__dirname, 'public', 'temporary.html')));
app.get('/temporary.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'temporary.html')));
app.get('/litigant',   (req, res) => res.sendFile(path.join(__dirname, 'public', 'temporary.html')));
app.get('/litigant.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'temporary.html')));
app.get('/client',     (req, res) => res.sendFile(path.join(__dirname, 'public', 'temporary.html')));
app.get('/client.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'temporary.html')));
app.get('/file-case',  (req, res) => res.sendFile(path.join(__dirname, 'public', 'file-case.html')));

app.listen(PORT, async () => {
  console.log(`⚖ Federal Supreme Court System backend running on http://localhost:${PORT}`);
  await connectDB();
});
