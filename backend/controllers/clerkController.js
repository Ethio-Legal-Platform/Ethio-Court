'use strict';
const dbService = require('../services/dbService');

async function getClerks(req, res) {
  const clerks = await dbService.readJSON('clerks');
  res.json(clerks);
}

async function registerDocket(req, res) {
  const { tempId, permanentCaseId, caseTitle, filerName } = req.body;
  const newCase = {
    caseId: permanentCaseId || ('CASE-' + Date.now()),
    tempId,
    caseTitle: caseTitle || (filerName + ' vs. Respondent'),
    petitioner: filerName,
    registeredBy: 'Kalkidan Mengistu',
    registeredAt: new Date().toISOString(),
    status: 'Active'
  };
  await dbService.insert('cases', newCase);
  res.status(201).json({ success: true, case: newCase });
}

module.exports = { getClerks, registerDocket };
