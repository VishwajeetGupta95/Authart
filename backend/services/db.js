require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Node.js SRV record lookup on Windows / local ISP DNS
if (dns.setServers) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch {}
}

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[Database] MONGODB_URI not set. Running in local JSON fallback mode.');
    return false;
  }

  if (isConnected) return true;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.warn(`[Database] MongoDB Connection Failed (${err.message}). Using local JSON fallback.`);
    return false;
  }
}

module.exports = { connectDB, mongoose };
