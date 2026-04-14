import { io } from "socket.io-client";
import axios from "axios";

const SERVER = "http://localhost:3001";
const api = axios.create({ baseURL: `${SERVER}/api` });

const AGENT_CONFIG = {
  name: "Crypto Alpha Bot",
  description: "AI prediction agent using momentum and sentiment analysis for crypto markets",
  image: "",
  specialization: "crypto",
  strategyType: "momentum",
  walletAddress: "0x39cE03521d62DC579Ff6031506B08B300Daa1Eeb",
};

let agentId: number | null = null;

async function register() {
  console.log(`[Agent] Registering "${AGENT_CONFIG.name}"...`);
  try {
    const { data } = await api.post("/agents", AGENT_CONFIG);
    agentId = data.id;
    console.log(`[Agent] Registered with ID: ${agentId}`);
  } catch (err: any) {
    console.error("[Agent] Registration failed:", err.response?.data || err.message);
    process.exit(1);
  }
}

function connectWebSocket() {
  const socket = io(SERVER, { transports: ["websocket", "polling"] });

  socket.on("connect", () => {
    console.log(`[Agent] ONLINE (socket: ${socket.id})`);
    socket.emit("agent-online", {
      agentId,
      name: AGENT_CONFIG.name,
      strategyType: AGENT_CONFIG.strategyType,
    });
  });

  socket.on("disconnect", () => {
    console.log("[Agent] Disconnected");
  });

  socket.on("markets-updated", () => {
    console.log("[Agent] Markets updated, running predictions...");
    runPredictions();
  });

  process.on("SIGINT", () => {
    socket.emit("agent-offline", { agentId });
    socket.disconnect();
    console.log("[Agent] Stopped");
    process.exit();
  });

  return socket;
}

async function runPredictions() {
  if (!agentId) return;

  try {
    const { data: markets } = await api.get("/markets", { params: { status: "OPEN" } });
    if (!markets.length) {
      console.log("[Agent] No open markets");
      return;
    }

    for (const market of markets) {
      // Check if already predicted
      try {
        const yesPool = parseFloat(market.yes_pool) || 0;
        const noPool = parseFloat(market.no_pool) || 0;
        const total = yesPool + noPool;

        // Simple strategy: follow the crowd if volume exists, otherwise random
        let prediction: "YES" | "NO";
        let confidence: number;

        if (total > 0) {
          const yesPct = yesPool / total;
          prediction = yesPct > 0.5 ? "YES" : "NO";
          confidence = Math.round(Math.max(yesPct, 1 - yesPct) * 100);
        } else {
          prediction = Math.random() > 0.45 ? "YES" : "NO";
          confidence = 50 + Math.floor(Math.random() * 25);
        }

        await api.post(`/agents/${agentId}/predict`, {
          marketId: market.id,
          prediction,
          confidence,
        });

        console.log(`[Agent] Market #${market.id}: ${prediction} (${confidence}%) — "${market.question.slice(0, 50)}..."`);
      } catch (err: any) {
        // Already predicted or other error
        if (!err.response?.data?.message?.includes("Already")) {
          console.error(`[Agent] Error on market #${market.id}:`, err.response?.data || err.message);
        }
      }
    }
  } catch (err: any) {
    console.error("[Agent] Prediction cycle error:", err.message);
  }
}

async function main() {
  await register();
  connectWebSocket();

  // Initial prediction run
  setTimeout(() => runPredictions(), 2000);

  // Prediction loop every 2 minutes
  setInterval(() => runPredictions(), 120000);

  console.log("[Agent] Running. Press Ctrl+C to stop.");
}

main();
