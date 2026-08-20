'use strict';
const dbService = require('../services/dbService');
const { dispatchWebhook } = require('../services/webhookDispatcher');

// 1. Get All Cases
async function getAllCases(req, res) {
  const cases = await dbService.readJSON('cases');
  res.json(cases);
}

// 2. Get Case by ID
async function getCaseById(req, res) {
  const caseItem = await dbService.findOne('cases', { caseId: req.params.id });
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }
  res.json(caseItem);
}

// 3. Search Cases
async function searchCases(req, res) {
  const q = (req.query.q || '').toLowerCase().trim();
  const cases = await dbService.readJSON('cases');
  if (!q) return res.json(cases);

  const filtered = cases.filter(c => {
    return (c.caseId && c.caseId.toLowerCase().includes(q)) ||
           (c.caseTitle && c.caseTitle.toLowerCase().includes(q)) ||
           (c.petitioner && c.petitioner.toLowerCase().includes(q)) ||
           (c.respondent && c.respondent.toLowerCase().includes(q)) ||
           (c.jurisdiction && c.jurisdiction.toLowerCase().includes(q));
  });
  res.json(filtered);
}

// 4. File Case (Section 2 - Case Filing Workflow)
async function createCase(req, res) {
  try {
    const body = req.body;
    const files = req.files || [];
    const caseId = 'CASE-' + Date.now();
    const trackingCode = 'ET-FSC-' + Math.floor(100000 + Math.random() * 900000);
    const tempPassword = Math.floor(1000 + Math.random() * 9000).toString();

    const docs = files.map(f => ({
      id: 'DOC-' + Date.now() + '-' + Math.round(Math.random()*1000),
      name: f.originalname,
      path: f.path,
      size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
      uploadedBy: body.petitioner || 'Plaintiff',
      uploadedAt: new Date().toISOString(),
      confidentialityFlag: body.confidentialityFlag || 'standard', // 'standard' or 'request_confidential'
      classificationStatus: 'pending_review' // 'pending_review', 'shared', 'sealed'
    }));

    const newCase = {
      caseId,
      trackingCode,
      caseTitle: body.caseTitle || ((body.petitioner || 'Plaintiff') + ' vs. ' + (body.respondent || 'Respondent')),
      petitioner: body.petitioner || 'Anonymous Litigant',
      filerPhone: body.filerPhone || '+251 911 123 456',
      respondent: body.respondent || 'Named Respondent',
      respondentPhone: body.respondentPhone || '+251 922 887 766',
      jurisdiction: body.jurisdiction || 'Federal Supreme Court (Sidist Kilo)',
      caseType: body.caseType || 'Civil Dispute',
      filingDate: new Date().toISOString(),
      status: 'pending_screening',
      screeningStatus: 'pending',
      screeningNotes: '',
      relevantLawArticle: body.relevantLawArticle || '',
      judgeName: 'Unassigned',
      judgeId: null,
      clerkName: 'Unassigned',
      courtroom: 'TBD',
      hearingDate: null,
      hearingTime: null,
      isCriminal: body.caseType === 'Criminal Proceedings' || body.isCriminal === true,
      lawyerAppointed: null, // { lawyerId, lawyerName, licenseNumber, appointedAt, side: 'plaintiff' }
      defendantRepresentation: {
        type: 'pending_choice', // 'self', 'appointed_lawyer', 'government_lawyer', 'pending_choice'
        lawyerName: null,
        licenseNumber: null,
        chosenAt: null
      },
      defendantActivated: false,
      defendantResponseDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      lawyerDeclinesCount: 0,
      postponements: {
        plaintiffCount: 0,
        defendantCount: 0,
        requests: []
      },
      documents: docs,
      caseNotes: [],
      documentDemands: [],
      sessionSummaries: [],
      timeline: [
        { stage: 'Filed', date: new Date().toISOString(), note: 'Case filed electronically via Supreme Court e-Filing portal.' }
      ],
      verdict: null,
      appealDeadline: null,
      isClosed: false
    };

    await dbService.insert('cases', newCase);

    // Create Audit Log
    await dbService.insert('audit_logs', {
      id: 'AUD-' + Date.now(),
      action: 'CASE_FILED',
      user: newCase.petitioner,
      role: 'plaintiff',
      caseId: newCase.caseId,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    });

    // Send SMS Confirmation to Filer
    if (newCase.filerPhone) {
      await dbService.insert('sms_logs', {
        id: 'SMS-' + Date.now(),
        time: new Date().toLocaleString(),
        phone: newCase.filerPhone,
        caseId: newCase.caseId,
        type: 'Filing Confirmation',
        message: 'Your case ' + newCase.caseId + ' has been filed. Tracking code: ' + newCase.trackingCode + '. Temp PIN: ' + tempPassword,
        status: 'Sent',
        statusClass: 'pill-green',
        sentBy: 'System Auto-Gateway'
      });
    }

    await dispatchWebhook('CASE_FILED', { caseId: newCase.caseId, petitioner: newCase.petitioner });
    res.status(201).json({ success: true, case: newCase, tempPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// 5. Admin Screening Review & Branch Forwarding (Section 2)
async function adminScreeningReview(req, res) {
  const { caseId, decision, comments, branchAssigned, caseCategory, relevantLawArticle, adminName } = req.body;
  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  const isApproved = decision === 'approved';
  const updated = await dbService.updateOne('cases', { caseId }, {
    screeningStatus: isApproved ? 'approved' : 'rejected',
    status: isApproved ? 'forwarded_to_branch' : 'rejected',
    screeningNotes: comments || '',
    caseCategory: caseCategory || caseItem.caseCategory || caseItem.caseType || 'Civil / Corporate',
    jurisdiction: branchAssigned || caseItem.jurisdiction,
    relevantLawArticle: relevantLawArticle || caseItem.relevantLawArticle,
    reviewedBy: adminName || 'Admin User',
    reviewedAt: new Date().toISOString()
  });

  // Audit Log (Section 12.5)
  await dbService.insert('audit_logs', {
    id: 'AUD-' + Date.now(),
    action: isApproved ? 'ADMIN_APPROVED_AND_FORWARDED' : 'ADMIN_DECLINED_CASE',
    user: adminName || 'Admin User',
    role: 'admin',
    caseId,
    timestamp: new Date().toISOString(),
    details: 'Assigned to ' + (branchAssigned || caseItem.jurisdiction) + '. Law Check: ' + (relevantLawArticle || 'Standard Civil/Penal Code')
  });

  res.json({ success: true, case: updated });
}

// 6. Branch Official Schedule First Hearing (Section 5)
async function scheduleFirstHearing(req, res) {
  const { caseId, judgeId, judgeName, clerkName, courtroom, hearingDate, hearingTime, estimatedDuration, officialName } = req.body;
  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  const updated = await dbService.updateOne('cases', { caseId }, {
    status: 'scheduled',
    judgeId: judgeId || 'JUDGE-001',
    judgeName: judgeName || 'Hon. Judge Solomon Desta',
    clerkName: clerkName || 'Kalkidan Mengistu',
    courtroom: courtroom || 'Courtroom 4',
    hearingDate: hearingDate || new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
    hearingTime: hearingTime || '09:30 AM',
    estimatedDuration: estimatedDuration || '1 hour',
    scheduledBy: officialName || 'Branch Official'
  });

  // Add scheduling audit entry (Section 12.5)
  await dbService.insert('audit_logs', {
    id: 'AUD-' + Date.now(),
    action: 'HEARING_SCHEDULED',
    user: officialName || 'Branch Official',
    role: 'official',
    caseId,
    timestamp: new Date().toISOString(),
    details: 'Judge: ' + judgeName + ', Courtroom: ' + courtroom + ', Date: ' + hearingDate + ' at ' + hearingTime
  });

  // Send In-App Notifications & SMS to Plaintiff and Defendant (Section 5)
  await dbService.insert('notifications', {
    id: 'NOTIF-' + Date.now(),
    title: 'First Hearing Scheduled for ' + caseId,
    message: 'Your hearing is scheduled for ' + hearingDate + ' at ' + hearingTime + ' in ' + courtroom + ' before ' + judgeName + '.',
    caseId,
    timestamp: new Date().toISOString(),
    read: false
  });

  if (caseItem.filerPhone) {
    await dbService.insert('sms_logs', {
      id: 'SMS-' + Date.now(),
      time: new Date().toLocaleString(),
      phone: caseItem.filerPhone,
      caseId,
      type: 'Summons / Hearing Notice',
      message: 'FSC Notice: Hearing for case ' + caseId + ' set for ' + hearingDate + ' at ' + hearingTime + ' in ' + courtroom + '.',
      status: 'Sent',
      statusClass: 'pill-green',
      sentBy: 'Court Registry'
    });
  }

  res.json({ success: true, case: updated });
}

// 7. Lawyer Appointment Request / Respond / Revoke (Section 3 & Section 12.1)
async function requestLawyerAppointment(req, res) {
  const { caseId, licenseNumber, side, clientName } = req.body;
  const lawyer = await dbService.findOne('lawyers', { licenseNumber: licenseNumber.trim() });
  if (!lawyer) return res.status(404).json({ error: 'Lawyer with license number ' + licenseNumber + ' not found' });

  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  const updated = await dbService.updateOne('cases', { caseId }, {
    pendingLawyerRequest: {
      lawyerId: lawyer.id,
      lawyerName: lawyer.fullName,
      licenseNumber: lawyer.licenseNumber,
      side: side || 'plaintiff',
      requestedBy: clientName || 'Client',
      requestedAt: new Date().toISOString(),
      status: 'pending'
    }
  });

  res.json({ success: true, message: 'Appointment request sent to Advocate ' + lawyer.fullName, case: updated });
}

async function respondLawyerAppointment(req, res) {
  const { caseId, accept, lawyerId } = req.body;
  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  if (accept) {
    // Lawyer accepts appointment: client access becomes read-only (Section 3)
    const reqData = caseItem.pendingLawyerRequest || {};
    const updated = await dbService.updateOne('cases', { caseId }, {
      lawyerAppointed: {
        lawyerId: reqData.lawyerId || lawyerId,
        lawyerName: reqData.lawyerName || 'Advocate',
        licenseNumber: reqData.licenseNumber || 'LAW-1001',
        side: reqData.side || 'plaintiff',
        appointedAt: new Date().toISOString()
      },
      clientAccessMode: 'read_only',
      pendingLawyerRequest: null
    });

    await dbService.insert('audit_logs', {
      id: 'AUD-' + Date.now(),
      action: 'LAWYER_APPOINTMENT_ACCEPTED',
      user: reqData.lawyerName || 'Lawyer',
      role: 'lawyer',
      caseId,
      timestamp: new Date().toISOString()
    });

    return res.json({ success: true, status: 'accepted', case: updated });
  } else {
    // Lawyer declines appointment (Section 12.1)
    const declineCount = (caseItem.lawyerDeclinesCount || 0) + 1;
    const promptGovLawyer = declineCount >= 3;

    const updated = await dbService.updateOne('cases', { caseId }, {
      lawyerDeclinesCount: declineCount,
      pendingLawyerRequest: null
    });

    await dbService.insert('audit_logs', {
      id: 'AUD-' + Date.now(),
      action: 'LAWYER_APPOINTMENT_DECLINED',
      user: 'Advocate ' + lawyerId,
      role: 'lawyer',
      caseId,
      timestamp: new Date().toISOString(),
      details: 'Total declines for case: ' + declineCount
    });

    return res.json({
      success: true,
      status: 'declined',
      declineCount,
      promptGovLawyer,
      message: 'Lawyer declined appointment. Client may search another lawyer or request government counsel.'
    });
  }
}

async function removeLawyer(req, res) {
  const { caseId, clientName } = req.body;
  const updated = await dbService.updateOne('cases', { caseId }, {
    lawyerAppointed: null,
    clientAccessMode: 'full_control'
  });

  await dbService.insert('audit_logs', {
    id: 'AUD-' + Date.now(),
    action: 'LAWYER_REMOVED_BY_CLIENT',
    user: clientName || 'Client',
    role: 'plaintiff',
    caseId,
    timestamp: new Date().toISOString(),
    details: 'Client revoked lawyer and resumed self-representation.'
  });

  res.json({ success: true, message: 'Lawyer removed. Full control returned to client.', case: updated });
}

// 8. Defendant Representation Choice (Section 4 & Section 12.2)
async function defendantChooseRepresentation(req, res) {
  const { caseId, choiceType, lawyerLicense, defendantName } = req.body;
  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  if (choiceType === 'self') {
    const updated = await dbService.updateOne('cases', { caseId }, {
      defendantActivated: true,
      defendantRepresentation: {
        type: 'self',
        lawyerName: null,
        chosenAt: new Date().toISOString()
      }
    });
    return res.json({ success: true, representation: 'self', case: updated });
  }

  if (choiceType === 'government_lawyer') {
    // Section 12.2: Find government lawyer with lightest caseload
    const allLawyers = await dbService.readJSON('lawyers');
    const govLawyers = allLawyers.filter(l => l.isGovernmentLawyer === true || l.specialization?.includes('Public'));

    if (govLawyers.length === 0) {
      // Pool empty: Flag Representation Pending
      const updated = await dbService.updateOne('cases', { caseId }, {
        defendantActivated: true,
        defendantRepresentation: {
          type: 'representation_pending',
          status: 'Government Lawyer Pool Empty - Sourcing in progress'
        }
      });
      return res.json({ success: true, representation: 'representation_pending', message: 'Representation pending sourcing.' });
    }

    // Sort by caseload (lightest first)
    govLawyers.sort((a, b) => (a.currentCaseload || 0) - (b.currentCaseload || 0));
    const assignedGovLawyer = govLawyers[0];

    const updated = await dbService.updateOne('cases', { caseId }, {
      defendantActivated: true,
      defendantRepresentation: {
        type: 'government_lawyer',
        lawyerId: assignedGovLawyer.id,
        lawyerName: assignedGovLawyer.fullName,
        licenseNumber: assignedGovLawyer.licenseNumber,
        chosenAt: new Date().toISOString()
      }
    });

    return res.json({ success: true, representation: 'government_lawyer', assignedLawyer: assignedGovLawyer, case: updated });
  }

  if (choiceType === 'appoint_lawyer') {
    return requestLawyerAppointment(req, res);
  }

  res.status(400).json({ error: 'Invalid choice type' });
}

// 9. Postponement Requests with Soft Cap of 2 (Section 6 & Section 12.3)
async function requestPostponement(req, res) {
  const { caseId, side, reason, requestedDate, requestedBy } = req.body;
  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  let postponements = caseItem.postponements;
  if (!postponements || typeof postponements !== 'object' || Array.isArray(postponements)) {
    postponements = { plaintiffCount: 0, defendantCount: 0, requests: [] };
  }
  if (!Array.isArray(postponements.requests)) postponements.requests = [];
  if (typeof postponements.plaintiffCount !== 'number') postponements.plaintiffCount = 0;
  if (typeof postponements.defendantCount !== 'number') postponements.defendantCount = 0;

  const currentCount = side === 'defendant' ? postponements.defendantCount : postponements.plaintiffCount;

  const newRequest = {
    id: 'POSTP-' + Date.now(),
    side: side || 'plaintiff',
    requestedBy: requestedBy || 'Counsel',
    reason: reason || 'Scheduling conflict',
    requestedDate: requestedDate || 'Next available week',
    countForSide: currentCount + 1,
    status: currentCount < 2 ? 'auto_approved' : 'pending_judge_discretion',
    timestamp: new Date().toISOString()
  };

  postponements.requests.push(newRequest);
  if (side === 'defendant') postponements.defendantCount++;
  else postponements.plaintiffCount++;

  let updatedStatus = caseItem.status;
  if (newRequest.status === 'auto_approved') {
    updatedStatus = 'rescheduled';
  }

  const updated = await dbService.updateOne('cases', { caseId }, {
    postponements,
    status: updatedStatus
  });

  await dbService.insert('audit_logs', {
    id: 'AUD-' + Date.now(),
    action: 'POSTPONEMENT_REQUESTED',
    user: requestedBy || 'Litigant',
    role: side || 'plaintiff',
    caseId,
    timestamp: new Date().toISOString(),
    details: 'Reason: ' + reason + ' | Status: ' + newRequest.status
  });

  res.json({
    success: true,
    autoApproved: newRequest.status === 'auto_approved',
    routedToJudge: newRequest.status === 'pending_judge_discretion',
    request: newRequest,
    case: updated
  });
}

// 10. Evidence Classification Gate (Section 12.4)
async function classifyEvidence(req, res) {
  const { caseId, docId, classification, judgeName } = req.body; // classification: 'shared' or 'sealed'
  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  const docs = caseItem.documents || [];
  const doc = docs.find(d => d.id === docId || d.name === docId);
  if (doc) {
    doc.classificationStatus = classification; // 'shared' or 'sealed'
    doc.classifiedBy = judgeName || 'Hon. Judge Solomon Desta';
    doc.classifiedAt = new Date().toISOString();
  }

  const updated = await dbService.updateOne('cases', { caseId }, { documents: docs });

  await dbService.insert('audit_logs', {
    id: 'AUD-' + Date.now(),
    action: 'EVIDENCE_CLASSIFIED_' + classification.toUpperCase(),
    user: judgeName || 'Judge',
    role: 'judge',
    caseId,
    timestamp: new Date().toISOString(),
    details: 'Doc: ' + (doc ? doc.name : docId) + ' set to ' + classification
  });

  res.json({ success: true, documents: docs, case: updated });
}

// 11. Clerk Session Summary & Attendance Log (Section 7)
async function logHearingSession(req, res) {
  const { caseId, plaintiffPresent, defendantPresent, topicsDiscussed, sessionActivities, summaryNotes, clerkName, nextHearingDate } = req.body;
  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  const sessionEntry = {
    id: 'SESS-' + Date.now(),
    date: new Date().toISOString(),
    clerkName: clerkName || 'Kalkidan Mengistu',
    attendance: {
      plaintiffPresent: plaintiffPresent !== false,
      defendantPresent: defendantPresent !== false
    },
    topicsDiscussed: topicsDiscussed || 'Oral submissions on contract default',
    sessionActivities: sessionActivities || 'Evidence dossier marked and admitted',
    summaryNotes: summaryNotes || 'Court adjourned for judicial review.',
    nextHearingDate: nextHearingDate || null
  };

  const sessionSummaries = caseItem.sessionSummaries || [];
  sessionSummaries.push(sessionEntry);

  const updated = await dbService.updateOne('cases', { caseId }, {
    sessionSummaries,
    ...(nextHearingDate && { hearingDate: nextHearingDate })
  });

  await dbService.insert('audit_logs', {
    id: 'AUD-' + Date.now(),
    action: 'HEARING_SESSION_LOGGED',
    user: clerkName || 'Court Clerk',
    role: 'clerk',
    caseId,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, session: sessionEntry, case: updated });
}

// 12. Final Verdict, Closing Statement & Lawyer Ratings (Section 8 & Section 10)
async function issueFinalVerdict(req, res) {
  const { caseId, winningParty, judgmentRemedy, finalStatement, lawyerRatings, judgeName } = req.body;
  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  const appealDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const verdictObj = {
    verdictDate: new Date().toISOString(),
    winningParty: winningParty || 'plaintiff',
    judgmentRemedy: judgmentRemedy || 'Remedy granted per Federal Commercial Code',
    finalStatement: finalStatement || 'Judgment entered following full trial proceedings.',
    appealDeadline,
    judgeName: judgeName || 'Hon. Judge Solomon Desta',
    ratings: lawyerRatings || [] // [ { lawyerName, licenseNumber, rating: 5, remarks: 'Excellent' } ]
  };

  const updated = await dbService.updateOne('cases', { caseId }, {
    status: 'Decided',
    verdict: verdictObj,
    appealDeadline,
    dateDecided: new Date().toISOString().split('T')[0]
  });

  await dbService.insert('audit_logs', {
    id: 'AUD-' + Date.now(),
    action: 'FINAL_VERDICT_ISSUED',
    user: judgeName || 'Judge',
    role: 'judge',
    caseId,
    timestamp: new Date().toISOString(),
    details: 'Winner: ' + winningParty + ' | Appeal Deadline: 30 days'
  });

  res.json({ success: true, verdict: verdictObj, case: updated });
}

// 13. Case Notes (Notepad with Timestamp) (Section 8)
async function addCaseNote(req, res) {
  const { caseId, note, author, role } = req.body;
  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  const notes = caseItem.caseNotes || [];
  const newNote = {
    id: 'NOTE-' + Date.now(),
    note,
    author: author || 'Judge',
    role: role || 'judge',
    timestamp: new Date().toISOString()
  };
  notes.unshift(newNote);

  const updated = await dbService.updateOne('cases', { caseId }, { caseNotes: notes });
  res.json({ success: true, note: newNote, case: updated });
}

// 14. Document Demands (Section 8)
async function demandDocuments(req, res) {
  const { caseId, demandTitle, description, targetParty, deadline, judgeName } = req.body;
  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  const demands = caseItem.documentDemands || [];
  const newDemand = {
    id: 'DEMAND-' + Date.now(),
    demandTitle,
    description,
    targetParty: targetParty || 'both',
    deadline: deadline || '7 days',
    issuedBy: judgeName || 'Hon. Judge Solomon Desta',
    status: 'Pending Submission',
    issuedAt: new Date().toISOString()
  };
  demands.unshift(newDemand);

  const updated = await dbService.updateOne('cases', { caseId }, { documentDemands: demands });
  res.json({ success: true, demand: newDemand, case: updated });
}

// 15. Legal Library Lookup (Section 2 & Section 8)
async function getLegalLibrary(req, res) {
  const articles = await dbService.readJSON('legal_library');
  res.json(articles);
}

module.exports = {
  getAllCases,
  getCaseById,
  searchCases,
  createCase,
  adminScreeningReview,
  scheduleFirstHearing,
  requestLawyerAppointment,
  respondLawyerAppointment,
  removeLawyer,
  defendantChooseRepresentation,
  requestPostponement,
  classifyEvidence,
  logHearingSession,
  issueFinalVerdict,
  addCaseNote,
  demandDocuments,
  getLegalLibrary
};
