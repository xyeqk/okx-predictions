import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import db from "../db";
import { getContract } from "../services/contract";

const router = Router();

// Get all agents (leaderboard)
router.get("/", async (req: Request, res: Response) => {
  const { sortBy } = req.query;
  let order = "ORDER BY correct_predictions DESC, total_predictions DESC";
  if (sortBy === "accuracy") {
    order = `ORDER BY (CASE WHEN total_predictions > 0 THEN CAST(correct_predictions AS REAL) / total_predictions ELSE 0 END) DESC`;
  } else if (sortBy === "subscribers") {
    order = "ORDER BY subscriber_count DESC";
  }

  const agents = await db.all(`
    SELECT *, CASE WHEN total_predictions > 0
      THEN ROUND((correct_predictions::numeric / total_predictions) * 100, 1)
      ELSE 0 END as accuracy
    FROM agents ${order}
  `);
  res.json(agents);
});

// Get single agent
router.get("/:id", async (req: Request, res: Response) => {
  const agent = await db.get(`
    SELECT *, CASE WHEN total_predictions > 0
      THEN ROUND((correct_predictions::numeric / total_predictions) * 100, 1)
      ELSE 0 END as accuracy
    FROM agents WHERE id = $1
  `, [req.params.id]);
  if (!agent) return res.status(404).json({ error: "Agent not found" });

  const predictions = await db.all(`
    SELECT ap.*, m.question, m.market_type, m.outcome as market_outcome, m.status as market_status
    FROM agent_predictions ap
    JOIN markets m ON m.id = ap.market_id
    WHERE ap.agent_id = $1
    ORDER BY ap.created_at DESC
    LIMIT 50
  `, [req.params.id]);

  res.json({ ...agent, predictions });
});

// Register agent (SDK)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, strategyType, config, owner, description, image, specialization, walletAddress } = req.body;

    let chainAgentId = 0;
    let txHash = "";
    try {
      const contract = getContract();
      const tx = await contract.registerAgent(name, strategyType);
      const receipt = await tx.wait();
      txHash = tx.hash;
      const iface = contract.interface;
      const log = receipt.logs.find((l: any) => { try { iface.parseLog(l); return true; } catch { return false; } });
      const parsed = log ? iface.parseLog(log) : null;
      chainAgentId = parsed ? Number(parsed.args[0]) : 0;
    } catch (e) {
      console.warn("On-chain agent registration failed:", e);
    }

    const result = await db.get<{ id: number }>(`
      INSERT INTO agents (chain_agent_id, wallet_address, name, description, image, specialization, strategy_type, config)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [chainAgentId, walletAddress || owner || "0x0", name, description || "", image || "", specialization || "crypto", strategyType, JSON.stringify(config || {})]);

    res.json({ id: result?.id, chainAgentId, txHash });
  } catch (error: any) {
    console.error("Create agent error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Subscribe to agent
router.post("/:id/subscribe", async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.body;
    const agentId = parseInt(req.params.id);
    await db.run("INSERT INTO subscriptions (agent_id, user_address) VALUES ($1, $2) ON CONFLICT (agent_id, user_address) DO NOTHING", [agentId, userAddress]);
    await db.run("UPDATE agents SET subscriber_count = (SELECT COUNT(*) FROM subscriptions WHERE agent_id = $1) WHERE id = $2", [agentId, agentId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe with signature verification
router.post("/:id/subscribe-signed", async (req: Request, res: Response) => {
  try {
    const { userAddress, message, signature } = req.body;
    const agentId = parseInt(req.params.id);

    if (!userAddress || !message || !signature) {
      return res.status(400).json({ error: "Missing userAddress, message, or signature" });
    }

    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== userAddress.toLowerCase()) {
      return res.status(401).json({ error: "Signature verification failed" });
    }
    if (!message.includes(`agent #${agentId}`)) {
      return res.status(400).json({ error: "Message does not match agent" });
    }

    await db.run("INSERT INTO subscriptions (agent_id, user_address) VALUES ($1, $2) ON CONFLICT (agent_id, user_address) DO NOTHING", [agentId, userAddress]);
    await db.run("UPDATE agents SET subscriber_count = (SELECT COUNT(*) FROM subscriptions WHERE agent_id = $1) WHERE id = $2", [agentId, agentId]);
    res.json({ success: true, verified: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe
router.delete("/:id/subscribe", async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.body;
    const agentId = parseInt(req.params.id);
    await db.run("DELETE FROM subscriptions WHERE agent_id = $1 AND user_address = $2", [agentId, userAddress]);
    await db.run("UPDATE agents SET subscriber_count = (SELECT COUNT(*) FROM subscriptions WHERE agent_id = $1) WHERE id = $2", [agentId, agentId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent predictions
router.get("/:id/predictions", async (req: Request, res: Response) => {
  const predictions = await db.all(`
    SELECT ap.*, m.question, m.market_type, m.outcome as market_outcome, m.status as market_status
    FROM agent_predictions ap
    JOIN markets m ON m.id = ap.market_id
    WHERE ap.agent_id = $1
    ORDER BY ap.created_at DESC
  `, [req.params.id]);
  res.json(predictions);
});

// Get agent subscribers
router.get("/:id/subscribers", async (req: Request, res: Response) => {
  const subs = await db.all("SELECT * FROM subscriptions WHERE agent_id = $1 ORDER BY created_at DESC", [req.params.id]);
  res.json(subs);
});

// Agent places trade for subscribers (SDK)
router.post("/:id/trade", async (req: Request, res: Response) => {
  try {
    const agentId = parseInt(req.params.id);
    const { marketId, side, amount, walletAddress } = req.body;

    const agent = await db.get<any>("SELECT * FROM agents WHERE id = $1", [agentId]);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    if (agent.wallet_address !== walletAddress) return res.status(403).json({ error: "Wallet mismatch" });

    try {
      const contract = getContract();
      const sideIndex = side === "YES" ? 1 : 2;
      const tx = await contract.agentPlaceBet(agentId, marketId, sideIndex, amount);
      await tx.wait();
      res.json({ success: true, txHash: tx.hash });
    } catch (err: any) {
      res.status(500).json({ error: err.reason || err.message });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
