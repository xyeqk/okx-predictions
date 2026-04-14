import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, Bot, BarChart2, TrendingUp, ArrowRight, Clock, CheckCircle, XCircle } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { getMarkets, getAgents } from "../lib/api";
import { formatVolume, truncateAddress, timeAgo } from "../lib/format";
import { MARKET_TYPE_LABELS } from "../lib/constants";
import type { Market, Agent } from "../types";

interface Bet {
  id: number;
  market_id: number;
  user_address: string;
  side: string;
  amount: string;
  tx_hash: string;
  created_at: number;
}

interface MarketWithBets extends Market {
  bets: Bet[];
}

export default function Portfolio() {
  const { isConnected, connect, address } = useWallet();
  const [markets, setMarkets] = useState<MarketWithBets[]>([]);
  const [agents, setAgentsData] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    (async () => {
      try {
        // Fetch all markets with bets
        const allMarkets = await getMarkets();
        // For each market, fetch details to get bets
        const detailed = await Promise.all(
          allMarkets.map(async (m: Market) => {
            try {
              const res = await fetch(`/api/markets/${m.id}`);
              return await res.json();
            } catch { return { ...m, bets: [] }; }
          })
        );
        setMarkets(detailed);
      } catch {}
      try { setAgentsData(await getAgents()); } catch {}
      setLoading(false);
    })();
  }, [address]);

  // Filter bets belonging to current user
  const myBets: (Bet & { market: MarketWithBets })[] = [];
  let totalInvested = 0;
  let wins = 0;
  let resolved = 0;

  if (address) {
    const addrLower = address.toLowerCase();
    for (const market of markets) {
      for (const bet of (market.bets || [])) {
        if (bet.user_address.toLowerCase() === addrLower) {
          myBets.push({ ...bet, market });
          totalInvested += parseFloat(bet.amount) || 0;
          if (market.status === "RESOLVED") {
            resolved++;
            if (market.outcome === bet.side) wins++;
          }
        }
      }
    }
  }

  const winRate = resolved > 0 ? Math.round((wins / resolved) * 100) : 0;
  const subscribedAgents = agents.filter(() => false); // TODO: check subscriptions

  if (loading) return <div className="p-5 animate-pulse space-y-4"><div className="h-20 bg-surface rounded-xl border border-border" /><div className="h-40 bg-surface rounded-xl border border-border" /></div>;

  return (
    <div className="p-5 space-y-5">
      <div className="rounded-xl bg-surface border border-border p-6">
        <div className="label-sm mb-2">PORTFOLIO</div>
        <h1 className="text-[24px] font-bold tracking-tight">Your Dashboard</h1>
        {address && <p className="text-[11px] text-text-3 font-mono mt-1">{address}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "TOTAL INVESTED", value: `${totalInvested.toFixed(4)} OKB`, sub: formatVolume(totalInvested), color: "text-green", icon: TrendingUp },
          { label: "ACTIVE POSITIONS", value: String(myBets.length), sub: `${myBets.filter(b => b.market.status === "OPEN").length} open`, color: "text-blue-light", icon: BarChart2 },
          { label: "WIN RATE", value: `${winRate}%`, sub: `${wins}/${resolved} resolved`, color: "text-purple", icon: TrendingUp },
          { label: "AGENTS", value: String(subscribedAgents.length), sub: `${agents.length} available`, color: "text-yellow", icon: Bot },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="rounded-lg bg-surface border border-border p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={12} className={color} />
              <span className="text-[9px] font-bold text-text-3 tracking-[0.12em]">{label}</span>
            </div>
            <div className={`text-[20px] font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-text-3 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Positions */}
      {isConnected && myBets.length > 0 ? (
        <div className="rounded-xl bg-surface border border-border p-5">
          <div className="label-sm mb-3">YOUR POSITIONS</div>
          <div className="space-y-1">
            {myBets.map((bet) => {
              const m = bet.market;
              const isWin = m.status === "RESOLVED" && m.outcome === bet.side;
              const isLoss = m.status === "RESOLVED" && m.outcome !== bet.side;
              return (
                <Link key={bet.id} to={`/markets/${m.id}`}
                  className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-surface-2 transition-colors border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        m.market_type === "CRYPTO" ? "bg-blue/10 text-blue-light" :
                        m.market_type === "SPORTS" ? "bg-green/10 text-green" :
                        "bg-purple/10 text-purple"
                      }`}>{MARKET_TYPE_LABELS[m.market_type] || m.market_type}</span>
                      {m.status === "OPEN" && <Clock size={10} className="text-text-3" />}
                      {isWin && <CheckCircle size={10} className="text-green" />}
                      {isLoss && <XCircle size={10} className="text-red" />}
                    </div>
                    <p className="text-[13px] font-medium mt-1 truncate">{m.question}</p>
                    <p className="text-[10px] text-text-3 mt-0.5">{timeAgo(bet.created_at)} · tx: {bet.tx_hash?.slice(0, 12)}...</p>
                  </div>
                  <div className="shrink-0 text-right ml-4">
                    <div className={`text-[14px] font-bold ${bet.side === "YES" ? "text-green" : "text-red"}`}>
                      {bet.side}
                    </div>
                    <div className="text-[12px] text-text-2 font-mono">{bet.amount} OKB</div>
                    {m.status === "RESOLVED" && (
                      <div className={`text-[10px] font-bold mt-0.5 ${isWin ? "text-green" : "text-red"}`}>
                        {isWin ? "WON" : "LOST"}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : isConnected ? (
        <div className="rounded-xl bg-surface border border-border p-12 text-center">
          <div className="text-3xl mb-3 opacity-20">📊</div>
          <h3 className="text-[15px] font-bold">No positions yet</h3>
          <p className="text-[12px] text-text-3 mt-1 mb-5">Buy shares in prediction markets to see your portfolio</p>
          <Link to="/" className="inline-flex items-center gap-1.5 bg-blue text-white px-5 py-2 rounded-md text-[12px] font-bold">
            Browse Markets <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-surface border border-border p-12 text-center">
          <div className="text-3xl mb-3 opacity-20">🔗</div>
          <h3 className="text-[15px] font-bold">Connect Wallet</h3>
          <p className="text-[12px] text-text-3 mt-1 mb-5">Connect to track your predictions and performance</p>
          <button onClick={connect} className="inline-flex items-center gap-1.5 bg-blue text-white px-5 py-2 rounded-md text-[12px] font-bold">
            <Wallet size={13} /> Connect
          </button>
        </div>
      )}
    </div>
  );
}
