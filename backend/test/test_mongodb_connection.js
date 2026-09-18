const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const dns = require('dns');

// Configure public DNS fallback for SRV lookup if local ISP/Windows DNS fails
if (dns.setServers) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch {}
}

async function testConnection() {
  const uri = process.env.MONGODB_URI;

  console.log('====================================================');
  console.log('         MongoDB Connection Test Script             ');
  console.log('====================================================\n');

  if (!uri) {
    console.error('❌ ERROR: MONGODB_URI is not defined in backend/.env');
    process.exit(1);
  }

  // Mask credentials for display
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  console.log(`[1] Testing URI: ${maskedUri}`);

  try {
    console.log('[2] Attempting connection (timeout: 10s)...');
    const start = Date.now();
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    const duration = Date.now() - start;

    console.log('\n====================================================');
    console.log('  ✅ SUCCESS: Connected to MongoDB successfully!');
    console.log('====================================================');
    console.log(`- Host: ${conn.connection.host}`);
    console.log(`- Port: ${conn.connection.port || 'Default Atlas SRV'}`);
    console.log(`- Database Name: ${conn.connection.name}`);
    console.log(`- Connection Time: ${duration}ms`);
    console.log(`- Connection State: ${conn.connection.readyState === 1 ? 'Connected (1)' : conn.connection.readyState}`);

    await mongoose.disconnect();
    console.log('\n[3] Disconnected cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('\n====================================================');
    console.error('  ❌ FAILED: Unable to connect to MongoDB');
    console.error('====================================================');
    console.error(`- Error Code/Name: ${err.name || 'Unknown'}`);
    console.error(`- Error Message: ${err.message}`);

    console.log('\n--- Diagnostic Tips ---');
    if (err.message.includes('querySrv') || err.message.includes('ECONNREFUSED')) {
      console.log('👉 DNS / SRV Resolution Issue:');
      console.log('   - Your network/ISP or Windows DNS is failing to resolve the mongodb+srv SRV record.');
      console.log('   - Ensure port 27017 outbound is allowed on your firewall.');
      console.log('   - Or verify if the cluster hostname is active in your MongoDB Atlas dashboard.');
    } else if (err.message.includes('Authentication failed') || err.message.includes('bad auth')) {
      console.log('👉 Authentication Failed:');
      console.log('   - Username or password in backend/.env is incorrect.');
      console.log('   - If your password contains special characters (like @, %, #, etc.), make sure they are URL encoded.');
    } else if (err.message.includes('timed out') || err.message.includes('Server selection')) {
      console.log('👉 IP Access / Network Whitelist:');
      console.log('   - Go to MongoDB Atlas -> Network Access -> Add IP Address -> Select "Allow Access from Anywhere" (0.0.0.0/0).');
    }
    console.log('----------------------------------------------------\n');

    process.exit(1);
  }
}

testConnection();
