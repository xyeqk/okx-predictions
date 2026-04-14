import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying PredictX with account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  const PredictX = await ethers.getContractFactory("PredictX");
  const predictx = await PredictX.deploy();
  await predictx.waitForDeployment();

  const address = await predictx.getAddress();
  console.log("PredictX deployed to:", address);
  console.log("TX hash:", predictx.deploymentTransaction()?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
