'use strict';
const fetch = globalThis.fetch;
const { v4: uuidv4 } = require('uuid');
const WebhookLog = require('../models/WebhookLog');
const { isMongoActive, readJSON, writeJSON, getVerifiedLicenseByNumber } = require('./dbService');

function getWebhookConfig() {
  const host = process.env.LEX_RATING_HOST || '127.0.0.1';
  const port = process.env.LEX_RATING_PORT || 5000;
  const baseUrl = `http://${host}:${port}`;
  const apiKey = process.env.LEX_RATING_API_KEY || 'court_moj_lex_secret_api_key_2026';

  return {
    casesUrl: `${baseUrl}/api/integrations/court/cases`,
    licensesUrl: `${baseUrl}/api/integrations/moj/licenses`,
    apiKey
  };
}

// -- Part 1: Business Logic & Filtering Rules -------------------------------

/**
 * Checks whether a case qualifies for LEX-RATING:
 * 1. Lawyer vs. Lawyer Only (both plaintiffLawyerLicense AND defendantLawyerLicense present).
 * 2. Excludes self-represented cases (missing advocate on either side).
 * 3. Excludes public criminal prosecutions (prosecutor license or isProsecutor true).
 */
function isCaseEligibleForLexRating(c) {
  if (!c) return false;

  // 1. Exclude public criminal prosecutions
  if (c.isProsecutor === true || c.isProsecutor === 'true') return false;
  if (c.filer && (c.filer.role === 'prosecutor' || c.filer.role === 'state_prosecutor')) return false;
  if (c.caseType && c.caseType.toLowerCase().includes('prosecution')) return false;

  // Extract licenses
  const pLic = (c.plaintiffLawyerLicense || '').trim().toUpperCase();
  const dLic = (c.defendantLawyerLicense || c.defendant?.appointedLawyerLicense || '').trim().toUpperCase();

  // 2. Both sides MUST have a licensed advocate (exclude self-represented client cases)
  if (!pLic || !dLic) return false;
  if (pLic === 'SELF' || dLic === 'SELF' || pLic === 'NONE' || dLic === 'NONE' || pLic === 'UNASSIGNED' || dLic === 'UNASSIGNED') return false;

  // 3. Exclude State Prosecutor and Government Prosecution IDs
  if (pLic.startsWith('PROS') || dLic.startsWith('PROS')) return false;
  if (pLic.includes('PROSECUTOR') || dLic.includes('PROSECUTOR')) return false;

  return true;
}

/**
 * Formats a court case document into the exact LEX-RATING specification payload
 */
async function formatCaseWebhookPayload(c) {
  // Resolve advocate names if missing
  let pName = c.plaintiffLawyerName;
  if (!pName && c.plaintiffLawyerLicense) {
    const lic = await getVerifiedLicenseByNumber(c.plaintiffLawyerLicense);
    if (lic) pName = lic.fullName;
  }

  let dName = c.defendantLawyerName;
  if (!dName && c.defendantLawyerLicense) {
    const lic = await getVerifiedLicenseByNumber(c.defendantLawyerLicense);
    if (lic) dName = lic.fullName;
  }

  // Normalize case type
  let caseType = c.caseType || 'Civil';
  const typeMap = {
    'commercial': 'Corporate',
    'corporate': 'Corporate',
    'civil': 'Civil',
    'labor': 'Labour',
    'labour': 'Labour',
    'family': 'Family',
    'land': 'Land',
    'property': 'Land'
  };
  const lowerType = caseType.toLowerCase();
  for (const [k, v] of Object.entries(typeMap)) {
    if (lowerType.includes(k)) {
      caseType = v;
      break;
    }
  }

  // Normalize verdict to "Plaintiff" | "Defendant" | "Settled"
  let verdict = 'Plaintiff';
  const rawVerdict = typeof c.verdict === 'object' && c.verdict !== null ? c.verdict : {};
  const winParty = (rawVerdict.winningParty || c.winningParty || '').toLowerCase();
  const winSide = (rawVerdict.winningSide || '').toLowerCase();

  if (winParty === 'defendant' || winSide === 'defendant') {
    verdict = 'Defendant';
  } else if (winParty === 'settlement' || winParty === 'partial' || winParty === 'settled') {
    verdict = 'Settled';
  } else {
    verdict = 'Plaintiff';
  }

  // Date decided
  let dateDecided = c.dateDecided;
  if (!dateDecided && rawVerdict.verdictDate) {
    dateDecided = new Date(rawVerdict.verdictDate).toISOString().split('T')[0];
  }
  if (!dateDecided) {
    dateDecided = new Date().toISOString().split('T')[0];
  }

  return {
    caseId: c.caseId,
    caseTitle: c.caseTitle,
    caseType,
    dateDecided,
    judgeId: c.judgeId || c.assignedJudgeId || 'JUDGE-001',
    judgeName: c.judgeName || 'Hon. Judge Bekele Seyoum',
    courtLevel: c.courtLevel || 'Federal Supreme Court',

    plaintiffClientId: c.plaintiffClientId || c.filer?.phone || `CLIENT-${c.caseId}-P`,
    plaintiffClientName: c.plaintiffClientName || c.filer?.name || 'Plaintiff',
    plaintiffLawyerLicense: c.plaintiffLawyerLicense,
    plaintiffLawyerName: pName || 'Kebede Haile Mariam',
    judgeRatingPlaintiff: typeof c.judgeRatingPlaintiff === 'number' ? Number(c.judgeRatingPlaintiff.toFixed(1)) : 5.0,
    clientRatingPlaintiff: typeof c.clientRatingPlaintiff === 'number' ? Number(c.clientRatingPlaintiff.toFixed(1)) : null,

    defendantClientId: c.defendantClientId || c.defendant?.phone || `CLIENT-${c.caseId}-D`,
    defendantClientName: c.defendantClientName || c.defendant?.name || 'Defendant',
    defendantLawyerLicense: c.defendantLawyerLicense,
    defendantLawyerName: dName || 'Tigist Alemu Bekele',
    judgeRatingDefendant: typeof c.judgeRatingDefendant === 'number' ? Number(c.judgeRatingDefendant.toFixed(1)) : 4.0,
    clientRatingDefendant: typeof c.clientRatingDefendant === 'number' ? Number(c.clientRatingDefendant.toFixed(1)) : null,

    verdict
  };
}

