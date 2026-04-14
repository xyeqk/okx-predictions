import { create } from "zustand";
import type { Market, Agent } from "../types";

interface AppStore {
  // Markets
  markets: Market[];
  setMarkets: (markets: Market[]) => void;
  selectedType: string | null;
  setSelectedType: (type: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Agents
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;

  // Wallet
  walletAddress: string | null;
  walletBalance: string;
  setWallet: (address: string | null, balance?: string) => void;
}

export const useStore = create<AppStore>((set) => ({
  markets: [],
  setMarkets: (markets) => set({ markets }),
  selectedType: null,
  setSelectedType: (selectedType) => set({ selectedType }),
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  agents: [],
  setAgents: (agents) => set({ agents }),

  walletAddress: null,
  walletBalance: "0",
  setWallet: (address, balance) =>
    set({ walletAddress: address, walletBalance: balance || "0" }),
}));
