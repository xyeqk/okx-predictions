import { io } from "socket.io-client";
import axios from "axios";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const SERVER = process.env.PREDICTX_SERVER || "http://localhost:3001";
const api = axios.create({ baseURL: `${SERVER}/api` });

// ─── Agentic Wallet: the onchain identity of this agent ───
// Populated on startup from `onchainos wallet addresses`.
// Read more: https://okx.com/onchainos
let agenticWalletAddress = "";

async function loadAgenticWalletIdentity(): Promise<string> {
  try {
    const { stdout } = await execFileAsync("onchainos", ["wallet", "addresses"]);
    const payload = JSON.parse(stdout);
    if (!payload.ok) throw new Error(payload.error || "Agentic Wallet not logged in");
    const evm = (payload.data?.evm || []).find((a: any) => a.chainName === "eth");
    if (!evm?.address) throw new Error("No EVM address in Agentic Wallet");
    console.log(`[Agent] Agentic Wallet identity: ${evm.address}`);
    return evm.address;
  } catch (err: any) {
    console.error("[Agent] Failed to load Agentic Wallet — is `onchainos wallet login <email>` completed?");
    console.error(err.message || err);
    process.exit(1);
  }
}

// ─── Onchain OS skill: okx-dex-signal ───
// Fetches whale / smart-money / KOL signals for a token and returns a short rationale.
// Called before submitting predictions on crypto markets.
async function fetchTokenSignal(tokenQuery: string): Promise<{ bias: "YES" | "NO" | null; note: string }> {
  try {
    const { stdout } = await execFileAsync(
      "onchainos",
      ["signal", "smart-money", "--token", tokenQuery, "--chain", "eth", "--limit", "10"],
      { timeout: 10_000 }
    );
    const payload = JSON.parse(stdout);
    if (!payload.ok) return { bias: null, note: `signal unavailable: ${payload.error}` };

    const signals = payload.data?.signals || payload.data?.items || [];
    if (!signals.length) return { bias: null, note: "no smart-money signals in last 24h" };

    // Tally buy vs sell pressure from signal types
    let buy = 0, sell = 0;
    for (const s of signals) {
      const side = (s.side || s.direction || "").toLowerCase();
      if (side.includes("buy") || side.includes("long")) buy++;
      else if (side.includes("sell") || side.includes("short")) sell++;
    }
    if (buy === 0 && sell === 0) return { bias: null, note: `${signals.length} signals, no clear bias` };
    const bias = buy >= sell ? "YES" : "NO";
    return { bias, note: `smart-money ${buy}↑/${sell}↓ on ${tokenQuery}` };
  } catch (err: any) {
    return { bias: null, note: `signal error: ${err.message?.slice(0, 80)}` };
  }
}

// Extract a plausible token symbol from a market question
function extractToken(question: string): string | null {
  const m = question.match(/\b(BTC|ETH|SOL|OKB|BNB|MATIC|ARB|DOGE|SHIB|LINK|UNI|AVAX|OP|PEPE)\b/i);
  return m ? m[1].toUpperCase() : null;
}

const AGENT_CONFIG = {
  name: "Crypto Alpha Bot",
  description: "AI agent using OKX Onchain OS smart-money signals to predict crypto market outcomes",
  image: "",
  specialization: "crypto",
  strategyType: "onchain-signal",
  walletAddress: "",  // filled from Agentic Wallet on startup
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

  socket.on("disconnect", () => console.log("[Agent] Disconnected"));

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
      try {
        const yesPool = parseFloat(market.yes_pool) || 0;
        const noPool = parseFloat(market.no_pool) || 0;
        const total = yesPool + noPool;

        let prediction: "YES" | "NO";
        let confidence: number;
        let rationale = "";

        // ─── Step 1: Onchain OS signal lookup (crypto markets only) ───
        const token = market.market_type === "CRYPTO" ? extractToken(market.question) : null;
        const signal = token ? await fetchTokenSignal(token) : { bias: null, note: "" };

        // ─── Step 2: blend signal with pool sentiment ───
        if (signal.bias) {
          prediction = signal.bias;
          confidence = 70;
          rationale = signal.note;
        } else if (total > 0) {
          const yesPct = yesPool / total;
          prediction = yesPct > 0.5 ? "YES" : "NO";
          confidence = Math.round(Math.max(yesPct, 1 - yesPct) * 100);
          rationale = `pool ratio ${Math.round(yesPct * 100)}%/${Math.round((1 - yesPct) * 100)}%`;
        } else {
          prediction = Math.random() > 0.45 ? "YES" : "NO";
          confidence = 50 + Math.floor(Math.random() * 25);
          rationale = "no data — coin flip";
        }

        await api.post(`/agents/${agentId}/predict`, {
          marketId: market.id,
          prediction,
          confidence,
          rationale,
        });

        console.log(
          `[Agent] Market #${market.id}: ${prediction} (${confidence}%) — ${rationale} — "${market.question.slice(0, 50)}..."`
        );
      } catch (err: any) {
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
  agenticWalletAddress = await loadAgenticWalletIdentity();
  AGENT_CONFIG.walletAddress = agenticWalletAddress;

  await register();
  connectWebSocket();

  setTimeout(() => runPredictions(), 2000);
  setInterval(() => runPredictions(), 120_000);

  console.log(`[Agent] Running as ${agenticWalletAddress}. Press Ctrl+C to stop.`);
}

main();