/**
 * Formats an MoJ advocate license into the exact LEX-RATING specification payload
 */
function formatLicenseWebhookPayload(l) {
  // Normalize Status ("Active" | "Suspended" | "Revoked" | "Expired")
  const rawStatus = (l.status || 'Active').toLowerCase();
  let status = 'Active';
  if (rawStatus.includes('suspend')) status = 'Suspended';
  else if (rawStatus.includes('revok')) status = 'Revoked';
  else if (rawStatus.includes('expir')) status = 'Expired';

  return {
    licenseNumber: l.licenseNumber,
    fullName: l.fullName,
    status,
    tier: l.tier || 'Federal Supreme Court & Cassation Bench',
    issuedDate: l.issuedDate || l.issueDate || '2020-01-15',
    expiryDate: l.expiryDate || '2027-01-15',
    specialization: l.specialization || 'General Practice',
    region: l.region || 'Federal'
  };
}

// -- Part 3: HTTP Dispatcher with Exponential Backoff & Retry --------------

async function logWebhookResult(entry) {
  const allLogs = readJSON('webhook_logs.json');
  allLogs.unshift(entry);
  if (allLogs.length > 500) allLogs.pop();
  writeJSON('webhook_logs.json', allLogs);

  if (isMongoActive()) {
    try {
      await WebhookLog.create(entry);
    } catch (err) {
      console.warn('[WebhookLog Mongo Save Error]', err.message);
    }
  }
}

