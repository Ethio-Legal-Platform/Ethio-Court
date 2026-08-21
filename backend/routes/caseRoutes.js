'use strict';
const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const upload = require('../middleware/uploadMiddleware');

// Case CRUD & Search
router.get('/cases', caseController.getAllCases);
router.get('/availability', caseController.checkAvailability);
router.get('/cases/search', caseController.searchCases);
router.get('/cases/:id', caseController.getCaseById);
router.post('/cases', upload.any(), caseController.createCase);
router.post('/cases/file', upload.any(), caseController.createCase);

// Admin Screening & Branch Forwarding
router.post('/cases/:id/mark-viewed', caseController.markCaseAsViewed);
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
router.post('/cases/register-filing', caseController.registerFiling);

// Verdict & Closure
router.post('/cases/verdict', caseController.issueFinalVerdict);

// Notes & Demands
router.post('/cases/add-note', caseController.addCaseNote);
router.post('/cases/demand-documents', caseController.demandDocuments);

// Legal Library
router.get('/legal-library', caseController.getLegalLibrary);

// Prosecution Specific Routes
router.get('/witnesses', caseController.getWitnesses);
router.post('/witnesses', caseController.createWitness);
router.get('/document-demands', caseController.getDocumentDemands);
router.post('/document-demands', caseController.createDocumentDemandOrder);
router.post('/document-demands/:id/status', caseController.updateDocumentDemandStatus);
router.post('/prosecutor/file-indictment', upload.array('documents', 10), caseController.fileProsecutorIndictment);
router.post('/prosecutor/upload-exhibit', upload.array('documents', 10), caseController.uploadExhibit);
router.post('/prosecutor/schedule-hearing', caseController.scheduleProsecutorHearing);
router.post('/prosecutor/transmit-memo', caseController.transmitBenchMemo);


// Prosecution Extended Endpoints
router.get('/prosecutor/cases', caseController.getProsecutorCases);
router.get('/prosecutor/my-cases', caseController.getProsecutorCases);
router.get('/prosecutor/messages', caseController.getProsecutorMessages);
router.post('/prosecutor/messages', caseController.sendProsecutorMessage);
router.get('/prosecutor/appeals', caseController.getProsecutorAppeals);
router.post('/prosecutor/appeals', caseController.createProsecutorAppeal);
router.get('/prosecutor/verdicts', caseController.getProsecutorVerdicts);
router.get('/prosecutor/assignments', caseController.getProsecutorAssignments);
router.post('/prosecutor/assignments', caseController.createProsecutorAssignment);

module.exports = router;
