const fs = require('fs/promises');

const PINATA_FILES_URL = 'https://uploads.pinata.cloud/v3/files';
const pinataJwt = () => process.env.PINATA_JWT;

function assertConfigured() {
  if (!pinataJwt()) {
    throw new Error('PINATA_JWT is not configured. Add it to backend/.env before using IPFS uploads.');
  }
}

function getCid(response) {
  return response?.data?.cid || response?.data?.IpfsHash || response?.IpfsHash || null;
}

async function pinBlob(blob, name, keyvalues = {}) {
  assertConfigured();

  const form = new FormData();
  form.append('file', blob, name);
  form.append('network', 'public');
  form.append('keyvalues', JSON.stringify(keyvalues));

  const response = await fetch(PINATA_FILES_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pinataJwt()}` },
    body: form,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error?.message || payload.message || `Pinata upload failed (${response.status})`);
  }

  const cid = getCid(payload);
  if (!cid) throw new Error('Pinata upload succeeded but did not return a CID.');
  return { cid, uri: `ipfs://${cid}` };
}

async function pinFile(filePath, options = {}) {
  const file = await fs.readFile(filePath);
  const name = options.name || filePath.split(/[\\/]/).pop() || 'artwork';
  const type = options.contentType || 'application/octet-stream';
  return pinBlob(new Blob([file], { type }), name, options.keyvalues);
}

async function pinJson(value, options = {}) {
  const name = options.name || 'metadata.json';
  const body = JSON.stringify(value, null, 2);
  return pinBlob(new Blob([body], { type: 'application/json' }), name, options.keyvalues);
}

function getGatewayUrl(uriOrCid) {
  if (!uriOrCid) return '';
  const value = String(uriOrCid);
  const cid = value.startsWith('ipfs://') ? value.slice(7) : value;
  const gateway = String(process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs').replace(/\/+$/, '');
  return `${gateway}/${cid}`;
}

module.exports = { pinFile, pinJson, getGatewayUrl };