async function dispatchWithRetry(url, payload, eventType, resourceId, maxAttempts = 3) {
  const { apiKey } = getWebhookConfig();
  const logId = `WHLOG-${uuidv4().split('-')[0].toUpperCase()}`;

  let attempt = 0;
  let lastError = null;
  let lastStatus = null;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      console.log(`[Webhook Dispatcher] Sending ${eventType} (Attempt ${attempt}/${maxAttempts}) to ${url}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      lastStatus = response.status;

      if (response.ok || response.status === 200 || response.status === 201) {
        console.log(`[Webhook Dispatcher] ? Success (Status ${response.status}) for ${eventType} [${resourceId || 'Bulk'}]`);
        await logWebhookResult({
          id: logId,
          targetUrl: url,
          eventType,
          resourceId: resourceId || 'BULK',
          payload,
          attempts: attempt,
          statusCode: response.status,
          success: true,
          errorMessage: null,
          dispatchedAt: new Date()
        });
        return { success: true, status: response.status, attempts: attempt };
      }

      // If 4xx client error (e.g. invalid API key or bad schema), do not retry
      if (response.status >= 400 && response.status < 500) {
        const errorText = await response.text();
        lastError = `HTTP ${response.status}: ${errorText}`;
        console.warn(`[Webhook Dispatcher] ?? Client error (${lastError}), no retry.`);
        break;
      }

      // 5xx Server Error: will retry
      lastError = `HTTP ${response.status}`;
    } catch (err) {
      lastError = err.name === 'AbortError' ? 'Request Timeout (6000ms)' : err.message;
      console.warn(`[Webhook Dispatcher] Attempt ${attempt} failed: ${lastError}`);
    }

    if (attempt < maxAttempts) {
      const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s...
      console.log(`[Webhook Dispatcher] Retrying in ${backoffMs}ms...`);
      await new Promise(r => setTimeout(r, backoffMs));
    }
  }

  // All attempts exhausted or permanent failure
  console.error(`[Webhook Dispatcher] ? Failed delivering ${eventType} after ${attempt} attempts: ${lastError}`);
  await logWebhookResult({
    id: logId,
    targetUrl: url,
    eventType,
    resourceId: resourceId || 'BULK',
    payload,
    attempts: attempt,
    statusCode: lastStatus || 500,
    success: false,
    errorMessage: lastError,
    dispatchedAt: new Date()
  });

  return { success: false, error: lastError, attempts: attempt, statusCode: lastStatus };
}

// -- Public Dispatch Handlers -----------------------------------------------

/**
 * Automatically triggers webhook when a court case is decided
 */
async function dispatchCaseVerdictWebhook(caseDoc) {
  if (!isCaseEligibleForLexRating(caseDoc)) {
    console.log(`[Webhook Dispatcher] Case ${caseDoc.caseId} is not eligible for LEX-RATING (Lawyer vs Lawyer filter). Skipped.`);
    return { skipped: true, reason: 'Case is not an Adversarial 2-Lawyer Debate' };
  }

  const { casesUrl } = getWebhookConfig();
  const payload = await formatCaseWebhookPayload(caseDoc);
  return await dispatchWithRetry(casesUrl, payload, 'CASE_DECIDED', caseDoc.caseId);
}

/**
 * Automatically triggers webhook when a client rates an advocate post-verdict
 */
async function dispatchCaseRatingUpdatedWebhook(caseDoc) {
  if (!isCaseEligibleForLexRating(caseDoc)) return { skipped: true };

  const { casesUrl } = getWebhookConfig();
  const payload = await formatCaseWebhookPayload(caseDoc);
  return await dispatchWithRetry(casesUrl, payload, 'CASE_RATING_UPDATED', caseDoc.caseId);
}

/**
 * Automatically triggers webhook when an MoJ advocate license is registered or updated
 */
async function dispatchMoJLicenseWebhook(licenseDoc) {
  const { licensesUrl } = getWebhookConfig();
  const payload = formatLicenseWebhookPayload(licenseDoc);
  return await dispatchWithRetry(licensesUrl, payload, 'MOJ_LICENSE_SYNC', licenseDoc.licenseNumber);
}

/**
 * Bulk Sync: Scans all cases in database, filters 2-lawyer concluded cases, and sends array to LEX-RATING
 */
async function bulkSyncEligibleCases(allCases) {
  const { casesUrl } = getWebhookConfig();
  const eligible = (allCases || []).filter(c => isCaseEligibleForLexRating(c) && (c.status === 'Decided' || c.status === 'closed' || c.verdict));

  if (eligible.length === 0) {
    return { success: true, count: 0, message: 'No eligible 2-advocate cases found to sync.' };
  }

  const payloads = [];
  for (const c of eligible) {
    payloads.push(await formatCaseWebhookPayload(c));
  }

  console.log(`[Webhook Dispatcher] Bulk syncing ${payloads.length} concluded 2-lawyer cases to ${casesUrl}...`);
  const result = await dispatchWithRetry(casesUrl, payloads, 'BULK_CASES_SYNC', `COUNT_${payloads.length}`);
  return { ...result, count: payloads.length };
}

/**
 * Bulk Sync: Sends all verified MoJ advocate licenses in batch to LEX-RATING
 */
async function bulkSyncMoJLicenses(allLicenses) {
  const { licensesUrl } = getWebhookConfig();
  const payloads = (allLicenses || []).map(formatLicenseWebhookPayload);

  console.log(`[Webhook Dispatcher] Bulk syncing ${payloads.length} verified MoJ licenses to ${licensesUrl}...`);
  const result = await dispatchWithRetry(licensesUrl, payloads, 'BULK_LICENSES_SYNC', `COUNT_${payloads.length}`);
  return { ...result, count: payloads.length };
}

module.exports = {
  getWebhookConfig,
  isCaseEligibleForLexRating,
  formatCaseWebhookPayload,
  formatLicenseWebhookPayload,
  dispatchCaseVerdictWebhook,
  dispatchCaseRatingUpdatedWebhook,
  dispatchMoJLicenseWebhook,
  bulkSyncEligibleCases,
  bulkSyncMoJLicenses
};
