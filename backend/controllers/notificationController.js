'use strict';
const dbService = require('../services/dbService');

async function getSmsLogs(req, res) {
  const logs = await dbService.readJSON('sms_logs');
  res.json(logs);
}

async function sendSms(req, res) {
  const { phone, message, caseId, type } = req.body;
  const newLog = {
    id: 'SMS-' + Date.now(),
    time: new Date().toLocaleString(),
    phone,
    caseId: caseId || 'GENERAL',
    type: type || 'Court Notice',
    status: 'Sent',
    statusClass: 'pill-green',
    sentBy: 'Kalkidan M.'
  };
  await dbService.insert('sms_logs', newLog);
  res.status(201).json({ success: true, sms: newLog });
}

async function getNotifications(req, res) {
  const notifs = await dbService.readJSON('notifications');
  res.json(notifs);
}

module.exports = { getSmsLogs, sendSms, getNotifications };
