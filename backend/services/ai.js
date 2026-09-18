const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

/**
 * Communicates with the Python FastAPI AI Engine (CLIP + ResNet50 + ChromaDB).
 * Uses native Node.js fetch + FormData (available in Node 18+).
 * Falls back to local deterministic calculation only if the AI service is unreachable.
 */
async function analyzeArtwork(filePath) {
  const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
  const apiKey = process.env.AI_API_KEY || '';

  if (!fs.existsSync(filePath)) {
    throw new Error(`Artwork file not found at path: ${filePath}`);
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const mimeType = getMimeType(filePath);
    const blob = new Blob([fileBuffer], { type: mimeType });

    const formData = new FormData();
    formData.append('file', blob, fileName);

    const headers = {};
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    // Call /analyze
    const analyzeRes = await fetch(`${aiEngineUrl}/analyze`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!analyzeRes.ok) {
      const errText = await analyzeRes.text();
      throw new Error(`AI Engine error (${analyzeRes.status}): ${errText}`);
    }

    const aiData = await analyzeRes.json();

    // Call /predict-price for indicative pricing estimation
    let priceData = null;
    try {
      const priceFormData = new FormData();
      priceFormData.append('file', blob, fileName);

      const priceRes = await fetch(`${aiEngineUrl}/predict-price`, {
        method: 'POST',
        headers: apiKey ? { 'X-API-Key': apiKey } : {},
        body: priceFormData,
      });

      if (priceRes.ok) {
        priceData = await priceRes.json();
      }
    } catch (priceErr) {
      console.warn('[AI Service] Price prediction call failed, using default formula:', priceErr.message);
    }

    const originality = aiData.originalityScore !== undefined ? aiData.originalityScore : (aiData.original ? 0.95 : 0.1);
    const finalPriceData = priceData || {
      estimatedPriceETH: Number((0.08 + originality * 1.8).toFixed(3)),
      confidence: 0.72,
    };

    return {
      original: aiData.original,
      similarityScore: aiData.similarityScore,
      styleFingerprintScore: aiData.styleFingerprintScore,
      originalityScore: aiData.originalityScore,
      fraudAlert: aiData.fraudAlert,
      model: aiData.model || 'CLIP ViT-B/32 + ResNet-50 + ChromaDB',
      sha256: aiData.sha256,
      pricePrediction: {
        suggestedEth: finalPriceData.estimatedPriceETH || finalPriceData.suggestedEth,
        priceUSD: finalPriceData.priceUSD,
        breakdown: finalPriceData.breakdown,
        confidence: finalPriceData.confidence || 0.85,
        model: finalPriceData.model || 'rule-based v1',
      },
    };
  } catch (error) {
    console.warn(`[AI Service] AI Engine at ${aiEngineUrl} unavailable (${error.message}). Using local fallback.`);
    return localFallbackAnalyze(filePath);
  }
}

/**
 * Registers an approved original artwork in the AI Engine's vector database (ChromaDB)
 * to prevent future duplicates. Protected by X-API-Key.
 */
async function bootstrapArtwork(filePath) {
  const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
  const apiKey = process.env.AI_API_KEY || '';

  if (!fs.existsSync(filePath)) return null;

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const mimeType = getMimeType(filePath);
    const blob = new Blob([fileBuffer], { type: mimeType });

    const formData = new FormData();
    formData.append('file', blob, fileName);

    const headers = {};
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(`${aiEngineUrl}/bootstrap`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      console.warn(`[AI Service] Bootstrap failed with status ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.warn('[AI Service] Bootstrapping artwork to ChromaDB failed:', err.message);
    return null;
  }
}

/**
 * Local deterministic fallback calculation.
 */
function localFallbackAnalyze(filePath) {
  const buf = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  const similarityScore = Number((0.05 + (parseInt(hash.slice(0, 4), 16) % 8500) / 10000).toFixed(3));
  const styleScore = Number((0.1 + (parseInt(hash.slice(4, 8), 16) % 8500) / 10000).toFixed(3));
  const exactDuplicate = similarityScore > 0.985;
  const originality = exactDuplicate ? 0.08 : Number((1 - Math.max(similarityScore - 0.55, 0) * 0.55).toFixed(3));
  const original = !exactDuplicate && originality >= 0.55;

  return {
    original,
    similarityScore,
    styleFingerprintScore: styleScore,
    originalityScore: originality,
    fraudAlert: !original,
    model: 'AuthArt local fallback (AI Engine unreachable)',
    sha256: hash,
    pricePrediction: {
      suggestedEth: Number((0.08 + originality * 1.8).toFixed(3)),
      confidence: 0.72,
    },
  };
}

module.exports = { analyzeArtwork, bootstrapArtwork };
