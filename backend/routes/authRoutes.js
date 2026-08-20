'use strict';
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/auth/login', authController.login);
router.post('/register-lawyer', authController.registerLawyer);
router.post('/auth/register-lawyer', authController.registerLawyer);
router.post('/lawyer/verify', authController.verifyLawyer);
router.post('/auth/lawyer/verify', authController.verifyLawyer);

module.exports = router;
