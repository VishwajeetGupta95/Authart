**AuthArt — AI-Powered Decentralized NFT Art Platform**

AuthArt is a full-stack Web3 application for digital artists. It combines wallet-based authentication, decentralized identity, AI-assisted artwork analysis, NFT minting, royalties, and marketplace functionality into a single workflow.

The project is organized into five phases:

**Phase 1 — User Authentication**

MetaMask Wallet → Nonce Challenge → Signature → Signature Verification → DID → JWT

**Phase 2 — Creator Dashboard**

Authenticated Dashboard → Upload Artwork → My Artwork → Marketplace → Profile

**Phase 3 — AI Artwork Analysis**

Artwork → Similarity Analysis → Style Fingerprint → Originality Decision → Fraud Detection → Price Prediction

**Phase 4 — Blockchain and NFT Minting**

AI Approval → Metadata → IPFS/Filecoin Integration → ERC-721/ERC-1155 → EIP-2981 Royalties → Optional Cross-Chain Support

**Phase 5 — NFT Marketplace**

Listing → Buyer Purchase → Ownership Verification → NFT Transfer → Royalty Payment → Reputation Update

---

**1. Project Overview**

Traditional NFT platforms provide the infrastructure for minting and trading digital assets, but the process of determining whether uploaded artwork is sufficiently original can be difficult.

AuthArt addresses this by placing an AI-assisted verification layer before the blockchain minting process.

The complete application follows this workflow:

```text
Creator
   |
   v
Connect MetaMask
   |
   v
Wallet Authentication
   |
   +--> Nonce Challenge
   +--> MetaMask Signature
   +--> Signature Recovery
   +--> DID Creation / Retrieval
   +--> JWT Authentication
   |
   v
Creator Dashboard
   |
   v
Upload Artwork
   |
   v
AI Analysis
   |
   +--> Image Similarity
   +--> Style Fingerprint
   +--> Originality Decision
   +--> Fraud Detection
   +--> Price Prediction
   |
   +---- FAIL ----> Minting Blocked
   |
   v
Metadata Generation
   |
   v
Decentralized Storage
   |
   v
NFT Smart Contract
   |
   +--> ERC-721
   +--> ERC-1155
   +--> EIP-2981 Royalties
   |
   v
Marketplace
   |
   +--> Listing
   +--> Purchase
   +--> Ownership Transfer
   +--> Royalty Settlement
   +--> Reputation Update
```

---

**2. Main Objectives**

The project is designed to provide:

- Passwordless Web3 authentication
- Wallet-based creator identity
- Decentralized identity using DID
- Secure JWT-based application sessions
- Artwork upload and creator management
- AI-assisted originality analysis
- Fraud detection before minting
- AI-based price estimation
- NFT minting using Ethereum-compatible standards
- Creator royalty support
- NFT marketplace functionality
- Reputation tracking
- Extensible architecture for IPFS, Filecoin, LayerZero, and zero-knowledge proofs

---

**3. Technology Stack**

**Frontend**

- React
- Vite
- JavaScript
- CSS
- ethers.js
- MetaMask

The frontend provides the user interface, wallet interaction, authentication flow, dashboard, artwork management, and marketplace interface.

**Backend**

- Node.js
- Express.js
- ethers.js
- Multer
- CORS
- JWT
- Local JSON persistence for development

The backend handles authentication, nonce generation, signature verification, DID creation, JWT issuance, protected APIs, artwork uploads, AI requests, and blockchain interaction.

**AI Engine**

- Python
- FastAPI
- Pillow
- PyTorch-compatible architecture
- Transformers / CLIP integration boundary
- CNN-style fingerprint analysis boundary

The AI engine is separated from the Node.js API so that models can be replaced or scaled independently.

**Blockchain**

- Solidity
- Hardhat
- OpenZeppelin
- Ethereum/EVM
- ERC-721
- ERC-1155
- ERC-2981

The smart-contract layer handles NFT creation, ownership, royalties, listings, purchases, transfers, and reputation-related marketplace logic.

**Planned production infrastructure**

- IPFS
- Filecoin
- LayerZero
- MongoDB or PostgreSQL
- Redis
- Vector database
- zk-SNARK system such as Groth16 or PLONK

---

