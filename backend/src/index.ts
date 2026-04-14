import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import cron from "node-cron";
import dotenv from "dotenv";
import db from "./db";

dotenv.config({ path: "../.env" });

import marketRoutes from "./routes/markets";
import agentRoutes from "./routes/agents";
import { resolveExpiredMarkets } from "./services/resolver";

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/markets", marketRoutes);
app.use("/api/agents", agentRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Track online agents: agentId -> socketId
const onlineAgents = new Map<number, string>();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-market", (marketId: string) => { socket.join(`market-${marketId}`); });
  socket.on("leave-market", (marketId: string) => { socket.leave(`market-${marketId}`); });

  socket.on("agent-online", (data: { agentId: number; name: string; strategyType: string }) => {
    if (data.agentId) {
      onlineAgents.set(data.agentId, socket.id);
      console.log(`[Agent] "${data.name}" (ID:${data.agentId}) is ONLINE`);
      io.emit("agent-status-changed", { agentId: data.agentId, online: true });
    }
  });

  socket.on("agent-offline", (data: { agentId: number }) => {
    if (data.agentId) {
      onlineAgents.delete(data.agentId);
      console.log(`[Agent] ID:${data.agentId} is OFFLINE`);
      io.emit("agent-status-changed", { agentId: data.agentId, online: false });
    }
  });

  socket.on("agent-prediction", (data: { agentId: number; marketId: number; prediction: string; confidence: number }) => {
    console.log(`[Agent] ID:${data.agentId} predicted ${data.prediction} on market #${data.marketId}`);
    io.emit("new-prediction", data);
  });

  // Market chat relay + persist
  socket.on("market-chat", async (msg: { user: string; text: string; time: number; marketId: number }) => {
    try {
      await db.run(
        "INSERT INTO chat_messages (market_id, user_address, message, created_at) VALUES ($1, $2, $3, $4)",
        [msg.marketId, msg.user, msg.text, msg.time]
      );
    } catch {}
    socket.to(`market-${msg.marketId}`).emit("market-chat", msg);
  });

  socket.on("disconnect", () => {
    for (const [agentId, sid] of onlineAgents.entries()) {
      if (sid === socket.id) {
        onlineAgents.delete(agentId);
        console.log(`[Agent] ID:${agentId} disconnected -> OFFLINE`);
        io.emit("agent-status-changed", { agentId, online: false });
      }
    }
    console.log("Client disconnected:", socket.id);
  });
});

// API: get online agents
app.get("/api/agents/online", (_req, res) => {
  res.json(Array.from(onlineAgents.keys()));
});

// API: agent posts prediction (REST fallback for SDK)
app.post("/api/agents/:id/predict", async (req, res) => {
  const agentId = parseInt(req.params.id);
  const { marketId, prediction, confidence } = req.body;

  try {
    const existing = await db.get(
      "SELECT id FROM agent_predictions WHERE agent_id = $1 AND market_id = $2",
      [agentId, marketId]
    );

    if (existing) return res.json({ success: true, message: "Already predicted" });

    await db.run(
      "INSERT INTO agent_predictions (agent_id, market_id, prediction, confidence) VALUES ($1, $2, $3, $4)",
      [agentId, marketId, prediction, confidence || 50]
    );

    await db.run("UPDATE agents SET total_predictions = total_predictions + 1 WHERE id = $1", [agentId]);

    io.emit("new-prediction", { agentId, marketId, prediction, confidence });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.set("io", io);

// Check for markets to resolve every minute
cron.schedule("* * * * *", async () => {
  try { await resolveExpiredMarkets(); io.emit("markets-updated"); }
  catch (err) { console.error("Resolver cron error:", err); }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`PredictX backend running on port ${PORT}`);
});
