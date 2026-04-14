import { Router, Request, Response } from "express";
import { ethers } from "ethers";
import db from "../db";
import { getContract, getReadOnlyContract } from "../services/contract";

const router = Router();

// Get all markets
router.get("/", async (req: Request, res: Response) => {
  const { type, status } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];
  let i = 1;
  if (type) { conditions.push(`market_type = $${i++}`); params.push(type); }
  if (status) { conditions.push(`status = $${i++}`); params.push(status); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const markets = await db.all(`SELECT * FROM markets ${where} ORDER BY created_at DESC`, params);
  res.json(markets);
});

// Get single market
router.get("/:id", async (req: Request, res: Response) => {
  const market = await db.get("SELECT * FROM markets WHERE id = $1", [req.params.id]);
  if (!market) return res.status(404).json({ error: "Market not found" });

  const bets = await db.all("SELECT * FROM bets WHERE market_id = $1 ORDER BY created_at DESC LIMIT 20", [req.params.id]);

  const predictions = await db.all(`
    SELECT ap.*, a.name as agent_name, a.strategy_type
    FROM agent_predictions ap
    JOIN agents a ON a.id = ap.agent_id
    WHERE ap.market_id = $1
    ORDER BY ap.created_at DESC
  `, [req.params.id]);

  res.json({ ...market, bets, agentPredictions: predictions });
});

// Create market
router.post("/", async (req: Request, res: Response) => {
  try {
    const { marketType, question, metadata, deadline, resolutionTime, creatorFeeBps, imageUrl, category } = req.body;
    const typeMap: Record<string, number> = { SPORTS: 0, CRYPTO: 1, POLITICAL: 2, ENTERTAINMENT: 3, OTHER: 4 };
    const typeIndex = typeMap[marketType] ?? 4;

    const dl = Math.floor(deadline / 1000);
    const rt = Math.floor(resolutionTime / 1000);
    const fee = creatorFeeBps || 100;

    let chainMarketId = 0;
    let txHash = "";
    try {
      const contract = getContract();
      const tx = await contract.createMarket(typeIndex, question, JSON.stringify(metadata || {}), dl, rt, fee);
      const receipt = await tx.wait();
      txHash = tx.hash;
      const parseIface = contract.interface;
      const log = receipt.logs.find((l: any) => { try { parseIface.parseLog(l); return true; } catch { return false; } });
      const parsed = log ? parseIface.parseLog(log) : null;
      chainMarketId = parsed ? Number(parsed.args[0]) : 0;
    } catch (e: any) {
      console.warn("On-chain market creation failed:", e.message);
    }

    const result = await db.get<{ id: number }>(`
      INSERT INTO markets (chain_market_id, creator, market_type, question, metadata, image_url, category, deadline, resolution_time, creator_fee_bps)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
    `, [chainMarketId, req.body.creator || "0x0", marketType, question, JSON.stringify(metadata || {}), imageUrl || "", category || marketType, dl, rt, fee]);

    res.json({ id: result?.id, chainMarketId, txHash });
  } catch (error: any) {
    console.error("Create market error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Place bet (backend-executed — legacy path using deployer wallet)
router.post("/:id/bet", async (req: Request, res: Response) => {
  try {
    const { side, amount, userAddress } = req.body;
    const marketId = parseInt(req.params.id);
    const sideIndex = side === "YES" ? 1 : 2;

    const contract = getContract();
    const tx = await contract.placeBet(marketId, sideIndex, { value: ethers.parseEther(amount.toString()) });
    await tx.wait();

    await db.run(
      "INSERT INTO bets (market_id, user_address, side, amount, tx_hash) VALUES ($1, $2, $3, $4, $5)",
      [marketId, userAddress, side, amount, tx.hash]
    );

    const poolCol = side === "YES" ? "yes_pool" : "no_pool";
    await db.run(
      `UPDATE markets SET ${poolCol} = ((COALESCE(${poolCol}::numeric, 0)) + $1)::text WHERE id = $2`,
      [amount, marketId]
    );

    const io = req.app.get("io");
    if (io) io.emit("markets-updated");

    res.json({ txHash: tx.hash });
  } catch (error: any) {
    console.error("Place bet error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Record a bet placed directly on-chain by user's wallet (no backend tx)
router.post("/:id/record-bet", async (req: Request, res: Response) => {
  try {
    const { side, amount, userAddress, txHash } = req.body;
    const marketId = parseInt(req.params.id);

    await db.run(
      "INSERT INTO bets (market_id, user_address, side, amount, tx_hash) VALUES ($1, $2, $3, $4, $5)",
      [marketId, userAddress, side, amount, txHash]
    );

    const poolCol = side === "YES" ? "yes_pool" : "no_pool";
    await db.run(
      `UPDATE markets SET ${poolCol} = ((COALESCE(${poolCol}::numeric, 0)) + $1)::text WHERE id = $2`,
      [amount, marketId]
    );

    const io = req.app.get("io");
    if (io) io.emit("markets-updated");

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get odds for a market
router.get("/:id/odds", async (req: Request, res: Response) => {
  try {
    const contract = getReadOnlyContract();
    const [yesPercent, noPercent] = await contract.getMarketOdds(req.params.id);
    res.json({ yesPercent: Number(yesPercent), noPercent: Number(noPercent) });
  } catch {
    const market = await db.get<any>("SELECT yes_pool, no_pool FROM markets WHERE id = $1", [req.params.id]);
    if (!market) return res.status(404).json({ error: "Market not found" });
    const yes = parseFloat(market.yes_pool) || 0;
    const no = parseFloat(market.no_pool) || 0;
    const total = yes + no;
    res.json({
      yesPercent: total === 0 ? 50 : Math.round((yes / total) * 100),
      noPercent: total === 0 ? 50 : Math.round((no / total) * 100),
    });
  }
});

// Get chat messages for a market
router.get("/:id/chat", async (req: Request, res: Response) => {
  try {
    const messages = await db.all(
      "SELECT user_address as user, message as text, created_at as time FROM chat_messages WHERE market_id = $1 ORDER BY created_at ASC LIMIT 100",
      [req.params.id]
    );
    res.json(messages);
  } catch { res.json([]); }
});

// Resolve a market (admin/resolver only)
router.post("/:id/resolve", async (req: Request, res: Response) => {
  try {
    const marketId = parseInt(req.params.id);
    const { outcome } = req.body;
    if (!outcome || !["YES", "NO"].includes(outcome)) {
      return res.status(400).json({ error: "outcome must be YES or NO" });
    }

    const outcomeIndex = outcome === "YES" ? 1 : 2;
    try {
      const contract = getContract();
      const tx = await contract.resolveMarket(marketId, outcomeIndex);
      await tx.wait();
    } catch (e: any) {
      console.warn("On-chain resolution failed:", e.reason || e.message);
    }

    await db.run("UPDATE markets SET status = 'RESOLVED', outcome = $1 WHERE id = $2", [outcome, marketId]);

    const predictions = await db.all<any>("SELECT * FROM agent_predictions WHERE market_id = $1", [marketId]);
    for (const pred of predictions) {
      if (pred.prediction === outcome) {
        await db.run("UPDATE agents SET correct_predictions = correct_predictions + 1 WHERE id = $1", [pred.agent_id]);
      }
    }

    const io = req.app.get("io");
    if (io) io.emit("markets-updated");

    res.json({ success: true, outcome });
  } catch (error: any) {
    console.error("Resolve market error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
