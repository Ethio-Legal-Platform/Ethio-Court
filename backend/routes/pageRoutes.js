'use strict';
const express = require('express');
const path = require('path');
const router = express.Router();

const viewsDir = path.join(__dirname, '..', '..', 'frontend', 'views');

router.get('/', (req, res) => res.sendFile(path.join(viewsDir, 'index.html')));
router.get('/index.html', (req, res) => res.sendFile(path.join(viewsDir, 'index.html')));
router.get('/dashboard', (req, res) => res.sendFile(path.join(viewsDir, 'dashboard.html')));
router.get('/dashboard.html', (req, res) => res.sendFile(path.join(viewsDir, 'dashboard.html')));
router.get('/judge', (req, res) => res.sendFile(path.join(viewsDir, 'judge.html')));
router.get('/judge.html', (req, res) => res.sendFile(path.join(viewsDir, 'judge.html')));
router.get('/admin', (req, res) => res.sendFile(path.join(viewsDir, 'admin.html')));
router.get('/admin.html', (req, res) => res.sendFile(path.join(viewsDir, 'admin.html')));
router.get('/official', (req, res) => res.sendFile(path.join(viewsDir, 'official.html')));
router.get('/official.html', (req, res) => res.sendFile(path.join(viewsDir, 'official.html')));
router.get('/clerk', (req, res) => res.sendFile(path.join(viewsDir, 'clerk.html')));
router.get('/clerk.html', (req, res) => res.sendFile(path.join(viewsDir, 'clerk.html')));
router.get('/temporary', (req, res) => res.sendFile(path.join(viewsDir, 'temporary.html')));
router.get('/temporary.html', (req, res) => res.sendFile(path.join(viewsDir, 'temporary.html')));
router.get('/litigant', (req, res) => res.sendFile(path.join(viewsDir, 'temporary.html')));
router.get('/litigant.html', (req, res) => res.sendFile(path.join(viewsDir, 'temporary.html')));
router.get('/client', (req, res) => res.sendFile(path.join(viewsDir, 'temporary.html')));
router.get('/client.html', (req, res) => res.sendFile(path.join(viewsDir, 'temporary.html')));
router.get('/file-case', (req, res) => res.sendFile(path.join(viewsDir, 'file-case.html')));
router.get('/file-case.html', (req, res) => res.sendFile(path.join(viewsDir, 'file-case.html')));

module.exports = router;