**4. Phase 1 — User Authentication**

AuthArt does not use a traditional password-based login.

The user's Ethereum wallet is used as the primary authentication identity.

**Step 1: Connect Wallet**

The frontend requests access to the user's MetaMask account.

```text
Frontend
   |
   v
MetaMask
   |
   v
Wallet Address
```

Only the public wallet address is obtained. The application never needs the user's seed phrase or private key for authentication.

**Step 2: Nonce Challenge**

The frontend sends the wallet address to the backend.

```http
POST /api/auth/nonce
```

The backend generates a cryptographically random nonce.

The nonce is:

- unique
- short-lived
- associated with the wallet address
- invalidated after successful use

The purpose of the nonce is to prevent replay attacks.

**Step 3: MetaMask Signature**

The backend returns an authentication message containing the nonce.

The frontend asks MetaMask to sign the message.

This is a message signature and does not itself create a blockchain transaction.

**Step 4: Signature Verification**

The frontend sends the signed message and signature to:

```http
POST /api/auth/verify
```

The backend recovers the Ethereum address from the signature.

Conceptually:

```text
Authentication Message
        +
    Signature
        |
        v
Ethereum Signature Recovery
        |
        v
Recovered Address
```

The recovered address is compared with the address requesting authentication.

If the addresses match, authentication succeeds.

**Step 5: DID Creation**

AuthArt creates or retrieves a deterministic Ethereum-compatible DID:

```text
did:pkh:eip155:1:<wallet-address>
```

This DID provides a decentralized identity representation for the creator.

**Step 6: JWT**

After successful verification, the backend generates a JWT containing the authenticated user's identity information.

Protected API requests use:

```http
Authorization: Bearer <JWT>
```

The authentication flow is therefore:

```text
MetaMask
   |
   v
Wallet Address
   |
   v
Nonce
   |
   v
Sign Message
   |
   v
Recover Address
   |
   v
Verify Address
   |
   v
Create / Retrieve DID
   |
   v
Generate JWT
   |
   v
Authenticated Session
```

**Returning User Flow**

A returning user does not need to create another identity.

The application can:

```text
Connect Wallet
     |
     v
Request New Nonce
     |
     v
Sign
     |
     v
Find Existing User
     |
     v
Issue New JWT
     |
     v
Dashboard
```

---

**5. Phase 2 — Creator Dashboard**

After successful authentication, the user enters the creator dashboard.

The dashboard is divided into three main areas.

**Upload Artwork**

The creator can upload digital artwork and provide metadata such as:

- Title
- Description
- File name
- File type
- File size
- Wallet address
- Creator DID
- Upload timestamp

The development implementation supports common image formats such as:

```text
PNG
JPG / JPEG
WEBP
GIF
```

The current development configuration uses a file-size limit of approximately 10 MB.

**Artwork Ownership**

Artwork is associated with the authenticated wallet.

The backend should use the identity contained in the authenticated JWT rather than trusting an arbitrary owner address supplied by the browser.

This prevents one authenticated user from simply changing an owner field to access another creator's artwork.

**My Artwork**

The dashboard displays artwork associated with the authenticated creator.

Artwork can move through states such as:

```text
UPLOADED
   |
   v
AI PENDING
   |
   +---- FAILED
   |
   v
AI PASSED
   |
   v
MINTED
```

**Marketplace**

The dashboard provides access to marketplace functionality.

**Profile**

The profile area represents the creator's Web3 identity and can contain:

- Wallet address
- DID
- Display name
- Creator information

---

**6. Phase 3 — AI Artwork Analysis**

The AI engine is positioned between artwork upload and NFT minting.

The goal is to reduce the risk of minting artwork that appears highly similar to existing content.

The intended pipeline is:

```text
Uploaded Artwork
       |
       v
Image Preprocessing
       |
       +---------------------+
       |                     |
       v                     v
CLIP Similarity        CNN Style Fingerprint
       |                     |
       +----------+----------+
                  |
                  v
        Originality Decision
                  |
           +------+------+
           |             |
           v             v
          PASS          FAIL
           |             |
           |             +--> Fraud Alert
           |             +--> Minting Blocked
           |
           v
    Price Prediction
```

**Image Similarity**

A CLIP-style model can convert artwork into an embedding.

