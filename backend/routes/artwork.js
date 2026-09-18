const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { analyzeArtwork, bootstrapArtwork } = require('../services/ai');
const { mintIfConfigured } = require('../services/blockchain');
const { pinFile, pinJson, getGatewayUrl } = require('../services/ipfs');
const { getUserArtworks, getArtworkById, createArtwork, updateArtwork } = require('../services/storage');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)),
});

router.get('/', async (req, res) => {
  try {
    const userArtworks = await getUserArtworks(req.user.address);
    res.json({ artworks: userArtworks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', upload.single('artwork'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please upload a PNG, JPG, WEBP, or GIF image.' });
  const title = String(req.body.title || '').trim();
  if (!title) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Artwork title is required.' });
  }

  let image = {};
  if (process.env.PINATA_JWT) {
    try {
      image = await pinFile(req.file.path, {
        name: req.file.originalname,
        contentType: req.file.mimetype,
        keyvalues: { source: 'authart-artwork' },
      });
      image.gatewayUrl = getGatewayUrl(image.uri);
    } catch (err) {
      fs.unlinkSync(req.file.path);
      return res.status(502).json({ error: `Artwork storage failed: ${err.message}` });
    }
  }

  const item = {
    id: crypto.randomUUID(),
    title,
    description: String(req.body.description || '').trim(),
    originalName: req.file.originalname,
    filename: req.file.filename,
    imageCid: image.cid || null,
    imageUri: image.uri || null,
    imageGatewayUrl: image.gatewayUrl || null,
    mimeType: req.file.mimetype,
    size: req.file.size,
    ownerAddress: req.user.address.toLowerCase(),
    did: req.user.did,
    status: 'uploaded',
    aiStatus: 'pending',
    createdAt: new Date().toISOString(),
  };

  try {
    const saved = await createArtwork(item);
    res.status(201).json({ artwork: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const artwork = await getArtworkById(req.params.id, req.user.address);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });

    const filePath = path.join(uploadDir, artwork.filename);
    const result = await analyzeArtwork(filePath);

    const updated = await updateArtwork(artwork.id, {
      aiStatus: result.original ? 'passed' : 'failed',
      aiResult: result,
    });

    res.json({ artwork: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/mint', async (req, res) => {
  try {
    const artwork = await getArtworkById(req.params.id, req.user.address);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });

    if (artwork.aiStatus !== 'passed') {
      return res.status(400).json({ error: 'Artwork must pass the AI originality check before minting.' });
    }

    const metadataDir = path.join(__dirname, '..', 'data', 'metadata');
    fs.mkdirSync(metadataDir, { recursive: true });

    const metadata = {
      name: artwork.title,
      description: artwork.description,
      image: artwork.imageUri || `/uploads/${artwork.filename}`,
      creator: artwork.did,
      attributes: [
        { trait_type: 'AI Originality Score', value: artwork.aiResult.originalityScore },
        { trait_type: 'AI Model', value: artwork.aiResult.model },
        { trait_type: 'Content Hash (SHA-256)', value: artwork.aiResult.sha256 },
      ],
    };

    fs.writeFileSync(path.join(metadataDir, `${artwork.id}.json`), JSON.stringify(metadata, null, 2));
    let metadataUri = `local://metadata/${artwork.id}`;
    let metadataFields = {};
    if (process.env.PINATA_JWT) {
      const pinnedMetadata = await pinJson(metadata, {
        name: `${artwork.id}.json`,
        keyvalues: { source: 'authart-metadata', artworkId: artwork.id },
      });
      metadataUri = pinnedMetadata.uri;
      metadataFields = {
        metadataCid: pinnedMetadata.cid,
        metadataUri: pinnedMetadata.uri,
        metadataGatewayUrl: getGatewayUrl(pinnedMetadata.uri),
      };
    }

    // Execute minting
    const chain = await mintIfConfigured({ ownerAddress: artwork.ownerAddress, metadataUri, royaltyBps: 500 });
    const mintResult = chain || {
      tokenId: String(Date.now()),
      network: 'Local Demo Chain',
      contractAddress: 'demo-contract',
      metadataUri,
      royaltyBps: 500,
    };

    // Auto-bootstrap approved newly minted artwork into ChromaDB vector database
    const filePath = path.join(uploadDir, artwork.filename);
    const bootstrapRes = await bootstrapArtwork(filePath);
    if (bootstrapRes) {
      mintResult.chromaRegistered = true;
      mintResult.chromaId = bootstrapRes.added_id;
    }

    const updated = await updateArtwork(artwork.id, {
      status: 'minted',
      mint: mintResult,
      ...metadataFields,
    });

    res.json({ artwork: updated, mint: mintResult });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/file/:filename', (req, res) => {
  const f = path.join(uploadDir, path.basename(req.params.filename));
  if (!fs.existsSync(f)) return res.status(404).end();
  res.sendFile(f);
});

module.exports = router;
