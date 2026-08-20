const auditService = require('../services/auditService');
'use strict';
const dbService = require('../services/dbService');

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Check lawyers, judges, officers, clerks, admins
  const [lawyer, judge, officer, clerk, admin] = await Promise.all([
    dbService.findOne('lawyers', { username, password }),
    dbService.findOne('judges', { username, password }),
    dbService.findOne('officers', { username, password }),
    dbService.findOne('clerks', { username, password }),
    dbService.findOne('admins', { username, password })
  ]);

  const user = lawyer || judge || officer || clerk || admin;
  if (user) {
    // Record audit log
    await dbService.insert('audit_logs', {
      id: 'AUD-' + Date.now(),
      action: 'USER_LOGIN',
      user: user.fullName || user.username,
      role: user.role,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    });
    return res.json({ success: true, user });
  }

  // Check generic client/litigant test PIN login
  if (username === 'abebe.kebede' && (password === '8821' || password === 'clerk123')) {
    const clientUser = {
      id: 'TEMP-USR-101',
      username: 'abebe.kebede',
      fullName: 'Abebe Kebede',
      role: 'client',
      accountType: 'Temporary (Plaintiff)',
      phone: '+251 911 123 456',
      email: 'abebe.kebede@email.com'
    };
    return res.json({ success: true, user: clientUser });
  }

  return res.status(401).json({ error: 'Invalid institutional credentials or PIN' });
}

async function verifyLawyer(req, res) {
  const { licenseNumber } = req.body;
  if (!licenseNumber) {
    return res.status(400).json({ error: 'License number required' });
  }
  const license = await dbService.findOne('moj_licenses', { licenseNumber: licenseNumber.trim() });
  if (license) {
    return res.json({ verified: true, license });
  }
  return res.status(404).json({ verified: false, error: 'License number not found in Ministry of Justice registry' });
}

async function registerLawyer(req, res) {
  const { licenseNumber, fullName, username, password } = req.body;
  if (!licenseNumber || !username || !password) {
    return res.status(400).json({ error: 'License number, username, and password required' });
  }
  const license = await dbService.findOne('moj_licenses', { licenseNumber: licenseNumber.trim() });
  if (!license) {
    return res.status(400).json({ error: 'Ministry of Justice license not found or not certified' });
  }
  const newLawyer = {
    id: 'LAW-' + Date.now(),
    username,
    password,
    fullName: fullName || license.fullName,
    licenseNumber: license.licenseNumber,
    role: 'advocate',
    status: 'active'
  };
  await dbService.insert('lawyers', newLawyer);
  return res.status(201).json({ success: true, user: newLawyer });
}

module.exports = { login, verifyLawyer, registerLawyer };
