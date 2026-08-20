'use strict';
const dbService = require('../services/dbService');

async function getJudges(req, res) {
  const judges = await dbService.readJSON('judges');
  res.json(judges);
}

async function getCauseList(req, res) {
  const cases = await dbService.readJSON('cases');
  const scheduled = cases.filter(c => c.status === 'scheduled' || c.hearingDate);
  res.json(scheduled);
}

async function issueOrder(req, res) {
  const { caseId, orderType, notes, judgeName } = req.body;
  const order = {
    id: 'ORD-' + Date.now(),
    caseId,
    orderType,
    notes,
    judgeName: judgeName || 'Hon. Judge Solomon Desta',
    issuedAt: new Date().toISOString(),
    status: 'Issued'
  };
  await dbService.insert('orders', order);
  res.status(201).json({ success: true, order });
}

module.exports = { getJudges, getCauseList, issueOrder };