The embedding can then be compared against an indexed collection of artwork embeddings.

Conceptually:

```text
Image
  |
  v
CLIP Encoder
  |
  v
Image Embedding
  |
  v
Vector Similarity Search
  |
  v
Most Similar Artwork
  |
  v
Similarity Score
```

A production deployment would require a real indexed NFT/artwork dataset and vector search infrastructure.

**Style Fingerprint**

A CNN-based model can extract visual characteristics from artwork.

Potential features include:

- texture
- composition
- color patterns
- shapes
- visual structure
- artistic style

The result can be combined with similarity signals to make the originality decision.

**Originality Decision**

The AI service returns information such as:

```text
similarity score
style score
originality score
decision
fraud flag
```

A failed result should prevent the artwork from reaching the minting stage.

```text
AI FAILED
   |
   v
Fraud Alert
   |
   v
Minting Blocked
```

**Price Prediction**

A separate prediction component can estimate an indicative artwork price using features such as:

- artwork characteristics
- creator reputation
- historical sales
- collection/category
- market activity
- AI-derived features

The prediction is intended as an estimate rather than a guaranteed market value.

**Important implementation note**

The current local project provides the AI service boundary and development/demo behavior. A genuine production implementation of a 14M+ NFT similarity system requires a real indexed dataset, model inference, embeddings, vector search, and appropriate data licensing.

---

**7. Phase 4 — Blockchain and NFT Minting**

Minting happens only after the artwork has passed the application's AI validation stage.

The intended flow is:

```text
AI Passed
    |
    v
Generate Metadata
    |
    v
Store Artwork / Metadata
    |
    v
Obtain Content URI
    |
    v
NFT Smart Contract
    |
    +--> ERC-721
    |
    +--> ERC-1155
    |
    v
Royalty Configuration
    |
    v
Mint NFT
```

**Metadata**

NFT metadata contains information such as:

```json
{
  "name": "Artwork Name",
  "description": "Artwork Description",
  "image": "ipfs://...",
  "creator": "did:pkh:eip155:1:0x...",
  "attributes": [
    {
      "trait_type": "Originality Score",
      "value": 91
    }
  ]
}
```

The local development implementation can use a local metadata URI. Production deployment should use a content-addressed storage system such as IPFS.

**ERC-721**

ERC-721 is used for unique NFT assets.

Each NFT has a unique token ID.

```text
Creator
   |
   v
Mint
   |
   v
Token ID
   |
   v
Owner
```

**ERC-1155**

ERC-1155 can be used when multiple editions or quantities of the same tokenized asset are required.

For example:

```text
Artwork Edition
Token ID: 15
Supply: 100
```

**EIP-2981 Royalties**

AuthArt supports ERC-2981 royalty information.

For example, with a 5% royalty:

```text
Sale Price = 1 ETH

Royalty = 0.05 ETH
Seller Amount = 0.95 ETH
```

The marketplace can use the royalty information to determine the creator's royalty payment.

**IPFS and Filecoin**

The production architecture is designed to use:

```text
Artwork
   |
   v
IPFS
   |
   v
CID
   |
   v
NFT Metadata
   |
   v
Blockchain
```

Filecoin can provide long-term decentralized storage infrastructure.

The current local build should not be interpreted as a production IPFS/Filecoin deployment unless those services are configured with real credentials and endpoints.

**LayerZero**

LayerZero is an optional future component for cross-chain communication.

Conceptually:

```text
Source Chain
     |
     v
LayerZero
     |
     v
Destination Chain
```

The current project keeps this as an integration point rather than claiming a production cross-chain bridge.

---

**8. Phase 5 — NFT Marketplace**

The marketplace allows creators to list NFTs and buyers to purchase them.

The core flow is:

```text
Creator
   |
   v
NFT
   |
   v
List NFT
   |
   v
Marketplace
   |
   v
Buyer
   |
   v
Purchase
   |
   +--> Royalty Calculation
   +--> Royalty Payment
   +--> Seller Payment
   +--> NFT Transfer
   +--> Reputation Update
```

**Listing**

The seller lists an NFT with a price.

The marketplace verifies that the seller has the required ownership/approval.

**Purchase**

A buyer submits the required payment.

The marketplace validates the listing and processes the transaction.

