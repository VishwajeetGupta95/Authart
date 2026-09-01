# AuthArt — Complete Architecture Build

## Phase 1 — Wallet authentication
Implemented: MetaMask connection, nonce challenge, signed message, address recovery, replay protection, DID, JWT, session restoration and protected APIs.

## Phase 2 — Dashboard
Implemented: authenticated dashboard, artwork upload, creator identity, artwork collection, marketplace/profile sections.

## Phase 3 — AI engine
Implemented: an API adapter with originality, similarity, style-fingerprint and price-prediction outputs plus fraud blocking. The Node adapter is deterministic for local demos. `ai-engine/main.py` provides a FastAPI boundary for replacing it with real CLIP/CNN weights. The included project does NOT claim a 14M-NFT live corpus or a trained production CNN unless those assets are connected.

## Phase 4 — Blockchain
Implemented: ERC-721, ERC-1155, ERC-2981 royalty contracts, deployment script, metadata generation and optional real local-chain minting. Without blockchain environment variables, minting uses an explicit local-demo fallback.

IPFS/Filecoin and LayerZero are integration boundaries rather than pretending external infrastructure is available offline. Replace the `local://metadata/...` URI with a Pinata/web3.storage/Filecoin adapter and add the LayerZero endpoint/config when deploying cross-chain.

## Phase 5 — Marketplace
Implemented in the smart-contract layer: listing, purchase, NFT transfer, EIP-2981 royalty settlement and reputation counters. The ownership check is enforced on-chain by `ownerOf`. A production ZKP flow should use a real proving system such as Groth16/Plonk; this offline package does not falsely label a wallet signature as a zero-knowledge proof.

## Honest completion status

The repository contains the full end-to-end application skeleton and working local/demo paths for all five phases. Production-grade CLIP/CNN training, a 14M+ NFT indexed corpus, IPFS/Filecoin infrastructure, LayerZero deployment and a real ZKP circuit require external datasets/services/keys and are intentionally isolated behind integration boundaries.
