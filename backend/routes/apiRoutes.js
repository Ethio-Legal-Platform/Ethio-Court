'use strict';
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const caseRoutes = require('./caseRoutes');
const judgeRoutes = require('./judgeRoutes');
const adminRoutes = require('./adminRoutes');
const notificationRoutes = require('./notificationRoutes');

router.use('/', authRoutes);
router.use('/', caseRoutes);
router.use('/', judgeRoutes);
router.use('/', adminRoutes);
router.use('/', notificationRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Federal Supreme Court API v1.0.0 is running smoothly' });
});

module.exports = router;
