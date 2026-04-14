import type { StrategyTemplate } from "../types";

export const API_URL = import.meta.env.VITE_API_URL || "/api";

export const MARKET_TYPE_LABELS: Record<string, string> = {
  SPORTS: "Sports",
  CRYPTO: "Crypto",
  POLITICAL: "Political",
  ENTERTAINMENT: "Entertainment",
  OTHER: "Other",
};

export const MARKET_TYPE_COLORS: Record<string, string> = {
  SPORTS: "bg-green",
  CRYPTO: "bg-blue",
  POLITICAL: "bg-purple",
  ENTERTAINMENT: "bg-pink",
  OTHER: "bg-yellow",
};

export const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    id: "momentum",
    name: "Momentum",
    description: "Predicts continuation when price rises above threshold",
    icon: "📈",
    color: "bg-accent-blue",
    params: [
      { key: "changeThreshold", label: "Price Change %", type: "number", default: 5, min: 1, max: 50, step: 1 },
      { key: "lookbackPeriod", label: "Lookback (hours)", type: "number", default: 24, min: 1, max: 168, step: 1 },
    ],
  },
  {
    id: "contrarian",
    name: "Contrarian",
    description: "Predicts recovery when price drops below threshold",
    icon: "🔄",
    color: "bg-accent-green",
    params: [
      { key: "dropThreshold", label: "Drop Threshold %", type: "number", default: -5, min: -50, max: -1, step: 1 },
      { key: "recoveryPeriod", label: "Recovery (hours)", type: "number", default: 12, min: 1, max: 72, step: 1 },
    ],
  },
  {
    id: "whale-follower",
    name: "Whale Follower",
    description: "Follows smart money buy signals from whales and KOLs",
    icon: "🐋",
    color: "bg-accent-purple",
    params: [
      { key: "minWhaleCount", label: "Min Whale Buys", type: "number", default: 3, min: 1, max: 20, step: 1 },
      { key: "minAmountUsd", label: "Min Amount ($)", type: "number", default: 50000, min: 1000, max: 1000000, step: 1000 },
    ],
  },
  {
    id: "meme-degen",
    name: "Meme Degen",
    description: "Evaluates meme tokens by dev reputation and bonding curve",
    icon: "🎰",
    color: "bg-accent-pink",
    params: [
      { key: "maxRugPullCount", label: "Max Dev Rugs", type: "number", default: 0, min: 0, max: 5, step: 1 },
      { key: "minBondingProgress", label: "Min Bonding %", type: "number", default: 50, min: 10, max: 100, step: 5 },
    ],
  },
  {
    id: "yield-hunter",
    name: "Yield Hunter",
    description: "Predicts yield sustainability based on APY trends",
    icon: "🌾",
    color: "bg-accent-yellow",
    params: [
      { key: "apyThreshold", label: "APY Threshold %", type: "number", default: 10, min: 1, max: 200, step: 1 },
      { key: "minTvl", label: "Min TVL ($)", type: "number", default: 100000, min: 1000, max: 10000000, step: 10000 },
    ],
  },
  {
    id: "signal-consensus",
    name: "Signal Consensus",
    description: "Requires consensus across multiple wallet types (smart money, KOL, whale)",
    icon: "🎯",
    color: "bg-accent-red",
    params: [
      { key: "minWalletTypes", label: "Min Wallet Types", type: "number", default: 2, min: 1, max: 3, step: 1 },
      { key: "minTriggerCount", label: "Min Signals", type: "number", default: 5, min: 1, max: 50, step: 1 },
    ],
  },
];
