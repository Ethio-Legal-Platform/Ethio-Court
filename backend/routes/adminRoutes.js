'use strict';
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/admin/metrics', adminController.getSystemMetrics);
router.get('/admin/health', adminController.getSystemHealth);
router.get('/admin/audit-logs', adminController.getAuditLogs);

module.exports = router;
