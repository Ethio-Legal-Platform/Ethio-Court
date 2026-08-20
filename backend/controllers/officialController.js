'use strict';
const dbService = require('../services/dbService');

async function getOfficers(req, res) {
  const officers = await dbService.readJSON('officers');
  res.json(officers);
}

async function reviewFiling(req, res) {
  const { caseId, decision, comments, officerName } = req.body;
  const updated = await dbService.updateOne('cases', { caseId }, {
    screeningStatus: decision, // approved, clarification, rejected
    screeningNotes: comments,
    reviewedBy: officerName || 'Tesfaye Alemu',
    reviewedAt: new Date().toISOString()
  });
  res.json({ success: true, case: updated });
}

module.exports = { getOfficers, reviewFiling };
