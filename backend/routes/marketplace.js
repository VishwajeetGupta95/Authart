const express = require('express');
const {
  getActiveListings,
  createOrUpdateListing,
  purchaseListing,
  getArtworkById,
} = require('../services/storage');

const router = express.Router();

/**
 * GET /api/marketplace/listings
 * Fetch all active artwork listings available on the marketplace.
 */
router.get('/listings', async (req, res) => {
  try {
    const listings = await getActiveListings();
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/marketplace/list
 * List a minted artwork for sale. Requires authenticated creator.
 */
router.post('/list', async (req, res) => {
  try {
    const { artworkId, priceEth } = req.body;
    if (!artworkId || !priceEth || Number(priceEth) <= 0) {
      return res.status(400).json({ error: 'Valid artwork ID and price in ETH are required.' });
    }

    const artwork = await getArtworkById(artworkId, req.user.address);
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found or not owned by caller.' });
    }

    if (artwork.status !== 'minted') {
      return res.status(400).json({ error: 'Only minted NFTs can be listed on the marketplace.' });
    }

    const listingItem = {
      id: `list-${Date.now()}`,
      artworkId: artwork.id,
      tokenId: artwork.mint?.tokenId || '1',
      sellerAddress: req.user.address.toLowerCase(),
      sellerDid: req.user.did,
      priceEth: Number(priceEth),
      priceUSD: Number((Number(priceEth) * 3200).toFixed(2)),
      active: true,
      royaltyBps: artwork.mint?.royaltyBps || 500,
      listedAt: new Date().toISOString(),
    };

    const saved = await createOrUpdateListing(listingItem);
    res.status(201).json({ listing: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/marketplace/buy
 * Purchase a listed NFT and settle ownership.
 */
router.post('/buy', async (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ error: 'Listing ID is required.' });

    const result = await purchaseListing(listingId, req.user.address, req.user.did);
    if (!result) {
      return res.status(404).json({ error: 'Active listing not found or already sold.' });
    }

    res.json({
      success: true,
      message: 'NFT purchased and ownership transferred successfully.',
      listing: result.listing,
      artwork: result.artwork,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
