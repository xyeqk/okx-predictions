import axios from "axios";
import { API_URL } from "./constants";
import type { Market, MarketDetail, Agent } from "../types";

const api = axios.create({ baseURL: API_URL });

// Markets
export const getMarkets = (params?: { type?: string; status?: string }) =>
  api.get<Market[]>("/markets", { params }).then((r) => r.data);

export const getMarket = (id: number) =>
  api.get<MarketDetail>(`/markets/${id}`).then((r) => r.data);

export const createMarket = (data: {
  marketType: string;
  question: string;
  metadata: any;
  deadline: number;
  resolutionTime: number;
  creatorFeeBps?: number;
  imageUrl?: string;
  category?: string;
  creator?: string;
}) => api.post("/markets", data).then((r) => r.data);

export const placeBet = (marketId: number, data: { side: string; amount: string; userAddress: string }) =>
  api.post(`/markets/${marketId}/bet`, data).then((r) => r.data);

// Record a bet that was placed on-chain directly by the user's wallet
export const recordBet = (marketId: number, data: { side: string; amount: string; userAddress: string; txHash: string }) =>
  api.post(`/markets/${marketId}/record-bet`, data).then((r) => r.data);

export const getMarketOdds = (id: number) =>
  api.get<{ yesPercent: number; noPercent: number }>(`/markets/${id}/odds`).then((r) => r.data);

// Agents
export const getAgents = (params?: { sortBy?: string }) =>
  api.get<Agent[]>("/agents", { params }).then((r) => r.data);

export const getAgent = (id: number) =>
  api.get(`/agents/${id}`).then((r) => r.data);

export const createAgent = (data: { name: string; strategyType: string; config: any; owner?: string }) =>
  api.post("/agents", data).then((r) => r.data);

export const subscribeToAgent = (agentId: number, userAddress: string) =>
  api.post(`/agents/${agentId}/subscribe`, { userAddress }).then((r) => r.data);

export const unsubscribeFromAgent = (agentId: number, userAddress: string) =>
  api.delete(`/agents/${agentId}/subscribe`, { data: { userAddress } }).then((r) => r.data);

// Data
export const getHotTokens = () => api.get("/data/hot-tokens").then((r) => r.data);
export const getWhaleActivity = () => api.get("/data/whale-activity").then((r) => r.data);
export const getSignals = (chain?: string) => api.get("/data/signals", { params: { chain } }).then((r) => r.data);
export const getMemeTokens = (chain?: string) => api.get("/data/meme-tokens", { params: { chain } }).then((r) => r.data);