**Royalty Settlement**

The marketplace reads royalty information from the NFT contract using the ERC-2981 mechanism.

The transaction can then distribute:

```text
Sale
 |
 +--> Creator Royalty
 |
 +--> Seller Proceeds
```

**NFT Transfer**

After successful payment, ownership is transferred from the marketplace escrow/approved seller flow to the buyer.

**Reputation**

The marketplace maintains basic reputation information.

A successful transaction can update both:

```text
Seller Reputation
Buyer Reputation
```

A production reputation system would require additional anti-abuse rules and potentially off-chain indexing.

---

**9. Zero-Knowledge Proof Architecture**

The original architecture includes a zero-knowledge ownership verification layer.

The intended concept is:

```text
Buyer
  |
  v
Generate Proof
  |
  v
ZK Verification
  |
  v
Marketplace
```

A zero-knowledge proof could allow a user to prove that a condition is true without exposing unnecessary information.

The current repository should not describe an ordinary Ethereum signature as a zero-knowledge proof. A production ZKP implementation would require:

- circuit design
- proving system
- proving key
- verification key
- prover
- verifier
- smart-contract verification
- security testing

Possible technologies include Groth16 or PLONK.

---

**10. Smart Contract Architecture**

The smart-contract directory contains the blockchain layer.

A simplified architecture is:

```text
AuthArtNFT
    |
    +--> ERC-721
    +--> Token URI
    +--> Creator Tracking
    +--> ERC-2981 Royalties
    |
    v
AuthArtMarketplace
    |
    +--> Listing
    +--> Purchase
    +--> Royalty Settlement
    +--> NFT Transfer
    +--> Reputation
```

The ERC-1155 contract provides an alternative token standard for editions and multi-token assets.

OpenZeppelin is used for established smart-contract primitives.

---

**11. Repository Structure**

```text
Auth-Art/
|
+-- frontend/
|   |
|   +-- vite-project/
|       |
|       +-- src/
|       |   +-- components/
|       |   +-- pages/
|       |   +-- services/
|       |   +-- assets/
|       |   +-- styles/
|       |
|       +-- package.json
|       +-- vite.config.js
|
+-- backend/
|   |
|   +-- routes/
|   |   +-- artwork.js
|   |
|   +-- services/
|   |   +-- ai.js
|   |   +-- blockchain.js
|   |
|   +-- data/
|   |   +-- users.json
|   |   +-- artworks.json
|   |
|   +-- uploads/
|   +-- server.js
|   +-- package.json
|   +-- .env.example
|
+-- ai-engine/
|   +-- main.py
|
+-- smart-contracts/
|   |
|   +-- contracts/
|   |   +-- AuthArtNFT.sol
|   |   +-- AuthArt1155.sol
|   |   +-- AuthArtMarketplace.sol
|   |
|   +-- scripts/
|   |   +-- deploy.ts
|   |
|   +-- hardhat.config.ts
|   +-- package.json
|
+-- PROJECT_STATUS.md
+-- README.md
```

---

**12. API Overview**

**Authentication**

Request nonce:

```http
POST /api/auth/nonce
```

Example:

```json
{
  "address": "0x..."
}
```

Verify signature:

```http
POST /api/auth/verify
```

Example:

```json
{
  "address": "0x...",
  "signature": "0x..."
}
```

Authenticated user:

```http
GET /api/auth/me
Authorization: Bearer <JWT>
```

**Artwork**

Get creator artwork:

```http
GET /api/artworks
Authorization: Bearer <JWT>
```

Upload artwork:

```http
POST /api/artworks/upload
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
```

Run AI analysis:

```http
POST /api/artworks/:id/analyze
Authorization: Bearer <JWT>
```

Mint artwork:

```http
POST /api/artworks/:id/mint
Authorization: Bearer <JWT>
```

---

**13. Environment Configuration**

Example backend configuration:

```env
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
RPC_URL=http://127.0.0.1:8545
NFT_CONTRACT_ADDRESS=
MINTER_PRIVATE_KEY=
```

For local development:

```text
PORT
```

controls the backend port.

```text
FRONTEND_ORIGIN
```

defines the frontend allowed by CORS.

```text
JWT_SECRET
```

is used to sign authentication tokens.

