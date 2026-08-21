'use strict';
const fs = require('fs');
const path = require('path');
const dbService = require('../services/dbService');
const auditService = require('../services/auditService');
const smsService = require('../services/smsService');
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
    const tempPassword = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit PIN

    const docs = files.map(f => ({
      id: 'DOC-' + Date.now() + '-' + Math.round(Math.random()*1000),
      name: f.originalname,
      path: f.path,
      size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
      uploadedBy: body.filerName || body.petitioner || 'Plaintiff',
      uploadedAt: new Date().toISOString(),
      confidentialityFlag: body.confidentialityFlag || 'standard',
      classificationStatus: 'pending_review'
    }));

    const filerName = body.filerName || body.petitioner || 'Litigant Citizen';
    const filerPhone = body.filerPhone || body.phone || '+251 911 123 456';
    const defendantName = body.defendantName || body.respondent || 'Named Respondent';
    const defendantPhone = body.defendantPhone || body.respondentPhone || '+251 922 887 766';

    const newCase = {
      caseId,
      trackingCode,
      caseTitle: body.caseTitle || (filerName + ' vs. ' + defendantName),
      petitioner: filerName,
      filerName: filerName,
      filerPhone: filerPhone,
      filerEmail: body.filerEmail || body.email || '',
      filerAddress: body.filerAddress || body.address || '',
      filerRole: body.filerRole || 'citizen',
      respondent: defendantName,
      defendantName: defendantName,
      defendantPhone: defendantPhone,
      defendantEmail: body.defendantEmail || '',
      defendantAddress: body.defendantAddress || '',
      defendantType: body.defendantType || 'Individual Citizen',
      courtLevel: body.courtLevel || 'Federal High Court (FHC)',
      jurisdiction: body.jurisdiction || 'Federal Supreme Court (Sidist Kilo)',
      caseType: body.caseType || 'Civil Dispute',
      description: body.description || '',
      incidentDate: body.incidentDate || '',
      incidentLocation: body.incidentLocation || '',
      filingDate: new Date().toISOString(),
      status: 'pending_screening',
      screeningStatus: 'pending',
      screeningNotes: '',
      relevantLawArticle: body.relevantLawArticle || '',
      pin: tempPassword,
      casePin: tempPassword,
      tempPin: tempPassword,
      judgeName: 'Unassigned',
      judgeId: null,
      clerkName: 'Unassigned',
      courtroom: 'TBD',
      hearingDate: null,
      hearingTime: null,
      isCriminal: body.caseType === 'Criminal Proceedings' || body.isProsecutor === 'true' || body.isProsecutor === true,
      lawyerAppointed: null,
      defendantRepresentation: {
        type: 'pending_choice',
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

    // Send SMS Confirmation to Filer via FSC Gateway
    if (newCase.filerPhone) {
      const filerMsg = 'FSC Court Notice: Your case ' + newCase.caseId + ' has been filed. Tracking Code: ' + newCase.trackingCode + '. Case PIN: ' + tempPassword + '. Access: http://localhost:5001/file-case';
      await smsService.sendRawSMS(newCase.filerPhone, filerMsg, 'Filing Confirmation');
    }

    // Send Official Summons SMS to Defendant
    if (newCase.defendantPhone) {
      const defMsg = 'FSC Judicial Summons: Legal case ' + newCase.caseId + ' filed against you at ' + newCase.jurisdiction + '. Access docket: http://localhost:5001/file-case with PIN: ' + tempPassword;
      await smsService.sendRawSMS(newCase.defendantPhone, defMsg, 'Judicial Summons');
    }

    await dispatchWebhook('CASE_FILED', { caseId: newCase.caseId, petitioner: newCase.petitioner });
    res.status(201).json({
      success: true,
      case: newCase,
      caseId: newCase.caseId,
      trackingCode: newCase.trackingCode,
      filerPhone: newCase.filerPhone,
      tempPin: tempPassword,
      tempPassword
    });
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
  const { caseId, licenseNumber, side, clientName, note } = req.body;
  if (!licenseNumber) return res.status(400).json({ error: 'Advocate license number required' });

  const lawyers = await dbService.readJSON('lawyers');
  const lic = licenseNumber.toString().trim().toUpperCase();
  const lawyer = lawyers.find(l => 
    (l.licenseNumber && l.licenseNumber.toUpperCase() === lic) || 
    l.id === licenseNumber || 
    l.username === licenseNumber
  );

  if (!lawyer) {
    return res.status(404).json({ error: 'Advocate with license number "' + licenseNumber + '" not found in Federal Supreme Court Bar registry' });
  }

  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case ' + caseId + ' not found' });

  const isDef = (side === 'defendant' || side === 'respondent');

  let updateFields = {};
  if (isDef) {
    updateFields = {
      pendingDefendantLawyerRequest: {
        lawyerId: lawyer.id,
        lawyerName: lawyer.fullName,
        licenseNumber: lawyer.licenseNumber,
        side: 'defendant',
        requestedBy: clientName || caseItem.respondent || caseItem.defendantName || 'Defendant',
        requestedAt: new Date().toISOString(),
        status: 'pending',
        note: note || ''
      },
      defendantRepresentation: {
        type: 'pending_request',
        lawyerName: lawyer.fullName,
        licenseNumber: lawyer.licenseNumber,
        requestedAt: new Date().toISOString()
      },
      defendantActivated: true
    };
  } else {
    updateFields = {
      pendingLawyerRequest: {
        lawyerId: lawyer.id,
        lawyerName: lawyer.fullName,
        licenseNumber: lawyer.licenseNumber,
        side: 'plaintiff',
        requestedBy: clientName || caseItem.petitioner || 'Plaintiff',
        requestedAt: new Date().toISOString(),
        status: 'pending',
        note: note || ''
      }
    };
  }

  const updated = await dbService.updateOne('cases', { caseId }, updateFields);

  // Send SMS to lawyer if phone exists
  if (lawyer.phone) {
    const msg = 'FSC Alert: ' + (isDef ? 'Defendant ' + (caseItem.respondent || 'Dagim') : 'Plaintiff ' + (caseItem.petitioner || 'Adnan')) + ' has submitted a representation request for Case ' + caseId + '. Please log in to accept or decline.';
    await smsService.sendRawSMS(lawyer.phone, msg, 'Advocate Mandate Request');
  }

  return res.json({ success: true, message: 'Representation request successfully transmitted to Advocate ' + lawyer.fullName, case: updated });
}

async function respondLawyerAppointment(req, res) {
  const { caseId, lawyerId, action, notes } = req.body;
  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  const isDefendantReq = caseItem.pendingDefendantLawyerRequest && 
    (caseItem.pendingDefendantLawyerRequest.lawyerId === lawyerId || !caseItem.pendingLawyerRequest);

  const reqData = isDefendantReq ? (caseItem.pendingDefendantLawyerRequest || {}) : (caseItem.pendingLawyerRequest || {});

  if (action === 'accept') {
    const lawyers = await dbService.readJSON('lawyers');
    const lawyerObj = lawyers.find(l => l.id === lawyerId || l.licenseNumber === reqData.licenseNumber) || {};

    const appointedLawyerName = lawyerObj.fullName || reqData.lawyerName || 'Advocate';
    const appointedLawyerLic = lawyerObj.licenseNumber || reqData.licenseNumber || 'LAW-1001';

    let updateFields = {};
    if (isDefendantReq) {
      updateFields = {
        defendantRepresentation: {
          type: 'appointed_lawyer',
          lawyerId: lawyerId || lawyerObj.id || 'LAWYER-001',
          lawyerName: appointedLawyerName,
          licenseNumber: appointedLawyerLic,
          appointedAt: new Date().toISOString(),
          status: 'active'
        },
        defendantLawyerName: appointedLawyerName,
        defendantLawyerId: lawyerId || lawyerObj.id,
        defendantLawyerLic: appointedLawyerLic,
        pendingDefendantLawyerRequest: null,
        defendantActivated: true
      };
    } else {
      updateFields = {
        lawyerAppointed: {
          lawyerId: lawyerId || lawyerObj.id || 'LAWYER-001',
          lawyerName: appointedLawyerName,
          licenseNumber: appointedLawyerLic,
          appointedAt: new Date().toISOString(),
          status: 'active'
        },
        lawyerName: appointedLawyerName,
        plaintiffLawyerName: appointedLawyerName,
        plaintiffLawyerId: lawyerId || lawyerObj.id,
        clientAccessMode: 'read_only_with_full_visibility',
        pendingLawyerRequest: null
      };
    }

    const updated = await dbService.updateOne('cases', { caseId }, updateFields);

    const clientPhone = isDefendantReq ? (caseItem.defendantPhone || caseItem.phone) : (caseItem.filerPhone || caseItem.phone);
    if (clientPhone) {
      const msg = 'FSC Alert: Advocate ' + appointedLawyerName + ' has accepted your legal representation mandate for case ' + caseId + '. Official representation active.';
      await smsService.sendRawSMS(clientPhone, msg, 'Lawyer Mandate Accepted');
    }

    await dbService.insert('audit_logs', {
      id: 'AUD-' + Date.now(),
      action: 'LAWYER_APPOINTMENT_ACCEPTED',
      user: appointedLawyerName,
      role: 'lawyer',
      caseId,
      timestamp: new Date().toISOString(),
      details: isDefendantReq ? 'Appointed for Defendant (Dagim)' : 'Appointed for Plaintiff (Adnan)'
    });

    return res.json({ success: true, status: 'accepted', case: updated });
  } else {
    // Lawyer declines appointment
    let updateFields = {};
    if (isDefendantReq) {
      updateFields = {
        pendingDefendantLawyerRequest: null,
        defendantRepresentation: {
          type: 'declined',
          status: 'Lawyer declined representation'
        }
      };
    } else {
      const declineCount = (caseItem.lawyerDeclinesCount || 0) + 1;
      updateFields = {
        lawyerDeclinesCount: declineCount,
        pendingLawyerRequest: null
      };
    }

    const updated = await dbService.updateOne('cases', { caseId }, updateFields);

    await dbService.insert('audit_logs', {
      id: 'AUD-' + Date.now(),
      action: 'LAWYER_APPOINTMENT_DECLINED',
      user: 'Advocate ' + lawyerId,
      role: 'lawyer',
      caseId,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      status: 'declined',
      message: 'Lawyer declined appointment. Client may search another lawyer or request government counsel.'
    });
  }
}

async function removeLawyer(req, res) {
  const { caseId, clientName, side } = req.body;
  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  const isDef = (side === 'defendant' || side === 'respondent' || (clientName && clientName.toLowerCase().includes('dagim')));

  let updateFields = {};
  let prevLawyer = null;

  if (isDef) {
    prevLawyer = caseItem.defendantRepresentation;
    updateFields = {
      defendantRepresentation: {
        type: 'self',
        lawyerName: null,
        licenseNumber: null,
        chosenAt: new Date().toISOString()
      },
      defendantLawyerName: null,
      defendantLawyerId: null,
      defendantLawyerLic: null,
      pendingDefendantLawyerRequest: null
    };
  } else {
    prevLawyer = caseItem.lawyerAppointed;
    updateFields = {
      lawyerAppointed: null,
      pendingLawyerRequest: null,
      lawyerName: null,
      plaintiffLawyerName: null,
      plaintiffLawyerId: null,
      clientAccessMode: 'full_control'
    };
  }

  const updated = await dbService.updateOne('cases', { caseId }, updateFields);

  // Send SMS notice to prev lawyer if phone exists
  if (prevLawyer && (prevLawyer.lawyerId || prevLawyer.licenseNumber)) {
    const lawyers = await dbService.readJSON('lawyers');
    const lawyerObj = lawyers.find(l => l.id === prevLawyer.lawyerId || l.licenseNumber === prevLawyer.licenseNumber);
    if (lawyerObj && lawyerObj.phone) {
      const msg = 'FSC Notice: Legal representation mandate for case ' + caseId + ' has been revoked. Docket returned to self-representation.';
      await smsService.sendRawSMS(lawyerObj.phone, msg, 'Lawyer Mandate Revoked');
    }
  }

  await dbService.insert('audit_logs', {
    id: 'AUD-' + Date.now(),
    action: 'LAWYER_REMOVED_BY_CLIENT',
    user: clientName || (isDef ? 'Dagim' : 'Adnan'),
    role: isDef ? 'defendant' : 'plaintiff',
    caseId,
    timestamp: new Date().toISOString(),
    details: (isDef ? 'Defendant' : 'Plaintiff') + ' revoked lawyer and resumed direct self-representation.'
  });

  return res.json({ success: true, message: 'Legal representation mandate successfully revoked. Direct self-representation active.', case: updated });
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
        licenseNumber: null,
        chosenAt: new Date().toISOString()
      },
      defendantLawyerName: null,
      defendantLawyerId: null,
      pendingDefendantLawyerRequest: null
    });
    return res.json({ success: true, representation: 'self', case: updated, message: 'Self-representation confirmed.' });
  }

  if (choiceType === 'government_lawyer') {
    const allLawyers = await dbService.readJSON('lawyers');
    const govLawyers = allLawyers.filter(l => l.isGovernmentLawyer === true || (l.specialization && l.specialization.includes('Public')));

    if (govLawyers.length === 0) {
      const updated = await dbService.updateOne('cases', { caseId }, {
        defendantActivated: true,
        defendantRepresentation: {
          type: 'representation_pending',
          status: 'Government Lawyer Pool Empty - Sourcing in progress'
        }
      });
      return res.json({ success: true, representation: 'representation_pending', message: 'Representation pending sourcing.' });
    }

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
      },
      defendantLawyerName: assignedGovLawyer.fullName,
      defendantLawyerId: assignedGovLawyer.id,
      defendantLawyerLic: assignedGovLawyer.licenseNumber,
      pendingDefendantLawyerRequest: null
    });

    return res.json({ success: true, representation: 'government_lawyer', assignedLawyer: assignedGovLawyer, case: updated, message: 'State Public Defender assigned: ' + assignedGovLawyer.fullName });
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
  const { 
    caseId, 
    judgePresence,
    plaintiffPresence, 
    defendantPresence, 
    prosecutorPresence,
    stage,
    minutes, 
    oralSubmissions, 
    exhibitsAdmitted,
    courtOrder,
    nextHearingDate,
    nextHearingTime,
    courtroom,
    nextHearingAgenda,
    clerkName,
    clerkId
  } = req.body;

  const caseItem = await dbService.findOne('cases', { caseId });
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });

  const sessionEntry = {
    id: 'SESS-' + Date.now(),
    date: new Date().toISOString(),
    sessionDate: new Date().toISOString().split('T')[0],
    clerkName: clerkName || 'Court Clerk Kalkidan Mengistu',
    clerkId: clerkId || 'CLERK-001',
    attendance: {
      judge: judgePresence || 'Present',
      plaintiff: plaintiffPresence || 'Present',
      defendant: defendantPresence || 'Present',
      prosecutor: prosecutorPresence || 'N/A'
    },
    stage: stage || 'Oral Arguments',
    minutes: minutes || 'Oral arguments and evidence inspection completed.',
    oralSubmissions: oralSubmissions || 'Pleadings affirmed by respective counsel.',
    exhibitsAdmitted: exhibitsAdmitted || 'None',
    courtOrder: courtOrder || 'Court adjourned to next scheduled session.',
    nextHearingDate: nextHearingDate || null,
    nextHearingTime: nextHearingTime || null,
    courtroom: courtroom || null,
    nextHearingAgenda: nextHearingAgenda || null
  };

  const sessionSummaries = caseItem.sessionSummaries || [];
  sessionSummaries.push(sessionEntry);

  const updated = await dbService.updateOne('cases', { caseId }, {
    sessionSummaries,
    ...(nextHearingDate && { hearingDate: nextHearingDate }),
    ...(nextHearingTime && { hearingTime: nextHearingTime }),
    ...(courtroom && { courtroom }),
    ...(nextHearingAgenda && { hearingType: nextHearingAgenda })
  });

  await dbService.insert('audit_logs', {
    id: 'AUD-' + Date.now(),
    action: 'COURT_SESSION_MINUTES_LOGGED',
    user: clerkName || 'Court Clerk',
    role: 'clerk',
    caseId,
    details: 'Attendance and procedural minutes recorded for ' + stage,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, session: sessionEntry, case: updated });
}

