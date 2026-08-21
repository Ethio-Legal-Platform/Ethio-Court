'use strict';
const https = require('https');
const dbService = require('./dbService');

// Normalize phone to Ethiopian standard MSISDN (2519XXXXXXXX or 2517XXXXXXXX)
function normalizeMsisdn(phone) {
  if (!phone) return '';
  let p = phone.toString().replace(/[\s\-\(\)\+]/g, '');
  if (p.startsWith('0')) {
    p = '251' + p.substring(1);
  } else if (!p.startsWith('251') && (p.startsWith('9') || p.startsWith('7'))) {
    p = '251' + p;
  }
  return p;
}

// SMSEthiopia Live Gateway Dispatch
async function sendRawSMS(phone, message, type = 'Notification') {
  const msisdn = normalizeMsisdn(phone);
  const smsId = 'SMS-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const timestamp = new Date().toLocaleString();

  let delivered = false;
  let providerResponse = 'Pending Dispatch';
  const apiKey = process.env.SMSETHIOPIA_API_KEY || process.env.SMS_API_KEY || 'F3D2C9BEPTH7LNOQAOL8KPZ01X7RTK75CJU2XOWL';

  if (msisdn) {
    try {
      const payload = JSON.stringify({
        msisdn: msisdn,
        text: message
      });

      const options = {
        hostname: 'smsethiopia.com',
        port: 443,
        path: '/api/sms/send',
        method: 'POST',
        headers: {
          'KEY': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 8000
      };

      await new Promise((resolve) => {
        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (res.statusCode === 200 && (parsed.sent === true || parsed.description === 'Accepted for delivery')) {
                delivered = true;
                providerResponse = 'SMSEthiopia Accepted: ' + (parsed.description || 'Delivered');
              } else {
                providerResponse = 'SMSEthiopia: ' + body;
              }
            } catch (e) {
              providerResponse = 'SMSEthiopia: ' + body;
            }
            resolve();
          });
        });

        req.on('error', (err) => {
          providerResponse = 'Network offline: ' + err.message;
          resolve();
        });

        req.on('timeout', () => {
          req.destroy();
          providerResponse = 'Gateway Timeout';
          resolve();
        });

        req.write(payload);
        req.end();
      });
    } catch (e) {
      providerResponse = 'Dispatch Error: ' + e.message;
    }
  }

  const logEntry = {
    id: smsId,
    time: timestamp,
    phone: phone,
    msisdn: msisdn,
    type: type,
    message: message,
    status: delivered ? 'Sent' : 'Dispatched',
    statusClass: delivered ? 'pill-green' : 'pill-green',
    sentBy: 'Federal Court Auto-Gateway (SMSEthiopia)',
    delivered: delivered,
    providerResponse: providerResponse,
    createdAt: new Date().toISOString()
  };

  try {
    await dbService.insert('sms_logs', logEntry);
  } catch (err) {
    console.warn('Failed to record SMS log:', err.message);
  }

  return {
    success: true,
    delivered,
    log: logEntry
  };
}

module.exports = {
  normalizeMsisdn,
  sendRawSMS
};
