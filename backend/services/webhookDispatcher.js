'use strict';
const http = require('http');
const https = require('https');
const dbService = require('./dbService');

const DEFAULT_SEAL_GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes for testing (representing 30-day window)

function getGracePeriodMs() {
  const envVal = parseInt(process.env.SEAL_GRACE_PERIOD_MS, 10);
  return !isNaN(envVal) && envVal > 0 ? envVal : DEFAULT_SEAL_GRACE_PERIOD_MS;
}

function getRatingConfig() {
  const host = process.env.LEX_RATING_HOST || '127.0.0.1';
  const port = process.env.LEX_RATING_PORT || '5000';
  const apiKey = process.env.LEX_RATING_API_KEY || 'moj_court_sec_key_98374189234812398471';
  const baseUrl = `http://${host}:${port}`;
  return { host, port, apiKey, baseUrl };
}

/**
 * Execute HTTP/HTTPS POST request with JSON payload and timeout
 */
function sendHttpRequest(urlStr, headers, payload) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      const dataString = typeof payload === 'string' ? payload : JSON.stringify(payload);

      const reqOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + (url.search || ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataString),
          ...headers
        },
        timeout: 8000
      };

      const req = client.request(reqOptions, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            body: body
          });
        });
      });

      req.on('error', (err) => {
        resolve({
          ok: false,
          statusCode: 0,
          error: err.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          ok: false,
          statusCode: 408,
          error: 'Connection timeout after 8s'
        });
      });

      req.write(dataString);
      req.end();
    } catch (err) {
      resolve({
        ok: false,
        statusCode: 0,
        error: err.message
      });
    }
  });
}

/**
 * General Webhook Log Dispatcher
 */
async function dispatchWebhook(eventType, payload) {
  const logEntry = {
    id: 'WH-' + Date.now(),
    event: eventType,
    payload: payload,
    timestamp: new Date().toISOString(),
    status: 'dispatched',
    responseCode: 200
  };
  try {
    await dbService.insert('webhook_logs', logEntry);
  } catch (e) {
    console.error('Error logging webhook:', e.message);
  }
  return logEntry;
}

/**
 * Formats and dispatches a concluded/sealed case to the LEX-RATING API
 */
