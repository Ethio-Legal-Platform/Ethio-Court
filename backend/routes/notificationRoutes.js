'use strict';
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/sms/logs', notificationController.getSmsLogs);
router.post('/sms/send', notificationController.sendSms);
router.get('/notifications', notificationController.getNotifications);

module.exports = router;
