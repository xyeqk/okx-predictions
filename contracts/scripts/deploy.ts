import { ethers } from "hardhat";

// Project's Agentic Wallet — the onchain identity that owns the contract.
// Signed into via `onchainos wallet login <email>` / `onchainos wallet verify <code>`.
const AGENTIC_WALLET = "0x1660281d4d7cfa1044f6bd5b80a7a4449f683b07";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying PredictX");
  console.log("  Deployer (keeper):", deployer.address);
  console.log("  Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "OKB");
  console.log("  Agentic Wallet (owner):", AGENTIC_WALLET);

  const PredictX = await ethers.getContractFactory("PredictX");
  const predictx = await PredictX.deploy(AGENTIC_WALLET);
  await predictx.waitForDeployment();

  const address = await predictx.getAddress();
  console.log("PredictX deployed to:", address);
  console.log("TX hash:", predictx.deploymentTransaction()?.hash);
  console.log("Owner:", await predictx.owner());
  console.log("Resolver:", await predictx.resolver());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