```text
RPC_URL
```

points the backend toward the Ethereum-compatible RPC endpoint.

```text
NFT_CONTRACT_ADDRESS
```

should contain the deployed NFT contract address when blockchain minting is configured.

```text
MINTER_PRIVATE_KEY
```

should contain a development/test account key when backend-controlled local minting is enabled.

Never use a real wallet seed phrase or production private key in source code or GitHub.

---

**14. Running the Project Locally**

**Backend**

```bash
cd backend
npm install
npm start
```

Expected backend address:

```text
http://localhost:5000
```

**Frontend**

Open another terminal:

```bash
cd frontend/vite-project
npm install
npm run dev
```

Expected frontend address:

```text
http://localhost:5173
```

**AI Engine**

Create a Python virtual environment:

```bash
cd ai-engine
python -m venv venv
```

Windows:

```powershell
.\venv\Scripts\activate
```

Install requirements if a `requirements.txt` is provided:

```bash
pip install -r requirements.txt
```

Run the FastAPI service according to the AI engine configuration, for example:

```bash
uvicorn main:app --reload --port 8000
```

**Local Blockchain**

Open another terminal:

```bash
cd smart-contracts
npm install
npx hardhat compile
npx hardhat node
```

Keep the Hardhat node running.

In another terminal, deploy the contracts using the project's deployment script:

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

Copy the deployed NFT contract address into the backend `.env`.

---

**15. End-to-End Testing**

The complete system should be tested in this order.

**Test 1 — Backend**

Start the backend and verify:

```text
http://localhost:5000
```

is reachable.

**Test 2 — Frontend**

Start Vite and open:

```text
http://localhost:5173
```

**Test 3 — Wallet Connection**

Click:

```text
Connect Wallet
```

Approve the MetaMask connection.

**Test 4 — Signature Authentication**

The application should request a signature.

Sign the authentication message.

Expected result:

```text
Wallet Verified
DID Created / Retrieved
JWT Issued
Dashboard Opened
```

**Test 5 — Artwork Upload**

Upload an image.

Expected result:

```text
Artwork Uploaded
AI Status: Pending
```

**Test 6 — AI Analysis**

Run the artwork analysis.

Expected result:

```text
Similarity Score
Style Score
Originality Decision
Fraud Status
Price Estimate
```

If the artwork fails:

```text
Fraud Alert
Minting Blocked
```

**Test 7 — Blockchain**

Start Hardhat and deploy the contracts.

Configure:

```text
RPC_URL
NFT_CONTRACT_ADDRESS
MINTER_PRIVATE_KEY
```

Restart the backend.

**Test 8 — Minting**

For artwork that passes the AI check:

```text
Start Minting
```

Expected result:

```text
Metadata Generated
Transaction Submitted
Token ID Created
NFT Minted
```

**Test 9 — Marketplace**

List the minted NFT.

Use another test wallet as the buyer.

Purchase the NFT.

Expected result:

```text
Payment
   |
   +--> Royalty
   +--> Seller Proceeds
   |
   v
NFT Ownership Transfer
   |
   v
Reputation Update
```

---

**16. Security Considerations**

AuthArt includes several important security concepts.

**Nonce Replay Protection**

Authentication challenges expire and are consumed after successful use.

**Signature Verification**

The server independently recovers the wallet address from the signature instead of trusting the browser.

**JWT Authentication**

Protected APIs require a valid JWT.

**Ownership Validation**

Artwork operations should use the authenticated wallet identity.

**Smart Contract Security**

OpenZeppelin implementations are used for standard token and security primitives.

The marketplace uses reentrancy protection where applicable.

**Private Keys**

Production private keys must never be committed to GitHub.

For production, use a secure key-management system.

**Input Validation**

Production deployment should add strict validation for:

- uploaded file types
- file contents
- file sizes
- API input
- metadata
- prices
- addresses
- smart-contract parameters

---

**17. Current Implementation Status**

