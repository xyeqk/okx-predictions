import { io, Socket } from "socket.io-client";
import axios, { AxiosInstance } from "axios";

export interface Market {
  id: number;
  market_type: string;
  question: string;
  metadata: string;
  deadline: number;
  resolution_time: number;
  status: string;
  yes_pool: string;
  no_pool: string;
}

export interface PredictionInput {
  marketId: number;
  prediction: "YES" | "NO";
  confidence: number;
}

export interface AgentConfig {
  /** Agent display name */
  name: string;
  /** Agent description shown to users */
  description: string;
  /** Avatar image URL */
  image?: string;
  /** Specialization: sports | crypto | political | entertainment | other */
  specialization: string;
  /** Strategy type identifier */
  strategyType: string;
  /** Your agent's wallet address (used for on-chain registration) */
  walletAddress: string;
  /** Backend URL (default: http://localhost:3001) */
  serverUrl?: string;
  /** Prediction loop interval in ms (default: 300000 = 5min) */
  interval?: number;
  /** Called when agent should make predictions */
  onPredict?: (markets: Market[]) => Promise<PredictionInput[]>;
  /** Called when agent connects */
  onConnect?: () => void;
  /** Called on errors */
  onError?: (error: Error) => void;
}

export interface AgentStats {
  id: number;
  name: string;
  description: string;
  image: string;
  specialization: string;
  strategy_type: string;
  total_predictions: number;
  correct_predictions: number;
  subscriber_count: number;
  accuracy: number;
  total_funds: string;
}

export interface Subscriber {
  user_address: string;
  deposited: string;
  created_at: number;
}

export class PredictXAgent {
  private config: Required<Pick<AgentConfig, "name" | "description" | "specialization" | "strategyType" | "walletAddress">> & AgentConfig;
  private socket: Socket | null = null;
  private api: AxiosInstance;
  private agentId: number | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private _isOnline = false;

  constructor(config: AgentConfig) {
    this.config = {
      serverUrl: "http://localhost:3001",
      interval: 300000,
      image: "",
      ...config,
    };
    this.api = axios.create({ baseURL: `${this.config.serverUrl}/api` });
  }

  get isOnline() { return this._isOnline; }
  get id() { return this.agentId; }

  /** Register the agent with the platform */
  async register(): Promise<number> {
    console.log(`[Agent] Registering "${this.config.name}"...`);

    const { data } = await this.api.post("/agents", {
      name: this.config.name,
      description: this.config.description,
      image: this.config.image,
      specialization: this.config.specialization,
      strategyType: this.config.strategyType,
      walletAddress: this.config.walletAddress,
    });

    this.agentId = data.id;
    console.log(`[Agent] Registered with ID: ${this.agentId}`);
    return this.agentId!;
  }

  /** Connect to WebSocket — marks agent as online */
  connect(): void {
    if (!this.agentId) throw new Error("Register first");

    this.socket = io(this.config.serverUrl!, { transports: ["websocket", "polling"] });

    this.socket.on("connect", () => {
      this._isOnline = true;
      this.socket?.emit("agent-online", {
        agentId: this.agentId,
        name: this.config.name,
        strategyType: this.config.strategyType,
      });
      console.log(`[Agent] ONLINE (socket: ${this.socket?.id})`);
      this.config.onConnect?.();
    });

    this.socket.on("disconnect", () => {
      this._isOnline = false;
      console.log(`[Agent] Disconnected`);
    });

    this.socket.on("markets-updated", () => {
      if (this.config.onPredict) this.runPredictions();
    });
  }

  /** Disconnect — marks agent as offline */
  disconnect(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.socket) {
      this.socket.emit("agent-offline", { agentId: this.agentId });
      this.socket.disconnect();
    }
    this._isOnline = false;
    console.log(`[Agent] Stopped`);
  }

  /** Start the prediction loop */
  startPredictionLoop(): void {
    if (!this.config.onPredict) throw new Error("onPredict callback required");
    this.runPredictions();
    this.intervalId = setInterval(() => this.runPredictions(), this.config.interval!);
    console.log(`[Agent] Prediction loop started (every ${this.config.interval! / 1000}s)`);
  }

  /** Full start: register → connect → start loop */
  async start(): Promise<void> {
    await this.register();
    this.connect();
    if (this.config.onPredict) {
      await this.runPredictions();
      this.intervalId = setInterval(() => this.runPredictions(), this.config.interval!);
    }
    console.log(`[Agent] Running`);
  }

  /** Fetch all open markets */
  async getMarkets(): Promise<Market[]> {
    const { data } = await this.api.get("/markets", { params: { status: "OPEN" } });
    return data;
  }

  /** Submit predictions for markets */
  async predict(predictions: PredictionInput[]): Promise<void> {
    for (const pred of predictions) {
      try {
        await this.api.post(`/agents/${this.agentId}/predict`, {
          marketId: pred.marketId,
          prediction: pred.prediction,
          confidence: pred.confidence,
        });
        this.socket?.emit("agent-prediction", { agentId: this.agentId, ...pred });
        console.log(`[Agent] Predicted ${pred.prediction} (${pred.confidence}%) on market #${pred.marketId}`);
      } catch (err: any) {
        console.error(`[Agent] Prediction error:`, err.message);
      }
    }
  }

  /** Place a bet on behalf of subscribers (uses agent fund pool) */
  async placeBetForSubscribers(marketId: number, side: "YES" | "NO", amount: string): Promise<{ txHash: string }> {
    if (!this.agentId) throw new Error("Register first");

    const { data } = await this.api.post(`/agents/${this.agentId}/trade`, {
      marketId,
      side,
      amount,
      walletAddress: this.config.walletAddress,
    });

    console.log(`[Agent] Placed ${side} bet of ${amount} on market #${marketId} — tx: ${data.txHash}`);
    return data;
  }

  /** Get subscribers list */
  async getSubscribers(): Promise<Subscriber[]> {
    if (!this.agentId) throw new Error("Register first");
    const { data } = await this.api.get(`/agents/${this.agentId}/subscribers`);
    return data;
  }

  /** Get agent stats */
  async getStats(): Promise<AgentStats> {
    if (!this.agentId) throw new Error("Register first");
    const { data } = await this.api.get(`/agents/${this.agentId}`);
    return data;
  }

  /** Internal: run prediction cycle */
  private async runPredictions(): Promise<void> {
    if (!this.config.onPredict) return;
    try {
      const markets = await this.getMarkets();
      if (!markets.length) return;
      const predictions = await this.config.onPredict(markets);
      if (predictions.length) await this.predict(predictions);
    } catch (err: any) {
      this.config.onError?.(err);
      console.error(`[Agent] Error:`, err.message);
    }
  }
}

export default PredictXAgent;
