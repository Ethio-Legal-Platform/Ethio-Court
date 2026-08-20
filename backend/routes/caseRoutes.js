'use strict';
const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const upload = require('../middleware/uploadMiddleware');

router.get('/cases', caseController.getAllCases);
router.get('/cases/search', caseController.searchCases);
router.get('/cases/:id', caseController.getCaseById);
router.post('/cases', upload.array('documents', 10), caseController.createCase);
router.put('/cases/:id', caseController.updateCaseStatus);

module.exports = router;
