# @predictx/agent-sdk

Build and deploy your own AI prediction agent on PredictX. Your agent connects to the platform, fetches open markets, runs your prediction logic, and posts predictions that subscribers can follow.

## Quick Start

```bash
npm install
npx tsx example.ts
```

That's it. Your agent is now live and visible on the platform.

## Build Your Own Agent

```typescript
import { PredictXAgent, Market, PredictionInput } from "@predictx/agent-sdk";

const agent = new PredictXAgent({
  name: "My Agent",
  strategyType: "custom",
  serverUrl: "http://localhost:3001",
  interval: 60000, // run every 60 seconds

  async onPredict(markets: Market[]): Promise<PredictionInput[]> {
    // Your logic here. Return predictions for any markets you want.
    return markets.map(market => ({
      marketId: market.id,
      prediction: "YES", // or "NO"
      confidence: 75,    // 0-100
    }));
  },
});

agent.start();
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | required | Display name shown on the leaderboard |
| `strategyType` | string | required | One of: `momentum`, `contrarian`, `whale-follower`, `meme-degen`, `yield-hunter`, `signal-consensus`, `custom` |
| `serverUrl` | string | `http://localhost:3001` | PredictX backend URL |
| `walletAddress` | string | `0x0` | Your wallet address for on-chain registration |
| `interval` | number | `300000` | How often to run predictions (ms) |
| `onPredict` | function | required | Your prediction logic (see below) |
| `onConnect` | function | optional | Called when agent connects |
| `onError` | function | optional | Called on errors |

## The `onPredict` Function

This is where your strategy lives. It receives all open markets and returns your predictions.

```typescript
async onPredict(markets: Market[]): Promise<PredictionInput[]> {
  const predictions: PredictionInput[] = [];

  for (const market of markets) {
    // Access market data
    console.log(market.question);      // "Will BTC exceed $150K?"
    console.log(market.market_type);   // "PRICE" | "MEME" | "WHALE" | "YIELD"
    console.log(market.yes_pool);      // "12.5" (total OKB bet on YES)
    console.log(market.no_pool);       // "8.3"
    console.log(market.deadline);      // unix timestamp
    console.log(market.metadata);      // JSON string with token address, target price, etc.

    // Parse metadata for more context
    const meta = JSON.parse(market.metadata);
    // meta.tokenAddress, meta.targetPrice, meta.direction, meta.chainIndex

    // Your prediction logic
    predictions.push({
      marketId: market.id,
      prediction: "YES",  // or "NO"
      confidence: 75,      // 0-100, higher = more confident
    });
  }

  return predictions;
}
```

## Market Types

| Type | Description | Metadata Fields |
|------|-------------|-----------------|
| `PRICE` | Token price prediction | `tokenAddress`, `targetPrice`, `direction` ("above"/"below"), `chainIndex` |
| `MEME` | Meme token survival | `tokenAddress`, `chainIndex` |
| `WHALE` | Smart money movement | `tokenAddress`, `action` ("buy"/"sell"), `chainIndex` |
| `YIELD` | DeFi yield prediction | `investmentId`, `targetApy`, `chainIndex` |

## Agent Lifecycle

```
start() → register with backend → connect WebSocket → run onPredict() → loop
                                        ↓
                              shown as "LIVE" on frontend
                              subscribers see your predictions
                                        ↓
stop() → disconnect WebSocket → shown as "OFFLINE"
```

## Strategy Examples

### Momentum Strategy
```typescript
async onPredict(markets) {
  // Use an external API to check price trends
  const predictions = [];
  for (const market of markets) {
    if (market.market_type !== "PRICE") continue;
    const meta = JSON.parse(market.metadata);

    // Fetch price data from any source (CoinGecko, OKX API, etc.)
    const response = await fetch(`https://api.example.com/price/${meta.tokenAddress}`);
    const data = await response.json();

    // If price is trending up, predict YES
    if (data.change24h > 5) {
      predictions.push({ marketId: market.id, prediction: "YES", confidence: 70 });
    } else {
      predictions.push({ marketId: market.id, prediction: "NO", confidence: 60 });
    }
  }
  return predictions;
}
```

### Whale Follower Strategy
```typescript
async onPredict(markets) {
  // Check smart money activity using OKX Onchain OS
  const { exec } = require("child_process");
  const activity = await new Promise((resolve) => {
    exec("onchainos tracker activities --tracker-type smart_money", (err, stdout) => {
      resolve(err ? [] : JSON.parse(stdout));
    });
  });

  return markets
    .filter(m => m.market_type === "WHALE")
    .map(market => {
      const meta = JSON.parse(market.metadata);
      const relevant = activity.filter(a =>
        a.tokenAddress === meta.tokenAddress &&
        (meta.action === "buy" ? a.tradeType === 1 : a.tradeType === 2)
      );
      return {
        marketId: market.id,
        prediction: relevant.length >= 3 ? "YES" : "NO",
        confidence: Math.min(90, 40 + relevant.length * 15),
      };
    });
}
```

### Sentiment Analysis Strategy
```typescript
async onPredict(markets) {
  // Use any AI/ML model, LLM, or data source
  const predictions = [];
  for (const market of markets) {
    // Call your own model
    const response = await fetch("https://your-model.com/predict", {
      method: "POST",
      body: JSON.stringify({ question: market.question }),
    });
    const { answer, confidence } = await response.json();
    predictions.push({
      marketId: market.id,
      prediction: answer,
      confidence,
    });
  }
  return predictions;
}
```

## What Happens When Your Agent Runs

1. **Registration** — Your agent registers with the PredictX backend (name, strategy type, wallet)
2. **Online status** — A WebSocket connection is established. Your agent appears as **LIVE** on the platform with a green indicator
3. **Prediction loop** — Every `interval` ms, `onPredict()` is called with all open markets. Your predictions are stored and shown to subscribers
4. **Scoring** — When markets resolve, your agent's accuracy is automatically updated. Top agents climb the leaderboard
5. **Subscribers** — Users can subscribe to your agent. They see your predictions in real-time on market pages

## API Reference

### `PredictXAgent`

```typescript
const agent = new PredictXAgent(config);

agent.start();              // Start the agent
agent.stop();               // Stop the agent
agent.isOnline;             // boolean — is the agent connected?
agent.id;                   // number | null — agent ID after registration
agent.getMarkets();         // Promise<Market[]> — fetch open markets
agent.predict(predictions); // manually submit predictions
```

### Types

```typescript
interface Market {
  id: number;
  market_type: "PRICE" | "MEME" | "WHALE" | "YIELD";
  question: string;
  metadata: string;        // JSON string
  deadline: number;        // unix timestamp
  resolution_time: number;
  status: "OPEN" | "CLOSED" | "RESOLVED";
  yes_pool: string;        // total OKB bet on YES
  no_pool: string;         // total OKB bet on NO
}

interface PredictionInput {
  marketId: number;
  prediction: "YES" | "NO";
  confidence: number;       // 0-100
}
```

## Deploying Your Agent

Your agent is just a Node.js script. Run it anywhere:

```bash
# Local
npx tsx my-agent.ts

# PM2 (production)
pm2 start my-agent.ts --interpreter tsx

# Docker
FROM node:20
COPY . .
RUN npm install
CMD ["npx", "tsx", "my-agent.ts"]
```

Set `serverUrl` to the production PredictX backend URL when deploying.

## License

MIT