| Component | Status |
|---|---|
| MetaMask connection | Implemented |
| Nonce authentication | Implemented |
| Signature verification | Implemented |
| Replay protection | Implemented |
| DID generation | Implemented |
| JWT authentication | Implemented |
| Returning-user authentication | Implemented |
| Creator dashboard | Implemented |
| Artwork upload | Implemented |
| Artwork ownership association | Implemented |
| Marketplace UI | Implemented |
| Profile UI | Implemented |
| AI service boundary | Implemented |
| Local AI/demo fallback | Implemented |
| Production CLIP inference | Requires model integration |
| Large-scale NFT similarity corpus | Requires dataset/index |
| Production CNN fingerprint model | Requires trained model |
| Production price model | Requires trained model/data |
| ERC-721 contract | Implemented |
| ERC-1155 contract | Implemented |
| ERC-2981 royalties | Implemented |
| Hardhat local deployment | Implemented |
| Local blockchain minting | Implemented/configurable |
| IPFS production integration | Requires configuration |
| Filecoin integration | Requires configuration |
| LayerZero integration | Requires configuration |
| Marketplace listing | Implemented |
| Marketplace purchase | Implemented |
| Royalty settlement | Implemented |
| Basic reputation tracking | Implemented |
| Production ZKP circuit | Not implemented |

---

**18. Development vs Production**

The repository is intended to be a development/demo implementation that can be extended toward production.

The following components should be upgraded before a real deployment:

```text
Local JSON
    ↓
MongoDB / PostgreSQL

Local uploads
    ↓
IPFS / Filecoin

Demo AI fallback
    ↓
Real CLIP + vector database + CNN

Development Hardhat
    ↓
Testnet / Mainnet

Development private key
    ↓
Secure signing infrastructure

Basic reputation
    ↓
Indexed and abuse-resistant reputation system

ZKP integration boundary
    ↓
Audited zk-SNARK circuit
```

The project should not claim a real 14M+ NFT search, production AI accuracy, live Filecoin persistence, LayerZero bridging, or zero-knowledge ownership verification until those components are connected and tested with real infrastructure.

---

**19. Future Improvements**

Planned improvements include:

- MongoDB/PostgreSQL persistence
- Redis-based nonce storage
- Real CLIP embeddings
- Vector database for similarity search
- Large NFT/artwork index
- Trained CNN style model
- Trained price prediction model
- IPFS integration
- Filecoin integration
- LayerZero cross-chain support
- Real zk-SNARK ownership proofs
- Complete marketplace frontend
- Creator reputation profiles
- Blockchain event indexing
- Automated unit/integration tests
- Smart-contract security testing
- Production monitoring
- Cloud deployment
- CI/CD pipeline

---

**20. Project Workflow Summary**

The complete AuthArt process can be summarized as:

```text
1. Connect MetaMask
        |
2. Request Nonce
        |
3. Sign Authentication Message
        |
4. Recover and Verify Wallet Address
        |
5. Create / Retrieve DID
        |
6. Issue JWT
        |
7. Open Creator Dashboard
        |
8. Upload Artwork
        |
9. Run AI Analysis
        |
10. Check Originality
        |
   +----+----+
   |         |
  FAIL      PASS
   |         |
 Block       |
 Minting     |
             v
11. Generate Metadata
             |
12. Store Artwork / Metadata
             |
13. Mint ERC-721 / ERC-1155
             |
14. Apply ERC-2981 Royalty
             |
15. List NFT
             |
16. Buyer Purchases
             |
17. Verify Transaction
             |
18. Transfer NFT
             |
19. Pay Royalty
             |
20. Update Reputation
```

---

**21. Conclusion**

AuthArt combines Web3 identity, AI-assisted artwork analysis, NFT standards, creator royalties, and marketplace functionality into a single application.

The main design principle is to perform the application's artwork analysis before committing the asset to the blockchain:

```text
Authentication
      ↓
Artwork Upload
      ↓
AI Validation
      ↓
Blockchain Minting
      ↓
Marketplace
```

This separation allows the AI, API, frontend, storage, and blockchain components to evolve independently.

The architecture is also designed so that development components can later be replaced with production infrastructure without changing the overall application flow.

**Author**

AuthArt — AI + Web3 NFT Art Platform

Technologies: React, Vite, Node.js, Express, Python, FastAPI, MetaMask, ethers.js, Solidity, Hardhat, OpenZeppelin, Ethereum/EVM, ERC-721, ERC-1155, ERC-2981, CLIP/CNN integration architecture, decentralized storage integration, and marketplace smart contracts.
