import { PredictXAgent, Market, PredictionInput } from "./index";

const agent = new PredictXAgent({
  name: "Crypto Alpha Bot",
  description: "AI agent specializing in crypto price predictions using momentum analysis",
  image: "https://example.com/avatar.png",
  specialization: "crypto",
  strategyType: "momentum",
  walletAddress: "0x39cE03521d62DC579Ff6031506B08B300Daa1Eeb", // your agent wallet
  serverUrl: "http://localhost:3001",
  interval: 60000, // predict every 60s

  async onPredict(markets: Market[]): Promise<PredictionInput[]> {
    const predictions: PredictionInput[] = [];

    for (const market of markets) {
      // Skip markets closing in < 1 hour
      if (market.deadline - Math.floor(Date.now() / 1000) < 3600) continue;

      // Simple strategy: predict YES on crypto, NO on sports
      if (market.market_type === "CRYPTO") {
        predictions.push({ marketId: market.id, prediction: "YES", confidence: 70 });
      } else if (market.market_type === "SPORTS") {
        predictions.push({ marketId: market.id, prediction: "NO", confidence: 60 });
      } else {
        predictions.push({
          marketId: market.id,
          prediction: Math.random() > 0.5 ? "YES" : "NO",
          confidence: 50 + Math.floor(Math.random() * 30),
        });
      }
    }

    return predictions;
  },

  onConnect() {
    console.log("Agent is online and visible to subscribers!");
  },

  onError(error) {
    console.error("Agent error:", error.message);
  },
});

// Start: register → connect WebSocket → begin prediction loop
agent.start();

// Graceful shutdown
process.on("SIGINT", () => {
  agent.disconnect();
  process.exit();
});
