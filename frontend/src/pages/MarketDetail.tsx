import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BarChart2, Clock, Send, TrendingUp, Users, DollarSign } from "lucide-react";
import { getMarket } from "../lib/api";
import { formatVolume, formatCountdown, truncateAddress, timeAgo } from "../lib/format";
import { MARKET_TYPE_LABELS } from "../lib/constants";
import BetPanel from "../components/market/BetPanel";
import StrategyBadge from "../components/agent/StrategyBadge";
import { useWallet } from "../hooks/useWallet";
import type { MarketDetail as MD } from "../types";

const TB: Record<string,string> = { SPORTS:"bg-green/80", CRYPTO:"bg-blue/80", POLITICAL:"bg-purple/80", ENTERTAINMENT:"bg-pink/80", OTHER:"bg-yellow/80" };

// Price chart built from actual trade history
function PriceChart({ bets, yesPercent }: { bets: any[]; yesPercent: number }) {
  // Build price history from trades — each trade moves the price
  const priceHistory: number[] = [50]; // start at 50%
  let yesTotal = 0, noTotal = 0;

  const sorted = [...(bets || [])].sort((a, b) => a.created_at - b.created_at);
  for (const bet of sorted) {
    if (bet.side === "YES") yesTotal += parseFloat(bet.amount);
    else noTotal += parseFloat(bet.amount);
    const total = yesTotal + noTotal;
    priceHistory.push(total > 0 ? Math.round((yesTotal / total) * 100) : 50);
  }
  // Ensure current price is at the end
  if (priceHistory[priceHistory.length - 1] !== yesPercent) priceHistory.push(yesPercent);

  const points = priceHistory;
  const w = 400, h = 100, pad = 5;
  const max = Math.max(...points, 60), min = Math.min(...points, 40);
  const range = max - min || 1;

  const pathStr = points.map((p, i) => {
    const x = pad + (i / Math.max(points.length - 1, 1)) * (w - 2 * pad);
    const y = pad + (1 - (p - min) / range) * (h - 2 * pad);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  const lastY = pad + (1 - (yesPercent - min) / range) * (h - 2 * pad);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[100px]">
      <defs>
        <linearGradient id="pf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={yesPercent >= 50 ? "#22c55e" : "#ef4444"} stopOpacity="0.15" />
          <stop offset="100%" stopColor={yesPercent >= 50 ? "#22c55e" : "#ef4444"} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 50% line */}
      <line x1={pad} y1={pad + (1 - (50 - min) / range) * (h - 2 * pad)} x2={w - pad} y2={pad + (1 - (50 - min) / range) * (h - 2 * pad)} stroke="#333" strokeWidth="0.5" strokeDasharray="4" />
      {/* Fill */}
      <path d={`${pathStr} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`} fill="url(#pf)" />
      {/* Line */}
      <path d={pathStr} fill="none" stroke={yesPercent >= 50 ? "#22c55e" : "#ef4444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Current price dot */}
      <circle cx={w - pad} cy={lastY} r="3" fill={yesPercent >= 50 ? "#22c55e" : "#ef4444"} />
    </svg>
  );
}

// Market stats panel
function MarketStats({ yesPool, noPool, yesPercent, bets }: { yesPool: number; noPool: number; yesPercent: number; bets: any[] }) {
  const total = yesPool + noPool;
  return (
    <div className="space-y-3">
      {/* Price bar */}
      <div className="flex h-10 rounded-lg overflow-hidden">
        <div className="bg-green/15 flex items-center justify-center transition-all" style={{ width: `${yesPercent}%` }}>
          <span className="text-green text-[12px] font-bold">{yesPercent}% YES</span>
        </div>
        <div className="bg-red/15 flex items-center justify-center transition-all" style={{ width: `${100 - yesPercent}%` }}>
          <span className="text-red text-[12px] font-bold">{100 - yesPercent}% NO</span>
        </div>
      </div>

      {/* Price chart from trades */}
      <div className="rounded-lg bg-surface-2 border border-border p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-text-3">YES PRICE HISTORY</span>
          <span className={`text-[13px] font-bold font-mono ${yesPercent >= 50 ? "text-green" : "text-red"}`}>
            {(yesPercent / 100).toFixed(2)}
          </span>
        </div>
        <PriceChart bets={bets || []} yesPercent={yesPercent} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-green/5 border border-green/10 rounded-lg p-2.5 text-center">
          <div className="text-[9px] text-text-3">YES POOL</div>
          <div className="text-[14px] font-bold text-green">{yesPool.toFixed(4)}</div>
          <div className="text-[9px] text-text-3">OKB</div>
        </div>
        <div className="bg-red/5 border border-red/10 rounded-lg p-2.5 text-center">
          <div className="text-[9px] text-text-3">NO POOL</div>
          <div className="text-[14px] font-bold text-red">{noPool.toFixed(4)}</div>
          <div className="text-[9px] text-text-3">OKB</div>
        </div>
      </div>

      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between"><span className="text-text-3">Total Volume</span><span className="text-text font-bold">{total.toFixed(4)} OKB</span></div>
        <div className="flex justify-between"><span className="text-text-3">Total Trades</span><span className="text-text font-bold">{(bets || []).length}</span></div>
        <div className="flex justify-between"><span className="text-text-3">YES Price</span><span className="text-green font-mono font-bold">{(yesPercent / 100).toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-text-3">NO Price</span><span className="text-red font-mono font-bold">{((100 - yesPercent) / 100).toFixed(2)}</span></div>
      </div>
    </div>
  );
}

// Chat component with WebSocket + history
function MarketChat({ marketId }: { marketId: number }) {
  const { address } = useWallet();
  const [messages, setMessages] = useState<{ user: string; text: string; time: number }[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Load chat history from DB
  useEffect(() => {
    fetch(`/api/markets/${marketId}/chat`).then(r => r.json()).then(msgs => {
      if (Array.isArray(msgs)) setMessages(msgs);
    }).catch(() => {});
  }, [marketId]);

  useEffect(() => {
    import("socket.io-client").then(({ io }) => {
      const socket = io(window.location.origin.replace(":5173", ":3001"));
      socketRef.current = socket;
      socket.emit("join-market", String(marketId));

      socket.on("market-chat", (msg: { user: string; text: string; time: number; marketId: number }) => {
        if (msg.marketId === marketId) {
          setMessages(prev => [...prev, msg]);
        }
      });

      return () => {
        socket.emit("leave-market", String(marketId));
        socket.disconnect();
      };
    });
  }, [marketId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const msg = {
      user: address ? truncateAddress(address) : "Anon",
      text: input,
      time: Math.floor(Date.now() / 1000),
      marketId,
    };
    // Only add locally, broadcast to others
    setMessages(prev => [...prev, msg]);
    socketRef.current?.emit("market-chat", msg);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[280px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 p-2">
        {messages.length === 0 && <p className="text-[11px] text-text-3 text-center py-8">No messages yet</p>}
        {messages.map((msg, i) => (
          <div key={i} className="text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-light">{msg.user}</span>
              <span className="text-text-3 text-[9px]">{timeAgo(msg.time)}</span>
            </div>
            <p className="text-text-2 mt-0.5">{msg.text}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-border p-2 flex gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Type a message..."
          className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] text-text placeholder:text-text-3 focus:outline-none focus:border-blue/30" />
        <button onClick={send} className="bg-blue text-white rounded-lg px-3 py-2 hover:bg-blue-light transition-colors">
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const [market, setMarket] = useState<MD | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try { setMarket(await getMarket(parseInt(id))); }
      catch {}
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="p-5 animate-pulse space-y-3"><div className="h-6 bg-surface-2 rounded w-1/4" /><div className="h-40 bg-surface rounded-xl border border-border" /></div>;
  if (!market) return <div className="p-5 text-center py-20 text-text-3">Market not found</div>;

  const yes = parseFloat(market.yes_pool) || 0;
  const no = parseFloat(market.no_pool) || 0;
  const total = yes + no;
  const yp = total === 0 ? 50 : Math.round((yes / total) * 100);
  const refresh = async () => { try { setMarket(await getMarket(market.id)); } catch {} };

  return (
    <div className="p-5 space-y-4">
      <Link to="/" className="text-[11px] text-text-3 hover:text-text-2 flex items-center gap-1"><ArrowLeft size={13} />Back</Link>

      {/* Header */}
      <div className="rounded-xl bg-surface border border-border p-5 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[9px] font-bold text-white px-2 py-0.5 rounded ${TB[market.market_type] || "bg-blue/80"}`}>{MARKET_TYPE_LABELS[market.market_type] || market.market_type}</span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${market.status === "OPEN" ? "bg-green/10 text-green" : market.status === "RESOLVED" ? "bg-blue/10 text-blue-light" : "bg-text-3/10 text-text-3"}`}>{market.status}</span>
          {market.status === "RESOLVED" && <span className={`text-[9px] font-bold px-2 py-0.5 rounded text-white ${market.outcome === "YES" ? "bg-green" : "bg-red"}`}>{market.outcome}</span>}
        </div>
        <h1 className="text-[22px] font-bold leading-tight tracking-tight">{market.question}</h1>
        <div className="flex gap-4 text-[11px] text-text-3">
          <span className="flex items-center gap-1"><BarChart2 size={11} />{formatVolume(total)} vol</span>
          <span className="flex items-center gap-1"><Clock size={11} />{formatCountdown(market.deadline)}</span>
          <span className="flex items-center gap-1"><Users size={11} />{(market.bets?.length || 0)} bets</span>
          <span>{truncateAddress(market.creator)}</span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Pool + Market Info */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl bg-surface border border-border p-4">
            <MarketStats yesPool={yes} noPool={no} yesPercent={yp} bets={market.bets || []} />
          </div>

          <div className="rounded-xl bg-surface border border-border p-4 space-y-2">
            <div className="label-sm mb-1">MARKET INFO</div>
            {[
              ["Type", MARKET_TYPE_LABELS[market.market_type] || market.market_type, ""],
              ["Creator Fee", `${market.creator_fee_bps / 100}%`, ""],
              ["Deadline", new Date(market.deadline * 1000).toLocaleString(), "text-text-2"],
              ["Resolution", new Date(market.resolution_time * 1000).toLocaleString(), "text-text-2"],
              ["Chain", "X Layer Testnet", "text-blue-light"],
              ["Model", "Pool-based (winner-takes-all)", "text-text-2"],
            ].map(([l, v, c]) => (
              <div key={l} className="flex justify-between text-[11px]"><span className="text-text-3">{l}</span><span className={c || "text-text"}>{v}</span></div>
            ))}
          </div>
        </div>

        {/* Center: Bet Panel + AI Predictions */}
        <div className="lg:col-span-4 space-y-4">
          <BetPanel marketId={market.chain_market_id || market.id} yesPercent={yp} noPercent={100 - yp} onBetPlaced={refresh} disabled={market.status !== "OPEN"} />

          {market.agentPredictions && market.agentPredictions.length > 0 && (
            <div className="rounded-xl bg-surface border border-border p-4">
              <div className="label-sm mb-3">AI PREDICTIONS</div>
              {market.agentPredictions.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-blue/10 flex items-center justify-center text-[9px] font-bold text-blue-light">AI</div>
                    <div>
                      <p className="text-[12px] font-semibold">{p.agent_name}</p>
                      {p.strategy_type && <StrategyBadge strategy={p.strategy_type} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[12px] font-bold ${p.prediction === "YES" ? "text-green" : "text-red"}`}>{p.prediction}</span>
                    <span className="text-[10px] text-text-3">{p.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Trades + Chat */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl bg-surface border border-border p-4">
            <div className="label-sm mb-2">RECENT TRADES</div>
            {market.bets && market.bets.length > 0 ? market.bets.slice(0, 8).map(b => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${b.side === "YES" ? "bg-green" : "bg-red"}`} />
                  <span className="text-[10px] text-text-3 font-mono">{truncateAddress(b.user_address)}</span>
                </div>
                <span className="text-[10px] font-semibold">{b.amount} OKB <span className={b.side === "YES" ? "text-green" : "text-red"}>{b.side}</span></span>
              </div>
            )) : <p className="text-[11px] text-text-3">No trades yet</p>}
          </div>

          <div className="rounded-xl bg-surface border border-border overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border">
              <div className="label-sm">MARKET CHAT</div>
            </div>
            <MarketChat marketId={market.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
