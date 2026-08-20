'use strict';
const dbService = require('./dbService');

async function logAction({ user, role, action, module, caseId, details, beforeValue, afterValue, ip, status }) {
  try {
    const entry = {
      id: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      user: user || 'System User',
      role: (role || 'system').toLowerCase(),
      action: (action || 'ACTION').toUpperCase(),
      module: module || 'Judicial Core',
      caseId: caseId || 'N/A',
      details: details || '',
      beforeValue: beforeValue || null,
      afterValue: afterValue || null,
      ip: ip || '127.0.0.1',
      status: status || 'SUCCESS'
    };

    await dbService.insert('audit_logs', entry);
    return entry;
  } catch (err) {
    console.error('Audit Logging Error:', err.message);
    return null;
  }
}

async function getAuditLogs(roleFilter = 'all') {
  const allLogs = await dbService.readJSON('audit_logs');
  allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  if (!roleFilter || roleFilter === 'all') return allLogs;
  return allLogs.filter(l => (l.role || '').toLowerCase() === roleFilter.toLowerCase());
}

module.exports = {
  logAction,
  getAuditLogs
};
