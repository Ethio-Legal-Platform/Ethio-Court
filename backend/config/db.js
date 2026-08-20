'use strict';
const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/court_system';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000
    });
    isConnected = true;
    console.log('📦 Connected to MongoDB successfully.');
  } catch (err) {
    isConnected = false;
    console.warn('⚠️  MongoDB connection failed/offline. Falling back to robust JSON file datastore in backend/data/');
  }
}

function getIsConnected() {
  return isConnected;
}

module.exports = { connectDB, getIsConnected };
