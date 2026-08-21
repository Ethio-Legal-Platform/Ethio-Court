'use strict';
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const { connectDB } = require('./backend/config/db');
const apiRoutes = require('./backend/routes/apiRoutes');
const pageRoutes = require('./backend/routes/pageRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend assets
app.use('/js', express.static(path.join(__dirname, 'frontend', 'js')));
app.use('/css', express.static(path.join(__dirname, 'frontend', 'assets', 'css')));
app.use(express.static(path.join(__dirname, 'frontend', 'views')));
app.use(express.static(path.join(__dirname, 'frontend', 'js')));
app.use(express.static(path.join(__dirname, 'frontend', 'assets', 'css')));
app.use('/assets', express.static(path.join(__dirname, 'frontend', 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Legacy public folder support
if (fs.existsSync(path.join(__dirname, 'public'))) {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Routes
app.use('/api', apiRoutes);
app.use('/', pageRoutes);

// Server startup
app.listen(PORT, async () => {
  console.log(`⚖️  Federal Supreme Court System running on http://localhost:${PORT}`);
  await connectDB();
});

module.exports = app;