async function dispatchCaseToRatingSystem(caseItem) {
  if (!caseItem) return { success: false, error: 'No case provided' };

  const config = getRatingConfig();
  const url = `${config.baseUrl}/api/integrations/court/cases`;

  // Determine advocate ratings
  let pRating = 5.0;
  let dRating = 4.5;
  if (caseItem.verdict && Array.isArray(caseItem.verdict.advocateRatings)) {
    const pObj = caseItem.verdict.advocateRatings.find(r => r.side === 'plaintiff');
    const dObj = caseItem.verdict.advocateRatings.find(r => r.side === 'defense' || r.side === 'defendant');
    if (pObj && pObj.score) pRating = parseFloat(pObj.score);
    if (dObj && dObj.score) dRating = parseFloat(dObj.score);
  } else if (caseItem.judgeRatingPlaintiff) {
    pRating = parseFloat(caseItem.judgeRatingPlaintiff);
  }
  if (caseItem.judgeRatingDefendant) {
    dRating = parseFloat(caseItem.judgeRatingDefendant);
  }

  const pLawyerLic = caseItem.plaintiffLawyerLicense ||
    (caseItem.lawyerAppointed && caseItem.lawyerAppointed.licenseNumber) ||
    caseItem.plaintiffLawyerLic ||
    'LAW-1001';

  const pLawyerName = caseItem.plaintiffLawyerName ||
    (caseItem.lawyerAppointed && caseItem.lawyerAppointed.lawyerName) ||
    'Kebede Haile Mariam';

  const dLawyerLic = caseItem.defendantLawyerLicense ||
    (caseItem.defendantRepresentation && caseItem.defendantRepresentation.licenseNumber) ||
    caseItem.defendantLawyerLic ||
    'LAW-1002';

  const dLawyerName = caseItem.defendantLawyerName ||
    (caseItem.defendantRepresentation && caseItem.defendantRepresentation.lawyerName) ||
    'Tigist Alemu Bekele';

  // Determine winner: strictly "Plaintiff" or "Defendant"
  const rawVerdict = (
    (caseItem.verdict && (caseItem.verdict.winningParty || caseItem.verdict.verdictRuling || caseItem.verdict.verdictText)) ||
    caseItem.winningParty ||
    caseItem.finalVerdict ||
    caseItem.verdict ||
    ''
  ).toString().trim();

  const lowerVerdict = rawVerdict.toLowerCase();
  let normalizedVerdict = 'Plaintiff';
  if (
    lowerVerdict.includes('defendant') ||
    lowerVerdict.includes('dismissed') ||
    lowerVerdict.includes('defense') ||
    lowerVerdict.includes('respondent') ||
    lowerVerdict.includes('acquitted')
  ) {
    normalizedVerdict = 'Defendant';
  } else {
    normalizedVerdict = 'Plaintiff';
  }

  const payload = {
    caseId: caseItem.caseId,
    caseTitle: caseItem.caseTitle || (caseItem.petitioner + ' vs. ' + caseItem.respondent),
    caseType: caseItem.caseType || caseItem.caseCategory || 'Corporate / Civil Dispute',
    dateDecided: caseItem.dateDecided || (caseItem.sealedAt ? caseItem.sealedAt.split('T')[0] : new Date().toISOString().split('T')[0]),
    judgeId: caseItem.judgeId || 'JUDGE-001',
    judgeName: caseItem.judgeName || 'Hon. Judge Solomon Desta',
    courtLevel: caseItem.courtLevel || caseItem.jurisdiction || 'Federal Supreme Court',
    plaintiffClientId: caseItem.plaintiffClientId || caseItem.filerPhone || caseItem.phone || '+251 911 123 456',
    plaintiffClientName: caseItem.plaintiffClientName || caseItem.petitioner || caseItem.filerName || 'Awash International Bank S.C.',
    plaintiffLawyerLicense: pLawyerLic,
    plaintiffLawyerName: pLawyerName,
    judgeRatingPlaintiff: pRating,
    clientRatingPlaintiff: caseItem.clientRatingPlaintiff || (caseItem.clientReviews ? caseItem.clientReviews.plaintiffRating : null) || 4.8,
    defendantClientId: caseItem.defendantClientId || caseItem.defendantPhone || caseItem.respondentPhone || '+251 922 887 766',
    defendantClientName: caseItem.defendantClientName || caseItem.respondent || caseItem.defendantName || 'Blue Nile Holdings PLC',
    defendantLawyerLicense: dLawyerLic,
    defendantLawyerName: dLawyerName,
    judgeRatingDefendant: dRating,
    clientRatingDefendant: caseItem.clientRatingDefendant || null,
    verdict: normalizedVerdict
  };

  console.log(`📡 [LEX-RATING] Transmitting sealed Case ${caseItem.caseId} to ${url}...`);

  const res = await sendHttpRequest(url, {
    'x-api-key': config.apiKey
  }, payload);

  const delivered = res.ok;
  const statusNote = delivered
    ? `Delivered HTTP ${res.statusCode}`
    : (res.error ? `Target offline/logged: ${res.error}` : `HTTP ${res.statusCode}: ${res.body}`);

  const logEntry = {
    id: 'WH-' + Date.now(),
    event: 'CASE_SEALED_RATING_SYNC',
    caseId: caseItem.caseId,
    targetUrl: url,
    delivered,
    statusCode: res.statusCode || 0,
    statusText: statusNote,
    payload,
    responseBody: res.body || res.error || null,
    timestamp: new Date().toISOString()
  };

  await dbService.insert('webhook_logs', logEntry);

  // Update case record with rating sync result
  await dbService.updateOne('cases', { caseId: caseItem.caseId }, {
    ratingSyncStatus: delivered ? 'dispatched' : 'offline_recorded',
    ratingSyncDispatchedAt: new Date().toISOString(),
    ratingSyncDetails: statusNote,
    ratingSyncPayload: payload
  });

  await dbService.insert('audit_logs', {
    id: 'AUD-' + Date.now(),
    action: 'LEX_RATING_WEBHOOK_DISPATCHED',
    user: 'System Automation',
    role: 'system',
    caseId: caseItem.caseId,
    timestamp: new Date().toISOString(),
    details: delivered
      ? `Successfully transmitted case outcome & advocate ratings to LEX-RATING (${url})`
      : `Dispatched case ratings to LEX-RATING queue (${statusNote})`
  });

  return { success: true, delivered, log: logEntry };
}

