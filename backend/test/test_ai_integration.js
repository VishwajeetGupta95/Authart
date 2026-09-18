const fs = require('fs');
const path = require('path');
const { analyzeArtwork, bootstrapArtwork } = require('../services/ai');

async function main() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const samplePath = path.join(uploadsDir, 'test_art.jpg');

  console.log('----------------------------------------------------');
  console.log('1. Analyzing fresh artwork via Python AI Engine...');
  console.log('----------------------------------------------------');
  const analyzeRes = await analyzeArtwork(samplePath);
  console.log('AI Response:', JSON.stringify(analyzeRes, null, 2));

  console.log('\n----------------------------------------------------');
  console.log('2. Bootstrapping approved artwork into ChromaDB vector DB...');
  console.log('----------------------------------------------------');
  const bootRes = await bootstrapArtwork(samplePath);
  console.log('ChromaDB Bootstrap Response:', bootRes);

  console.log('\n----------------------------------------------------');
  console.log('3. Re-analyzing identical artwork (Duplicate/Fraud Check)...');
  console.log('----------------------------------------------------');
  const duplicateCheck = await analyzeArtwork(samplePath);
  console.log('Duplicate Check Outcome:');
  console.log('  Original:', duplicateCheck.original);
  console.log('  Similarity Score (CLIP):', duplicateCheck.similarityScore);
  console.log('  Style Fingerprint Score (ResNet50):', duplicateCheck.styleFingerprintScore);
  console.log('  Final Originality Score:', duplicateCheck.originalityScore);
  console.log('  Fraud Alert Triggered:', duplicateCheck.fraudAlert);
  console.log('  Model:', duplicateCheck.model);
  console.log('----------------------------------------------------');
}

main().catch(console.error);
