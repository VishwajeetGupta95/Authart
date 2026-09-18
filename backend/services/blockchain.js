const { ethers } = require('ethers');

const nftAbi = [
  'function mint(address to, string uri, address royaltyReceiver, uint96 royaltyBps) external returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount)',
];

const marketplaceAbi = [
  'function list(address nft, uint256 tokenId, uint256 price) external returns (uint256)',
  'function buy(uint256 id) external payable',
  'function cancel(uint256 id) external',
  'function listings(uint256 id) external view returns (address seller, address nft, uint256 tokenId, uint256 price, bool active)',
  'function reputation(address user) external view returns (uint256)',
];

function createProvider(rpcUrl) {
  // Avoid repeated network discovery retries when the optional local chain is stopped.
  return new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
}

/**
 * Executes on-chain minting on the configured EVM chain (Hardhat/Sepolia).
 * Falls back to demo receipt if RPC/contract variables are unset or unreachable.
 */
async function mintIfConfigured({ ownerAddress, metadataUri, royaltyBps = 500 }) {
  const rpcUrl = process.env.RPC_URL;
  const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
  const privateKey = process.env.MINTER_PRIVATE_KEY;

  if (!rpcUrl || !contractAddress || !privateKey) {
    return null;
  }

  try {
    const provider = createProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, nftAbi, signer);

    const tx = await contract.mint(ownerAddress, metadataUri, ownerAddress, royaltyBps);
    const receipt = await tx.wait();
    const network = await provider.getNetwork();

    return {
      onChain: true,
      network: network.name || 'Localhost / Hardhat',
      chainId: network.chainId.toString(),
      contractAddress,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      metadataUri,
      royaltyBps,
    };
  } catch (err) {
    console.warn('[Blockchain Service] Live on-chain minting failed, using fallback:', err.message);
    return null;
  }
}

/**
 * Checks on-chain creator reputation score from the marketplace contract.
 */
async function getCreatorReputation(address) {
  const rpcUrl = process.env.RPC_URL;
  const marketplaceAddress = process.env.MARKETPLACE_CONTRACT_ADDRESS;

  if (!rpcUrl || !marketplaceAddress) return 0;

  try {
    const provider = createProvider(rpcUrl);
    const contract = new ethers.Contract(marketplaceAddress, marketplaceAbi, provider);
    const rep = await contract.reputation(address);
    return Number(rep);
  } catch {
    return 0;
  }
}

module.exports = {
  mintIfConfigured,
  getCreatorReputation,
  nftAbi,
  marketplaceAbi,
};
