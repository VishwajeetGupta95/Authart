const { ethers } = require('ethers');
const abi=['function mint(address to,string uri,address royaltyReceiver,uint96 royaltyBps) external returns(uint256)'];
async function mintIfConfigured({ownerAddress,metadataUri,royaltyBps=500}){
 if(!process.env.RPC_URL||!process.env.NFT_CONTRACT_ADDRESS||!process.env.MINTER_PRIVATE_KEY)return null;
 const provider=new ethers.JsonRpcProvider(process.env.RPC_URL);const signer=new ethers.Wallet(process.env.MINTER_PRIVATE_KEY,provider);const c=new ethers.Contract(process.env.NFT_CONTRACT_ADDRESS,abi,signer);
 const tx=await c.mint(ownerAddress,metadataUri,ownerAddress,royaltyBps);const receipt=await tx.wait();
 return {network:await provider.getNetwork().then(n=>n.name),chainId:(await provider.getNetwork()).chainId.toString(),contractAddress:process.env.NFT_CONTRACT_ADDRESS,transactionHash:receipt.hash,metadataUri,royaltyBps};
}
module.exports={mintIfConfigured};
