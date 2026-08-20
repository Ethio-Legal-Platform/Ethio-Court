'use strict';
const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const upload = require('../middleware/uploadMiddleware');

// Case CRUD & Search
router.get('/cases', caseController.getAllCases);
router.get('/cases/search', caseController.searchCases);
router.get('/cases/:id', caseController.getCaseById);
router.post('/cases', upload.array('documents', 10), caseController.createCase);

// Admin Screening & Branch Forwarding
router.post('/cases/admin-review', caseController.adminScreeningReview);

// Branch Official Scheduling
router.post('/cases/schedule-hearing', caseController.scheduleFirstHearing);

// Lawyer Appointment & Revocation
router.post('/cases/lawyer-request', caseController.requestLawyerAppointment);
router.post('/cases/lawyer-respond', caseController.respondLawyerAppointment);
router.post('/cases/lawyer-remove', caseController.removeLawyer);

// Defendant Representation
router.post('/cases/defendant-representation', caseController.defendantChooseRepresentation);

// Postponements
router.post('/cases/postponement-request', caseController.requestPostponement);

// Evidence Classification Gate
router.post('/cases/classify-evidence', caseController.classifyEvidence);

// Hearing Session & Summary
router.post('/cases/log-session', caseController.logHearingSession);

// Verdict & Closure
router.post('/cases/verdict', caseController.issueFinalVerdict);

// Notes & Demands
router.post('/cases/add-note', caseController.addCaseNote);
router.post('/cases/demand-documents', caseController.demandDocuments);

// Legal Library
router.get('/legal-library', caseController.getLegalLibrary);

module.exports = router;
