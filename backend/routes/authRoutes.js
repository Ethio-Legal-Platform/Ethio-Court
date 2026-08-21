'use strict';
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication routes
router.post('/login', authController.login);
router.post('/auth/login', authController.login);
router.post('/register-lawyer', authController.registerLawyer);
router.post('/auth/register-lawyer', authController.registerLawyer);

// MoJ License verification routes
router.post('/lawyer/verify', authController.verifyLawyer);
router.post('/auth/lawyer/verify', authController.verifyLawyer);
router.get('/licenses/verify/:licenseNumber', authController.verifyLicenseGet);
router.get('/moj/verify/:licenseNumber', authController.verifyLicenseGet);

// Lawyer registry
router.get('/lawyers', authController.getLawyers);
router.get('/lawyers/:id', authController.getLawyerProfile);

// Q&A public knowledge base
router.get('/qa/questions', authController.getQuestions);
router.get('/questions', authController.getQuestions);

// Phone OTP verification
router.post('/otp/request', authController.sendOTP);
router.post('/otp/send', authController.sendOTP);
router.post('/otp/verify', authController.verifyOTP);

module.exports = router;
