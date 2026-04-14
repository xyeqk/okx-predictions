export type MarketType = "SPORTS" | "CRYPTO" | "POLITICAL" | "ENTERTAINMENT" | "OTHER";
export type MarketStatus = "OPEN" | "CLOSED" | "RESOLVED";
export type Outcome = "NONE" | "YES" | "NO";

export interface Market {
  id: number;
  chain_market_id: number;
  creator: string;
  market_type: MarketType;
  question: string;
  metadata: string;
  image_url: string;
  category: string;
  deadline: number;
  resolution_time: number;
  status: MarketStatus;
  outcome: Outcome;
  yes_pool: string;
  no_pool: string;
  creator_fee_bps: number;
  created_at: number;
}

export interface MarketDetail extends Market {
  bets: Bet[];
  agentPredictions: AgentPrediction[];
}

export interface Bet {
  id: number;
  market_id: number;
  user_address: string;
  side: "YES" | "NO";
  amount: string;
  tx_hash: string;
  created_at: number;
}

export interface Agent {
  id: number;
  chain_agent_id: number;
  owner: string;
  name: string;
  strategy_type: string;
  config: string;
  total_predictions: number;
  correct_predictions: number;
  subscriber_count: number;
  accuracy: number;
  active: number;
  created_at: number;
}

export interface AgentPrediction {
  id: number;
  agent_id: number;
  market_id: number;
  prediction: "YES" | "NO";
  confidence: number;
  created_at: number;
  agent_name?: string;
  strategy_type?: string;
  question?: string;
  market_type?: string;
  market_outcome?: string;
  market_status?: string;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  params: StrategyParam[];
}

export interface StrategyParam {
  key: string;
  label: string;
  type: "number" | "select";
  default: number;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: number }[];
}
