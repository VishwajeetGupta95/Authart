const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const NFT = await ethers.getContractFactory("AuthArtNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();

  const Market = await ethers.getContractFactory("AuthArtMarketplace");
  const market = await Market.deploy();
  await market.waitForDeployment();

  const out = {
    network: "localhost",
    chainId: 31337,
    nft: await nft.getAddress(),
    marketplace: await market.getAddress(),
  };
  fs.writeFileSync("deployments.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
