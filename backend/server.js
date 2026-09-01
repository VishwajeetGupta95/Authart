require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { recoverAddress, hashMessage, getAddress } = require('ethers');
const artworkRoutes = require('./routes/artwork');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
const JWT_SECRET = process.env.JWT_SECRET || 'authart-dev-secret-change-me';
const NONCE_TTL_MS = 5 * 60 * 1000;
const JWT_TTL_SECONDS = 24 * 60 * 60;

app.use(cors({
  origin: (origin, callback) => {
    // Reflect any origin to allow Vercel previews (*.vercel.app), localhost, and custom domains
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/metadata', express.static(path.join(__dirname, 'data', 'metadata')));

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'AuthArt Backend API', time: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const nonces = new Map();

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '{}');

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } catch {
    return {};
  }
}

function saveUsers(users) {
  const temp = `${usersFile}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(users, null, 2));
  fs.renameSync(temp, usersFile);
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function signJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + JWT_TTL_SECONDS };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedBody = base64url(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedBody}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function verifyJwt(token) {
  const [encodedHeader, encodedBody, encodedSignature] = String(token || '').split('.');
  if (!encodedHeader || !encodedBody || !encodedSignature) throw new Error('Invalid token');

  const data = `${encodedHeader}.${encodedBody}`;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  const a = Buffer.from(encodedSignature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('Invalid token');

  const payload = JSON.parse(Buffer.from(encodedBody, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
}

function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing bearer token' });
    req.user = verifyJwt(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function cleanupNonces() {
  const now = Date.now();
  for (const [address, entry] of nonces) {
    if (entry.expiresAt <= now) nonces.delete(address);
  }
}

setInterval(cleanupNonces, 60 * 1000).unref();

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'AuthArt backend' });
});

app.post('/api/auth/nonce', (req, res) => {
  try {
    const address = getAddress(req.body?.address || '');
    const nonce = crypto.randomBytes(32).toString('hex');
    const issuedAt = new Date().toISOString();
    const message = [
      'Welcome to AuthArt.',
      '',
      `Sign this message to authenticate your wallet: ${address}`,
      '',
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`,
    ].join('\n');

    nonces.set(address.toLowerCase(), {
      nonce,
      message,
      expiresAt: Date.now() + NONCE_TTL_MS,
    });

    res.json({ address, message, expiresAt: new Date(Date.now() + NONCE_TTL_MS).toISOString() });
  } catch {
    res.status(400).json({ error: 'Invalid Ethereum wallet address' });
  }
});

app.post('/api/auth/verify', (req, res) => {
  try {
    const requestedAddress = getAddress(req.body?.address || '');
    const signature = req.body?.signature;
    const entry = nonces.get(requestedAddress.toLowerCase());

    if (!signature) return res.status(400).json({ error: 'Signature is required' });
    if (!entry) return res.status(401).json({ error: 'Nonce not found or already used' });
    if (entry.expiresAt <= Date.now()) {
      nonces.delete(requestedAddress.toLowerCase());
      return res.status(401).json({ error: 'Nonce expired. Please request a new one.' });
    }

    const recoveredAddress = getAddress(recoverAddress(hashMessage(entry.message), signature));
    if (recoveredAddress.toLowerCase() !== requestedAddress.toLowerCase()) {
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    // A nonce is one-time use. This prevents replaying a valid signature.
    nonces.delete(requestedAddress.toLowerCase());

    const users = loadUsers();
    const key = requestedAddress.toLowerCase();
    const isNewUser = !users[key];

    if (isNewUser) {
      users[key] = {
        address: requestedAddress,
        did: `did:pkh:eip155:1:${requestedAddress.toLowerCase()}`,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    } else {
      users[key].lastLoginAt = new Date().toISOString();
    }
    saveUsers(users);

    const user = users[key];
    const token = signJwt({
      sub: user.did,
      address: user.address,
      did: user.did,
    });

    res.json({
      authenticated: true,
      isNewUser,
      token,
      user,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Authentication failed' });
  }
});

app.use('/api/artworks', authMiddleware, artworkRoutes);

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const users = loadUsers();
  const user = users[String(req.user.address).toLowerCase()];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ authenticated: true, user });
});

app.listen(PORT, () => {
  console.log(`AuthArt backend running on http://localhost:${PORT}`);
});
