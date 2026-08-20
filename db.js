require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/efcourt';

let isConnected = false;

async function connectDB() {
  if (isConnected) return mongoose.connection;
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[MongoDB] Connected to: ' + conn.connection.host + '/' + conn.connection.name);
    return conn;
  } catch (err) {
    console.warn('[MongoDB] Connection warning (using JSON DB fallback): ' + err.message);
    return null;
  }
}

module.exports = { connectDB, mongoose };
