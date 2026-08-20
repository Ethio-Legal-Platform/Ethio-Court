'use strict';
const dbService = require('../services/dbService');
const { dispatchWebhook } = require('../services/webhookDispatcher');

async function getAllCases(req, res) {
  const cases = await dbService.readJSON('cases');
  res.json(cases);
}

async function getCaseById(req, res) {
  const caseItem = await dbService.findOne('cases', { caseId: req.params.id });
  if (!caseItem) {
    return res.status(404).json({ error: 'Case not found' });
  }
  res.json(caseItem);
}

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

async function createCase(req, res) {
  try {
    const body = req.body;
    const files = req.files || [];
    const caseId = 'CASE-' + Date.now();
    const trackingCode = 'ET-FSC-' + Math.floor(100000 + Math.random() * 900000);

    const docs = files.map(f => ({
      name: f.originalname,
      path: f.path,
      size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
      uploadedAt: new Date().toISOString()
    }));

    const newCase = {
      caseId,
      trackingCode,
      caseTitle: body.caseTitle || (body.petitioner + ' vs. ' + body.respondent),
      petitioner: body.petitioner || 'Anonymous Litigant',
      respondent: body.respondent || 'Named Respondent',
      jurisdiction: body.jurisdiction || 'Federal Supreme Court',
      caseType: body.caseType || 'Civil / Corporate',
      filingDate: new Date().toISOString(),
      status: 'pending_screening',
      screeningStatus: 'pending',
      judgeName: 'Unassigned',
      courtroom: 'TBD',
      documents: docs,
      timeline: [
        { stage: 'Filed', date: new Date().toISOString(), note: 'Case filed electronically via Supreme Court e-Filing portal.' }
      ]
    };

    await dbService.insert('cases', newCase);

    // Send automated SMS notification
    if (body.filerPhone) {
      await dbService.insert('sms_logs', {
        id: 'SMS-' + Date.now(),
        time: new Date().toLocaleString(),
        phone: body.filerPhone,
        caseId: newCase.caseId,
        type: 'Filing Confirmation',
        status: 'Sent',
        statusClass: 'pill-green',
        sentBy: 'System Auto-Gateway'
      });
    }

    await dispatchWebhook('CASE_FILED', { caseId: newCase.caseId, petitioner: newCase.petitioner });
    res.status(201).json({ success: true, case: newCase });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateCaseStatus(req, res) {
  const { status, judgeName, courtroom, note } = req.body;
  const updated = await dbService.updateOne('cases', { caseId: req.params.id }, {
    status,
    ...(judgeName && { judgeName }),
    ...(courtroom && { courtroom })
  });
  if (!updated) {
    return res.status(404).json({ error: 'Case not found' });
  }
  res.json({ success: true, case: updated });
}

module.exports = {
  getAllCases,
  getCaseById,
  searchCases,
  createCase,
  updateCaseStatus
};
