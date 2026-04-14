import db from "../db";

/**
 * Auto-close markets whose deadline has passed.
 * Actual resolution (YES/NO) is done manually by an admin via POST /api/markets/:id/resolve
 * since markets cover sports/political/entertainment events which need human judgement.
 */
export async function resolveExpiredMarkets() {
  const now = Math.floor(Date.now() / 1000);
  try {
    const result = await db.run(
      "UPDATE markets SET status = 'CLOSED' WHERE status = 'OPEN' AND deadline <= $1",
      [now]
    );
    if (result.changes && result.changes > 0) {
      console.log(`[Resolver] Closed ${result.changes} expired market(s)`);
    }
  } catch (err) {
    console.error("[Resolver] Error:", err);
  }
}