// 11.2 Clerk Register Incoming Filing
async function registerFiling(req, res) {
  const { caseId, formalDocketNumber, assignedJudge, branchName, caseCategory, clerkName, clerkId } = req.body;
  const caseItem = await dbService.findOne('cases', { caseId });
  
  const targetId = formalDocketNumber || caseId;

  if (caseItem) {
    const updated = await dbService.updateOne('cases', { caseId }, {
      caseId: targetId,
      status: 'Active',
      assignedJudge: assignedJudge || caseItem.assignedJudge || 'Hon. Judge Solomon Desta',
      branchName: branchName || caseItem.branchName || 'Federal Supreme Court (የፌዴራል ጠቅላይ ፍርድ ቤት)',
      caseCategory: caseCategory || caseItem.caseCategory || 'Civil & Commercial',
      caseType: caseCategory || caseItem.caseType || 'Civil & Commercial',
      clerkName: clerkName || 'Kalkidan Mengistu',
      clerkId: clerkId || 'CLERK-001',
      registeredBy: clerkName || 'Kalkidan Mengistu',
      dateFiled: new Date().toISOString().split('T')[0]
    });

    await dbService.insert('audit_logs', {
      id: 'AUD-' + Date.now(),
      action: 'FILING_REGISTERED_DOCKET_ISSUED',
      user: clerkName || 'Court Clerk',
      role: 'clerk',
      caseId: targetId,
      timestamp: new Date().toISOString()
    });

    return res.json({ success: true, case: updated });
  } else {
    const newCase = {
      caseId: targetId,
      caseTitle: 'New Registered Docket ' + targetId,
      status: 'Active',
      assignedJudge: assignedJudge || 'Hon. Judge Solomon Desta',
      branchName: branchName || 'Federal Supreme Court (የፌዴራል ጠቅላይ ፍርድ ቤት)',
      caseCategory: caseCategory || 'Civil & Commercial',
      caseType: caseCategory || 'Civil & Commercial',
      clerkName: clerkName || 'Kalkidan Mengistu',
      clerkId: clerkId || 'CLERK-001',
      registeredBy: clerkName || 'Kalkidan Mengistu',
      dateFiled: new Date().toISOString().split('T')[0],
      documents: []
    };
    await dbService.insert('cases', newCase);
    return res.status(201).json({ success: true, case: newCase });
  }
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


async function markCaseAsViewed(req, res) {
  const { id } = req.params;
  const updated = await dbService.updateOne('cases', { caseId: id }, {
    adminViewed: true,
    adminViewedAt: new Date().toISOString()
  });
  if (!updated) return res.status(404).json({ error: 'Case not found' });
  res.json({ success: true, case: updated });
}


// 16. Real-Time Chamber, Judge & Lawyer Availability Check (Section 5 & 7)
async function checkAvailability(req, res) {
  try {
    const targetDate = req.query.date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const cases = await dbService.readJSON('cases');
    const judges = await dbService.readJSON('judges');
    const lawyers = await dbService.readJSON('lawyers');

    // Find all cases with hearings on targetDate
    const dateCases = cases.filter(c => c.hearingDate === targetDate);

    // Compute Judge Availability (Max 3 hearings per day per judge)
    const judgeAvailability = judges.map(j => {
      const bookedHearings = dateCases.filter(c => c.judgeId === j.id || (c.judgeName && c.judgeName.includes(j.fullName.split(' ')[2] || '')));
      const bookedCount = bookedHearings.length;
      const isAvailable = bookedCount < 3;
      return {
        id: j.id,
        fullName: j.fullName,
        branch: j.branch,
        courtroom: j.courtroom,
        isAvailable,
        bookedCount,
        slotsRemaining: Math.max(0, 3 - bookedCount),
        statusText: isAvailable ? `Available (${bookedCount} hearings booked, ${3 - bookedCount} slots open)` : 'Unavailable (Chamber Booked at Full Capacity)'
      };
    });

    // Compute Lawyer Availability (No conflicting appearances at same date/time)
    const lawyerAvailability = lawyers.map(l => {
      const conflicts = dateCases.filter(c => {
        const isPlaintiffLawyer = c.plaintiffLawyerLicense === l.licenseNumber || (c.lawyerAppointed && c.lawyerAppointed.licenseNumber === l.licenseNumber);
        const isDefenseLawyer = c.defendantLawyerLicense === l.licenseNumber || (c.defendantRepresentation && c.defendantRepresentation.licenseNumber === l.licenseNumber);
        return isPlaintiffLawyer || isDefenseLawyer;
      });

      const isAvailable = conflicts.length === 0;
      return {
        id: l.id,
        fullName: l.fullName,
        licenseNumber: l.licenseNumber,
        specialization: l.specialization,
        isGovernmentLawyer: l.isGovernmentLawyer || false,
        isAvailable,
        conflictingCaseId: conflicts.length > 0 ? conflicts[0].caseId : null,
        statusText: isAvailable ? 'Available (No schedule conflicts)' : `Unavailable (Scheduled on ${conflicts[0].caseId})`
      };
    });

    // Courtroom Availability
    const courtrooms = [
      { name: 'Courtroom 1A (Cassation Bench)', isAvailable: true },
      { name: 'Courtroom 1B (Appellate Bench)', isAvailable: true },
      { name: 'Courtroom 2A (Commercial Division)', isAvailable: true },
      { name: 'Courtroom 4 (Main Trial Room)', isAvailable: true }
    ];

    res.json({
      date: targetDate,
      judges: judgeAvailability,
      lawyers: lawyerAvailability,
      courtrooms
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}



// ── PROSECUTOR WORKSPACE HANDLERS ──

async function getWitnesses(req, res) {
  try {
    const witnesses = await dbService.find('witnesses');
    res.json(witnesses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createWitness(req, res) {
  try {
    const { caseId, witnessName, protectionLevel, assignedOfficer, details } = req.body;
    const newWitness = {
      id: 'WIT-' + Math.floor(1000 + Math.random() * 9000),
      caseId: caseId || 'CASE-178721589765',
      witnessName: witnessName || 'Concealed Witness ' + Math.floor(100 + Math.random() * 900),
      protectionLevel: protectionLevel || 'High Security Safehouse Relocation',
      assignedOfficer: assignedOfficer || 'Cmdr. Teklu Assefa (Fed Police)',
      details: details || 'In-Camera testimony order granted under FSC Rule 44.',
      createdAt: new Date().toISOString()
    };
    await dbService.insert('witnesses', newWitness);
    res.status(201).json({ success: true, witness: newWitness });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getDocumentDemands(req, res) {
  try {
    const demands = await dbService.find('document_demands');
    res.json(demands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createDocumentDemandOrder(req, res) {
  try {
    const { caseId, respondent, demandTitle, description, deadline } = req.body;
    const newDemand = {
      id: 'DEM-' + Math.floor(1000 + Math.random() * 9000),
      caseId: caseId || 'CASE-178721589765',
      respondent: respondent || 'National Bank of Ethiopia',
      demandTitle: demandTitle || 'Subpoena Duces Tecum for Account Records',
      description: description || 'Certified wire records and transaction journals.',
      deadline: deadline || '7 Days',
      status: 'Awaiting Response',
      daysOpen: 1,
      issuedAt: new Date().toISOString()
    };
    await dbService.insert('document_demands', newDemand);
    res.status(201).json({ success: true, demand: newDemand });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateDocumentDemandStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, responseNotes } = req.body;
    const updated = await dbService.updateOne('document_demands', { id }, {
      status: status || 'Received',
      responseNotes: responseNotes || 'Records received from entity.',
      respondedAt: new Date().toISOString()
    });
    res.json({ success: true, demand: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function fileProsecutorIndictment(req, res) {
  try {
    const body = req.body;
    const files = req.files || [];
    const caseId = 'CASE-' + Date.now();
    const trackingCode = 'ET-FSC-' + Math.floor(100000 + Math.random() * 900000);

    const docs = files.map(f => ({
      id: 'DOC-' + Date.now() + '-' + Math.round(Math.random() * 1000),
      name: f.originalname,
      path: f.path,
      url: '/uploads/' + f.filename,
      size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
      uploadedBy: 'Senior Public Prosecutor Bereket Girma',
      uploadedAt: new Date().toISOString(),
      confidentialityFlag: 'standard',
      classificationStatus: 'shared'
    }));

    // If no files uploaded, link default certified pleading
    if (docs.length === 0) {
      docs.push({
        id: 'DOC-' + Date.now(),
        name: 'Formal_State_Indictment_Charge_Sheet.pdf',
        url: '/uploads/82da9408-eb57-4183-b3c1-b0db036573c0-supporting_documents_and_evidence.pdf',
        size: '2.40 MB',
        uploadedBy: 'Senior Public Prosecutor Bereket Girma',
        uploadedAt: new Date().toISOString(),
        classificationStatus: 'shared'
      });
    }

    const newCase = {
      caseId,
      trackingCode,
      caseTitle: 'The State vs. ' + (body.defendantName || 'Accused Defendant'),
      petitioner: 'Federal Democratic Republic of Ethiopia (State Prosecution)',
      respondent: body.defendantName || 'Named Defendant',
      filerPhone: '+251 11 552 8899',
      respondentPhone: body.defendantPhone || '+251 911 000 111',
      jurisdiction: body.courtDivision || 'Federal Supreme Court (Sidist Kilo)',
      courtDivision: body.courtDivision || 'Federal Supreme Court',
      caseType: 'Criminal Felony Prosecution',
      caseCategory: 'Criminal',
      charges: body.charges || 'Commercial Fraud & Forgery',
      penalCode: body.penalCode || 'Art. 689',
      prosecutorId: 'PROS-2001',
      prosecutorName: 'Senior Public Prosecutor Bereket Girma',
      assignedJudge: 'Hon. Judge Solomon Desta',
      courtroom: 'Courtroom 4',
      filingDate: new Date().toISOString().split('T')[0],
      status: 'Assigned',
      screeningStatus: 'approved',
      hearingDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      hearingTime: '09:30 AM',
      nextHearing: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 09:30 AM',
      documents: docs,
      docketHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          action: 'Formal Indictment Filed by State Prosecution',
          by: 'Senior Public Prosecutor Bereket Girma'
        }
      ]
    };

    await dbService.insert('cases', newCase);
    res.status(201).json({ success: true, case: newCase });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function uploadExhibit(req, res) {
  try {
    const { caseId, exhibitCategory } = req.body;
    const files = req.files || [];
    const caseItem = await dbService.findOne('cases', { caseId });
    if (!caseItem) return res.status(404).json({ error: 'Case not found' });

    const currentDocs = caseItem.documents || [];
    const newDocs = files.map(f => ({
      id: 'DOC-' + Date.now() + '-' + Math.round(Math.random() * 1000),
      name: f.originalname,
      url: '/uploads/' + f.filename,
      path: f.path,
      size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: exhibitCategory || 'Forensic Exhibit',
      uploadedBy: 'Senior Public Prosecutor Bereket Girma',
      uploadedAt: new Date().toISOString(),
      classificationStatus: 'shared'
    }));

    if (newDocs.length === 0) {
      newDocs.push({
        id: 'DOC-' + Date.now(),
        name: (exhibitCategory || 'Admissible_Forensic_Evidence') + '.pdf',
        url: '/uploads/82da9408-eb57-4183-b3c1-b0db036573c0-supporting_documents_and_evidence.pdf',
        size: '1.85 MB',
        type: exhibitCategory || 'Forensic Exhibit',
        uploadedBy: 'Senior Public Prosecutor Bereket Girma',
        uploadedAt: new Date().toISOString(),
        classificationStatus: 'shared'
      });
    }

    const updatedDocs = currentDocs.concat(newDocs);
    const updated = await dbService.updateOne('cases', { caseId }, { documents: updatedDocs });
    res.json({ success: true, case: updated, addedCount: newDocs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function scheduleProsecutorHearing(req, res) {
  try {
    const { caseId, hearingDate, hearingTime, courtroom, judgeName } = req.body;
    const caseItem = await dbService.findOne('cases', { caseId });
    if (!caseItem) return res.status(404).json({ error: 'Case not found' });

    const nextHearingStr = (hearingDate || '2026-05-28') + ' ' + (hearingTime || '09:30 AM');
    const updated = await dbService.updateOne('cases', { caseId }, {
      hearingDate: hearingDate || '2026-05-28',
      hearingTime: hearingTime || '09:30 AM',
      courtroom: courtroom || 'Courtroom 4',
      assignedJudge: judgeName || caseItem.assignedJudge || 'Hon. Judge Solomon Desta',
      nextHearing: nextHearingStr,
      status: 'Hearing'
    });

    res.json({ success: true, case: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function transmitBenchMemo(req, res) {
  try {
    const { caseId, judgeName, memorandum } = req.body;
    const caseItem = await dbService.findOne('cases', { caseId });
    if (!caseItem) return res.status(404).json({ error: 'Case not found' });

    const notes = caseItem.caseNotes || [];
    const newNote = {
      id: 'MEMO-' + Date.now(),
      note: 'BENCH MEMORANDUM to ' + (judgeName || 'Hon. Judge Solomon Desta') + ': ' + memorandum,
      author: 'Senior Public Prosecutor Bereket Girma',
      role: 'prosecutor',
      timestamp: new Date().toISOString()
    };
    notes.unshift(newNote);

    const updated = await dbService.updateOne('cases', { caseId }, { caseNotes: notes });
    res.json({ success: true, note: newNote, case: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}



// ── PROSECUTOR COMPREHENSIVE CONTROLLERS ──
const getProsecutorCases = async (req, res) => {
  try {
    const prosId = req.query.prosecutorId || 'PROS-2001';
    const prosName = req.query.prosecutorName || 'Bereket';
    const cases = await dbService.readJSON('cases');
    const myCases = cases.filter(c => 
      c.prosecutorId === prosId || 
      (c.prosecutorName && c.prosecutorName.toLowerCase().includes(prosName.toLowerCase())) ||
      (c.leadProsecutor && c.leadProsecutor.toLowerCase().includes(prosName.toLowerCase()))
    );
    res.json(myCases);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load prosecutor cases: ' + err.message });
  }
};

const getProsecutorMessages = (req, res) => {
  try {
    const p = path.join(__dirname, '../data/messages.json');
    if (!fs.existsSync(p)) return res.json([]);
    const msgs = JSON.parse(fs.readFileSync(p, 'utf8'));
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load messages' });
  }
};

const sendProsecutorMessage = (req, res) => {
  try {
    const { recipient, subject, content, caseId, priority } = req.body;
    const p = path.join(__dirname, '../data/messages.json');
    let msgs = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
    const newMsg = {
      id: 'MSG-PROS-' + Date.now().toString().slice(-4),
      sender: 'Senior Public Prosecutor Bereket Girma',
      senderRole: 'Public Prosecutor (PROS-2001)',
      recipient: recipient || 'Chief Registrar',
      subject: subject || 'Official Prosecution Notice',
      content: content || '',
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: priority || 'NORMAL',
      caseId: caseId || 'CASE-178721589765'
    };
    msgs.unshift(newMsg);
    fs.writeFileSync(p, JSON.stringify(msgs, null, 2), 'utf8');
    res.status(201).json({ success: true, message: newMsg });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message: ' + err.message });
  }
};

const getProsecutorAppeals = (req, res) => {
  try {
    const p = path.join(__dirname, '../data/appeals.json');
    if (!fs.existsSync(p)) return res.json([]);
    const apps = JSON.parse(fs.readFileSync(p, 'utf8'));
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load appeals' });
  }
};

const createProsecutorAppeal = (req, res) => {
  try {
    const { caseId, defendantName, originalCourt, appealCourt, grounds } = req.body;
    const p = path.join(__dirname, '../data/appeals.json');
    let apps = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
    const newApp = {
      id: 'APP-2026-' + (apps.length + 1).toString().padStart(3, '0'),
      caseId: caseId || 'CASE-178721599881',
      defendantName: defendantName || 'Defendant',
      originalCourt: originalCourt || 'Federal High Court',
      appealCourt: appealCourt || 'Federal Supreme Court — Appellate Division',
      grounds: grounds || 'Error of law in lower court adjudication.',
      filingDate: new Date().toISOString().split('T')[0],
      status: 'Brief Filed',
      hearingDate: '2026-06-15 09:30 AM',
      leadProsecutor: 'Bereket Girma'
    };
    apps.unshift(newApp);
    fs.writeFileSync(p, JSON.stringify(apps, null, 2), 'utf8');
    res.status(201).json({ success: true, appeal: newApp });
  } catch (err) {
    res.status(500).json({ error: 'Failed to file appeal: ' + err.message });
  }
};

const getProsecutorVerdicts = (req, res) => {
  try {
    const p = path.join(__dirname, '../data/verdicts.json');
    if (!fs.existsSync(p)) return res.json([]);
    const vrds = JSON.parse(fs.readFileSync(p, 'utf8'));
    res.json(vrds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load verdicts' });
  }
};

const getProsecutorAssignments = (req, res) => {
  try {
    const p = path.join(__dirname, '../data/assignments.json');
    if (!fs.existsSync(p)) return res.json([]);
    const asns = JSON.parse(fs.readFileSync(p, 'utf8'));
    res.json(asns);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load assignments' });
  }
};

const createProsecutorAssignment = (req, res) => {
  try {
    const { caseId, caseTitle, coProsecutor, chiefInvestigator, priority } = req.body;
    const p = path.join(__dirname, '../data/assignments.json');
    let asns = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
    const newAsn = {
      id: 'ASN-2026-' + (asns.length + 1).toString().padStart(3, '0'),
      caseId: caseId || 'CASE-178721589765',
      caseTitle: caseTitle || 'The State vs. Accused',
      leadProsecutor: 'Bereket Girma (PROS-2001)',
      coProsecutor: coProsecutor || 'Tigist Haile (PROS-2004)',
      chiefInvestigator: chiefInvestigator || 'Cmdr. Teklu Assefa',
      priority: priority || 'HIGH',
      status: 'Assigned',
      assignmentDate: new Date().toISOString().split('T')[0]
    };
    asns.unshift(newAsn);
    fs.writeFileSync(p, JSON.stringify(asns, null, 2), 'utf8');
    res.status(201).json({ success: true, assignment: newAsn });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign prosecutor: ' + err.message });
  }
};

module.exports = {
  getProsecutorCases,
  getProsecutorMessages,
  sendProsecutorMessage,
  getProsecutorAppeals,
  createProsecutorAppeal,
  getProsecutorVerdicts,
  getProsecutorAssignments,
  createProsecutorAssignment,
  checkAvailability,
  markCaseAsViewed,
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
  registerFiling,
  issueFinalVerdict,
  addCaseNote,
  demandDocuments,
  getLegalLibrary,
  getWitnesses,
  createWitness,
  getDocumentDemands,
  createDocumentDemandOrder,
  updateDocumentDemandStatus,
  fileProsecutorIndictment,
  uploadExhibit,
  scheduleProsecutorHearing,
  transmitBenchMemo
};
