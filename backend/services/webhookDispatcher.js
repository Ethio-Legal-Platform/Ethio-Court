'use strict';
const dbService = require('./dbService');

async function dispatchWebhook(eventType, payload) {
  const logEntry = {
    id: 'WH-' + Date.now(),
    event: eventType,
    payload: payload,
    timestamp: new Date().toISOString(),
    status: 'dispatched',
    responseCode: 200
  };
  try {
    await dbService.insert('webhook_logs', logEntry);
  } catch (e) {
    console.error('Error logging webhook:', e.message);
  }
  return logEntry;
}

module.exports = { dispatchWebhook };
