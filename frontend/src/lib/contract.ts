import { BrowserProvider, Contract, parseEther } from "ethers";

const CONTRACT_ADDRESS = "0xdb032DA5a99FF27024c4868bc8B9B3211A0fac0C";

const ABI = [
  "function placeBet(uint256 _marketId, uint8 _side) external payable",
  "function createMarket(uint8 _type, string _question, string _metadata, uint256 _deadline, uint256 _resolutionTime, uint256 _creatorFeeBps) external returns (uint256)",
  "function claimWinnings(uint256 _marketId) external",
  "function registerAgent(string _name, string _strategyType) external returns (uint256)",
  "function subscribeToAgent(uint256 _agentId) external",
  "function depositToAgent(uint256 _agentId) external payable",
  "function withdrawFromAgent(uint256 _agentId) external",
  "function getMarket(uint256 _id) external view returns (tuple(uint256 id, address creator, uint8 marketType, string question, string metadata, uint256 deadline, uint256 resolutionTime, uint8 status, uint8 outcome, uint256 yesPool, uint256 noPool, uint256 creatorFeeBps))",
  "function getMarketOdds(uint256 _id) external view returns (uint256 yesPercent, uint256 noPercent)",
  "function marketCount() external view returns (uint256)",
  "function getAgentFunds(uint256 _agentId, address _user) external view returns (uint256)",
];

function getProvider() {
  const w = window as any;
  const raw = w.okxwallet || w.ethereum;
  if (!raw) throw new Error("No wallet found");
  return new BrowserProvider(raw);
}

async function getSigner() {
  const provider = getProvider();
  return provider.getSigner();
}

async function getContract(withSigner = false) {
  if (withSigner) {
    const signer = await getSigner();
    return new Contract(CONTRACT_ADDRESS, ABI, signer);
  }
  const provider = getProvider();
  return new Contract(CONTRACT_ADDRESS, ABI, provider);
}

export async function placeBetOnChain(marketId: number, side: "YES" | "NO", amountInOKB: string) {
  const contract = await getContract(true);
  const sideIndex = side === "YES" ? 1 : 2;
  const tx = await contract.placeBet(marketId, sideIndex, {
    value: parseEther(amountInOKB),
  });
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

export async function createMarketOnChain(
  type: number,
  question: string,
  metadata: string,
  deadline: number,
  resolutionTime: number,
  creatorFeeBps: number
) {
  const contract = await getContract(true);
  const tx = await contract.createMarket(type, question, metadata, deadline, resolutionTime, creatorFeeBps);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

export async function claimWinningsOnChain(marketId: number) {
  const contract = await getContract(true);
  const tx = await contract.claimWinnings(marketId);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

export async function registerAgentOnChain(name: string, strategyType: string) {
  const contract = await getContract(true);
  const tx = await contract.registerAgent(name, strategyType);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

export async function subscribeToAgentOnChain(agentId: number) {
  const contract = await getContract(true);
  const tx = await contract.subscribeToAgent(agentId);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

export async function depositToAgentOnChain(agentId: number, amountInOKB: string) {
  const contract = await getContract(true);
  const tx = await contract.depositToAgent(agentId, { value: parseEther(amountInOKB) });
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

export async function withdrawFromAgentOnChain(agentId: number) {
  const contract = await getContract(true);
  const tx = await contract.withdrawFromAgent(agentId);
  const receipt = await tx.wait();
  return { txHash: tx.hash, receipt };
}

export { CONTRACT_ADDRESS };
