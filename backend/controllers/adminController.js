'use strict';
const dbService = require('../services/dbService');

async function getSystemMetrics(req, res) {
  const [cases, lawyers, judges, officers, clerks] = await Promise.all([
    dbService.readJSON('cases'),
    dbService.readJSON('lawyers'),
    dbService.readJSON('judges'),
    dbService.readJSON('officers'),
    dbService.readJSON('clerks')
  ]);

  const metrics = {
    totalCases: cases.length,
    activeCases: cases.filter(c => c.status !== 'closed' && c.status !== 'archived').length,
    verifiedLawyers: lawyers.length,
    activeJudges: judges.length,
    courtOfficers: officers.length + clerks.length,
    systemUptime: '99.98%',
    serverTimestamp: new Date().toISOString()
  };
  res.json(metrics);
}

async function getAuditLogs(req, res) {
  const logs = await dbService.readJSON('audit_logs');
  res.json(logs);
}

async function getSystemHealth(req, res) {
  res.json({
    status: 'HEALTHY',
    mongoConnection: 'ONLINE_OR_LOCAL_FALLBACK',
    redisCache: 'CONNECTED',
    smsGateway: 'SMSEthiopia_ACTIVE',
    storageUsage: '14.2 GB / 500 GB',
    timestamp: new Date().toISOString()
  });
}


async function getBranchRequests(req, res) {
  const requests = await dbService.readJSON('branch_requests');
  requests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(requests);
}

async function markBranchRequestRead(req, res) {
  const { id } = req.params;
  const updated = await dbService.updateOne('branch_requests', { id }, {
    adminChecked: true,
    adminCheckedAt: new Date().toISOString()
  });
  if (!updated) return res.status(404).json({ error: 'Request not found' });
  res.json({ success: true, request: updated });
}

async function createBranchRequest(req, res) {
  const body = req.body;
  const newReq = {
    id: 'REQ-BR-' + Date.now(),
    branchId: body.branchId || 'BRANCH-001',
    branchName: body.branchName || 'Federal Court Branch',
    senderName: body.senderName || 'Branch Official',
    senderRole: body.senderRole || 'Official',
    requestType: body.requestType || 'Judicial Request',
    caseId: body.caseId || 'N/A',
    priority: body.priority || 'Standard',
    message: body.message || 'Advisory inquiry.',
    timestamp: new Date().toISOString(),
    adminChecked: false
  };
  await dbService.insert('branch_requests', newReq);
  res.status(201).json({ success: true, request: newReq });
}

module.exports = {
  getBranchRequests,
  markBranchRequestRead,
  createBranchRequest, getSystemMetrics, getAuditLogs, getSystemHealth };
