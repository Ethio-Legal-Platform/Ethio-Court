'use strict';
const express = require('express');
const router = express.Router();
const judgeController = require('../controllers/judgeController');

router.get('/judges', judgeController.getJudges);
router.get('/cause-list', judgeController.getCauseList);
router.post('/orders', judgeController.issueOrder);

module.exports = router;