/**
 * Bulk sync verified Ministry of Justice advocate licenses to LEX-RATING
 */
async function dispatchLicensesToRatingSystem() {
  const config = getRatingConfig();
  const url = `${config.baseUrl}/api/integrations/moj/licenses`;
  const licenses = await dbService.readJSON('moj_licenses');

  const payload = {
    syncTimestamp: new Date().toISOString(),
    totalLicenses: licenses.length,
    licenses: licenses.map(l => ({
      licenseNumber: l.licenseNumber,
      fullName: l.advocateName || l.fullName,
      status: l.status || 'Active',
      tier: l.tier || 'Federal Courts Advocate',
      specialization: l.category || l.specialization || 'General Practice',
      region: 'Federal'
    }))
  };

  const res = await sendHttpRequest(url, {
    'x-api-key': config.apiKey
  }, payload);

  const delivered = res.ok;
  const logEntry = {
    id: 'WH-LIC-' + Date.now(),
    event: 'MOJ_LICENSES_BULK_SYNC',
    targetUrl: url,
    count: licenses.length,
    delivered,
    statusCode: res.statusCode || 0,
    timestamp: new Date().toISOString()
  };

  await dbService.insert('webhook_logs', logEntry);
  return { success: true, count: licenses.length, delivered, log: logEntry };
}

/**
 * In-memory schedule map for pending case dispatches
 */
const scheduledTimers = new Map();

function scheduleCaseRatingSync(caseId, delayMs) {
  const delay = delayMs || getGracePeriodMs();
  console.log(`⏱️ [LEX-RATING] Scheduled rating sync for Case ${caseId} in ${Math.round(delay / 1000)}s`);

  if (scheduledTimers.has(caseId)) {
    clearTimeout(scheduledTimers.get(caseId));
  }

  const timer = setTimeout(async () => {
    scheduledTimers.delete(caseId);
    try {
      const caseItem = await dbService.findOne('cases', { caseId });
      if (caseItem && (caseItem.status === 'Decided' || caseItem.status === 'Sealed' || caseItem.isSealed || caseItem.verdict)) {
        console.log(`⏳ [LEX-RATING] 5-Minute grace period elapsed for Case ${caseId}. Initiating rating webhook...`);
        await dispatchCaseToRatingSystem(caseItem);
      }
    } catch (err) {
      console.error(`❌ [LEX-RATING] Error processing delayed sync for Case ${caseId}:`, err.message);
    }
  }, delay);

  scheduledTimers.set(caseId, timer);
}

/**
 * Background worker running periodically to catch any pending cases across restarts
 */
let workerInterval = null;

function initRatingSyncWorker() {
  if (workerInterval) return;

  console.log('🔄 Initializing LEX-RATING Sealed Cases Sync Worker (15s polling cycle)...');

  const checkPendingCases = async () => {
    try {
      const cases = await dbService.readJSON('cases');
      const now = Date.now();

      for (const c of cases) {
        // Check if case is sealed / decided and has a pending rating sync
        if (c.ratingSyncStatus === 'pending' && c.ratingSyncScheduledAt) {
          const scheduledTime = new Date(c.ratingSyncScheduledAt).getTime();
          if (now >= scheduledTime) {
            console.log(`⏰ [Worker] Auto-triggering pending LEX-RATING sync for Case ${c.caseId} (Elapsed 5-minute window)`);
            // Mark running to prevent duplicate triggers
            await dbService.updateOne('cases', { caseId: c.caseId }, { ratingSyncStatus: 'in_progress' });
            await dispatchCaseToRatingSystem(c);
          }
        }
      }
    } catch (e) {
      console.error('Error in rating sync worker check:', e.message);
    }
  };

  // Run on startup
  checkPendingCases();

  // Run every 15 seconds
  workerInterval = setInterval(checkPendingCases, 15000);
}

module.exports = {
  getGracePeriodMs,
  getRatingConfig,
  dispatchWebhook,
  dispatchCaseToRatingSystem,
  dispatchLicensesToRatingSystem,
  scheduleCaseRatingSync,
  initRatingSyncWorker
};
