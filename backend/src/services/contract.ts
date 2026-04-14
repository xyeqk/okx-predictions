import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const XLAYER_RPC = process.env.XLAYER_RPC || "https://testrpc.xlayer.tech";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

const ABI = [
  "function createMarket(uint8 _type, string _question, string _metadata, uint256 _deadline, uint256 _resolutionTime, uint256 _creatorFeeBps) external returns (uint256)",
  "function placeBet(uint256 _marketId, uint8 _side) external payable",
  "function resolveMarket(uint256 _marketId, uint8 _outcome) external",
  "function claimWinnings(uint256 _marketId) external",
  "function registerAgent(string _name, string _strategyType) external returns (uint256)",
  "function recordAgentPrediction(uint256 _agentId, uint256 _marketId, uint8 _prediction) external",
  "function updateAgentAccuracy(uint256 _agentId, uint256 _marketId) external",
  "function subscribeToAgent(uint256 _agentId) external",
  "function unsubscribeFromAgent(uint256 _agentId) external",
  "function getMarket(uint256 _id) external view returns (tuple(uint256 id, address creator, uint8 marketType, string question, string metadata, uint256 deadline, uint256 resolutionTime, uint8 status, uint8 outcome, uint256 yesPool, uint256 noPool, uint256 creatorFeeBps))",
  "function getMarketOdds(uint256 _id) external view returns (uint256 yesPercent, uint256 noPercent)",
  "function getAgent(uint256 _id) external view returns (tuple(uint256 id, address owner, string name, string strategyType, uint256 totalPredictions, uint256 correctPredictions, uint256 subscriberCount))",
  "function getAgentAccuracy(uint256 _id) external view returns (uint256)",
  "function getUserBet(uint256 _marketId, address _user) external view returns (uint256 yesBet, uint256 noBet)",
  "function marketCount() external view returns (uint256)",
  "function agentCount() external view returns (uint256)",
];

const provider = new ethers.JsonRpcProvider(XLAYER_RPC);
const wallet = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;
const contract = CONTRACT_ADDRESS
  ? new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet || provider)
  : null;

export function getContract() {
  if (!contract) throw new Error("Contract not configured. Set CONTRACT_ADDRESS in .env");
  return contract;
}

export function getProvider() {
  return provider;
}

export function getReadOnlyContract() {
  if (!CONTRACT_ADDRESS) throw new Error("Contract not configured");
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
}

export { CONTRACT_ADDRESS, ABI };
