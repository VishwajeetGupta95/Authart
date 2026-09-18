const fs = require('fs');
const path = require('path');
const { connectDB, mongoose } = require('./db');
const { User, Artwork, Listing } = require('../models');

const dataDir = path.join(__dirname, '..', 'data');
const usersFile = path.join(dataDir, 'users.json');
const artworksFile = path.join(dataDir, 'artworks.json');
const listingsFile = path.join(dataDir, 'listings.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '{}');
if (!fs.existsSync(artworksFile)) fs.writeFileSync(artworksFile, '[]');
if (!fs.existsSync(listingsFile)) fs.writeFileSync(listingsFile, '[]');

// Local file helper
function readFile(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeFile(file, data) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

// ── USERS ───────────────────────────────────────────────────────────────────
async function getUser(address) {
  const addr = String(address).toLowerCase();
  if (mongoose.connection.readyState === 1) {
    return await User.findOne({ address: addr }).lean();
  }
  const users = readFile(usersFile, {});
  return users[addr] || null;
}

async function upsertUser(address, did) {
  const addr = String(address).toLowerCase();
  const now = new Date().toISOString();

  if (mongoose.connection.readyState === 1) {
    const existing = await User.findOne({ address: addr });
    if (!existing) {
      const created = await User.create({ address: addr, did, createdAt: now, lastLoginAt: now });
      return { user: created.toObject(), isNewUser: true };
    }
    existing.lastLoginAt = now;
    await existing.save();
    return { user: existing.toObject(), isNewUser: false };
  }

  const users = readFile(usersFile, {});
  const isNewUser = !users[addr];
  if (isNewUser) {
    users[addr] = { address, did, createdAt: now, lastLoginAt: now };
  } else {
    users[addr].lastLoginAt = now;
  }
  writeFile(usersFile, users);
  return { user: users[addr], isNewUser };
}

// ── ARTWORKS ─────────────────────────────────────────────────────────────────
async function getUserArtworks(address) {
  const addr = String(address).toLowerCase();
  if (mongoose.connection.readyState === 1) {
    return await Artwork.find({ ownerAddress: addr }).sort({ createdAt: -1 }).lean();
  }
  const all = readFile(artworksFile, []);
  return all.filter(x => x.ownerAddress?.toLowerCase() === addr);
}

async function getArtworkById(id, address) {
  const addr = String(address).toLowerCase();
  if (mongoose.connection.readyState === 1) {
    return await Artwork.findOne({ id, ownerAddress: addr });
  }
  const all = readFile(artworksFile, []);
  return all.find(x => x.id === id && x.ownerAddress?.toLowerCase() === addr) || null;
}

async function createArtwork(item) {
  if (mongoose.connection.readyState === 1) {
    const created = await Artwork.create(item);
    return created.toObject();
  }
  const all = readFile(artworksFile, []);
  all.unshift(item);
  writeFile(artworksFile, all);
  return item;
}

async function updateArtwork(id, updates) {
  if (mongoose.connection.readyState === 1) {
    return await Artwork.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  }
  const all = readFile(artworksFile, []);
  const index = all.findIndex(x => x.id === id);
  if (index >= 0) {
    all[index] = { ...all[index], ...updates };
    writeFile(artworksFile, all);
    return all[index];
  }
  return null;
}

// ── LISTINGS ─────────────────────────────────────────────────────────────────
async function getActiveListings() {
  if (mongoose.connection.readyState === 1) {
    const listings = await Listing.find({ active: true }).sort({ listedAt: -1 }).lean();
    const artworkIds = listings.map(l => l.artworkId);
    const artworks = await Artwork.find({ id: { $in: artworkIds } }).lean();

    return listings.map(l => ({
      ...l,
      artwork: artworks.find(a => a.id === l.artworkId) || null,
    }));
  }

  const listings = readFile(listingsFile, []).filter(l => l.active);
  const artworks = readFile(artworksFile, []);
  return listings.map(l => ({
    ...l,
    artwork: artworks.find(a => a.id === l.artworkId) || null,
  }));
}

async function createOrUpdateListing(item) {
  if (mongoose.connection.readyState === 1) {
    return await Listing.findOneAndUpdate(
      { artworkId: item.artworkId, active: true },
      { $set: item },
      { upsert: true, new: true }
    ).lean();
  }

  const listings = readFile(listingsFile, []);
  const index = listings.findIndex(l => l.artworkId === item.artworkId && l.active);
  if (index >= 0) {
    listings[index] = item;
  } else {
    listings.unshift(item);
  }
  writeFile(listingsFile, listings);
  return item;
}

async function purchaseListing(listingId, buyerAddress, buyerDid) {
  const now = new Date().toISOString();

  if (mongoose.connection.readyState === 1) {
    const listing = await Listing.findOne({ id: listingId, active: true });
    if (!listing) return null;

    listing.active = false;
    listing.buyerAddress = buyerAddress.toLowerCase();
    listing.buyerDid = buyerDid;
    listing.soldAt = now;
    await listing.save();

    const artwork = await Artwork.findOne({ id: listing.artworkId });
    if (artwork) {
      artwork.previousOwners.push(artwork.ownerAddress);
      artwork.ownerAddress = buyerAddress.toLowerCase();
      artwork.did = buyerDid;
      await artwork.save();
    }
    return { listing: listing.toObject(), artwork: artwork ? artwork.toObject() : null };
  }

  const listings = readFile(listingsFile, []);
  const index = listings.findIndex(l => l.id === listingId && l.active);
  if (index < 0) return null;

  const listing = listings[index];
  listing.active = false;
  listing.buyerAddress = buyerAddress.toLowerCase();
  listing.buyerDid = buyerDid;
  listing.soldAt = now;
  writeFile(listingsFile, listings);

  const artworks = readFile(artworksFile, []);
  const artIndex = artworks.findIndex(a => a.id === listing.artworkId);
  let updatedArt = null;
  if (artIndex >= 0) {
    artworks[artIndex].previousOwners = artworks[artIndex].previousOwners || [];
    artworks[artIndex].previousOwners.push(artworks[artIndex].ownerAddress);
    artworks[artIndex].ownerAddress = buyerAddress;
    artworks[artIndex].did = buyerDid;
    writeFile(artworksFile, artworks);
    updatedArt = artworks[artIndex];
  }

  return { listing, artwork: updatedArt };
}

module.exports = {
  getUser,
  upsertUser,
  getUserArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  getActiveListings,
  createOrUpdateListing,
  purchaseListing,
};
