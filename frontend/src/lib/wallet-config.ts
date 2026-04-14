import { createAppKit } from "@reown/appkit";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";

const xlayerTestnet = {
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testrpc.xlayer.tech"] },
  },
  blockExplorers: {
    default: { name: "X Layer Explorer", url: "https://www.okx.com/explorer/xlayer-test" },
  },
  testnet: true,
};

const xlayerMainnet = {
  id: 196,
  name: "X Layer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.xlayer.tech"] },
  },
  blockExplorers: {
    default: { name: "X Layer Explorer", url: "https://www.okx.com/explorer/xlayer" },
  },
  testnet: false,
};

// You can get a project ID from https://cloud.reown.com
const projectId = "b1e43462c6dbf21eb52a62e4eab0e912";

const ethersAdapter = new EthersAdapter();

export const appKit = createAppKit({
  adapters: [ethersAdapter],
  networks: [xlayerTestnet, xlayerMainnet],
  projectId,
  metadata: {
    name: "PredictX",
    description: "AI-Powered Prediction Markets on X Layer",
    url: "https://predictx.xyz",
    icons: [],
  },
  features: {
    analytics: false,
  },
});

export { xlayerTestnet, xlayerMainnet };
