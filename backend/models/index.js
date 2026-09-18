const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true, lowercase: true, index: true },
  did: { type: String, required: true },
  displayName: { type: String, default: '' },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now },
});

const ArtworkSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  originalName: { type: String },
  filename: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
  ownerAddress: { type: String, required: true, lowercase: true, index: true },
  did: { type: String, required: true },
  status: { type: String, enum: ['uploaded', 'minted'], default: 'uploaded' },
  aiStatus: { type: String, enum: ['pending', 'passed', 'failed'], default: 'pending' },
  aiResult: { type: mongoose.Schema.Types.Mixed, default: null },
  mint: { type: mongoose.Schema.Types.Mixed, default: null },
  previousOwners: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

const ListingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  artworkId: { type: String, required: true, index: true },
  tokenId: { type: String, required: true },
  sellerAddress: { type: String, required: true, lowercase: true },
  sellerDid: { type: String, required: true },
  priceEth: { type: Number, required: true },
  priceUSD: { type: Number },
  active: { type: Boolean, default: true, index: true },
  royaltyBps: { type: Number, default: 500 },
  buyerAddress: { type: String, lowercase: true, default: null },
  buyerDid: { type: String, default: null },
  listedAt: { type: Date, default: Date.now },
  soldAt: { type: Date, default: null },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Artwork = mongoose.models.Artwork || mongoose.model('Artwork', ArtworkSchema);
const Listing = mongoose.models.Listing || mongoose.model('Listing', ListingSchema);

module.exports = { User, Artwork, Listing };
