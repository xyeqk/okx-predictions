import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Target, Users, TrendingUp, CheckCircle, XCircle, Clock, Wallet, AlertCircle, DollarSign } from "lucide-react";
import { getAgent } from "../lib/api";
import { depositToAgentOnChain } from "../lib/contract";
import { useWallet } from "../hooks/useWallet";
import StrategyBadge from "../components/agent/StrategyBadge";
import type { Agent, AgentPrediction } from "../types";

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const { isConnected, address, connect } = useWallet();
  const [agent, setAgent] = useState<(Agent & { predictions: AgentPrediction[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(() => {
    if (id) return localStorage.getItem(`sub-${id}`) === "1";
    return false;
  });
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depositMsg, setDepositMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try { setAgent(await getAgent(parseInt(id))); }
      catch {}
      finally { setLoading(false); }
    })();
    // Check subscription from localStorage
    setSubscribed(localStorage.getItem(`sub-${id}`) === "1");
  }, [id]);

  if (loading) return <div className="p-5 animate-pulse"><div className="h-40 bg-surface rounded-xl border border-border" /></div>;
  if (!agent) return <div className="p-5 text-center py-20 text-text-3">Agent not found</div>;

  const handleSubscribe = async () => {
    if (!isConnected) { connect(); return; }
    try {
      // Sign message to prove wallet ownership
      const w = window as any;
      const raw = w.okxwallet || w.ethereum;
      if (!raw) throw new Error("No wallet");
      const { BrowserProvider } = await import("ethers");
      const provider = new BrowserProvider(raw);
      const signer = await provider.getSigner();
      const userAddr = await signer.getAddress();
      const message = `Subscribe to agent #${agent.id} on OKX Predictions\nWallet: ${userAddr}\nTimestamp: ${Date.now()}`;
      const signature = await signer.signMessage(message);

      // Send to backend for verification
      const res = await fetch("/api/agents/" + agent.id + "/subscribe-signed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: userAddr, message, signature }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setSubscribed(true);
      localStorage.setItem(`sub-${agent.id}`, "1");
      setAgent({ ...agent, subscriber_count: agent.subscriber_count + 1 });
    } catch (err: any) {
      const msg = err?.reason || err?.message || "Failed";
      if (!msg.includes("rejected") && !msg.includes("denied")) console.error(err);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0 || !isConnected) return;
    setDepositing(true); setDepositMsg(null);
    try {
      // On-chain deposit (wallet popup)
      const result = await depositToAgentOnChain(agent.id, depositAmount);
      setDepositMsg({ type: "ok", text: `Deposited ${depositAmount} OKB — tx: ${result.txHash.slice(0, 18)}...` });
      setDepositAmount("");
    } catch (err: any) {
      const msg = err?.reason || err?.info?.error?.message || err?.message || "Failed";
      setDepositMsg({ type: "err", text: msg.includes("rejected") || msg.includes("denied") ? "Transaction cancelled" : msg });
    }
    setDepositing(false);
  };

  return (
    <div className="p-5 max-w-3xl space-y-4">
      <Link to="/agents" className="text-[11px] text-text-3 hover:text-text-2 flex items-center gap-1"><ArrowLeft size={13} />Back</Link>

      {/* Agent Header */}
      <div className="rounded-xl bg-surface border border-border p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {agent.image ? (
              <img src={agent.image} alt="" className="h-12 w-12 rounded-lg object-cover border border-border" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-blue/10 border border-border flex items-center justify-center text-[18px] font-bold text-blue-light">
                {agent.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-[18px] font-bold">{agent.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <StrategyBadge strategy={agent.strategy_type} />
                {agent.specialization && <span className="text-[9px] font-bold text-text-3 bg-surface-2 px-2 py-0.5 rounded">{agent.specialization}</span>}
              </div>
              {agent.description && <p className="text-[12px] text-text-2 mt-2 max-w-md">{agent.description}</p>}
            </div>
          </div>

          {!subscribed ? (
            <button onClick={handleSubscribe}
              className="rounded-lg bg-blue text-white px-5 py-2.5 text-[12px] font-bold hover:bg-blue-light transition-colors">
              {isConnected ? "Subscribe" : "Login to Subscribe"}
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-green bg-green/10 px-3 py-2 rounded-lg">
              <CheckCircle size={12} /> Subscribed
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-5">
          {[
            { icon: Target, label: "Predictions", value: agent.total_predictions, color: "text-blue-light" },
            { icon: CheckCircle, label: "Correct", value: agent.correct_predictions, color: "text-green" },
            { icon: TrendingUp, label: "Accuracy", value: `${agent.accuracy}%`, color: "text-purple" },
            { icon: Users, label: "Subscribers", value: agent.subscriber_count, color: "text-yellow" },
          ].map(({ icon: I, label, value, color }) => (
            <div key={label} className="rounded-lg bg-surface-2 border border-border p-3 text-center">
              <I size={13} className={`mx-auto ${color} mb-1`} />
              <div className="text-[16px] font-bold">{value}</div>
              <div className="text-[9px] text-text-3">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Deposit Funds */}
      <div className="rounded-xl bg-surface border border-border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign size={14} className="text-blue-light" />
          <div className="label-sm">DEPOSIT FUNDS FOR AGENT</div>
        </div>
        <p className="text-[12px] text-text-2">
          Deposit OKB for this agent to trade on your behalf. The agent uses pooled subscriber funds to place bets on prediction markets.
        </p>

        {subscribed || true ? ( // Show deposit regardless for demo
          <div className="space-y-3">
            <div className="relative">
              <input type="number" step="0.01" min="0" placeholder="0.00" value={depositAmount}
                onChange={e => { setDepositAmount(e.target.value); setDepositMsg(null); }}
                className="w-full rounded-lg bg-surface-2 border border-border px-4 py-3 text-[14px] font-bold text-text placeholder:text-text-3 focus:outline-none focus:border-blue/30" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 text-[10px] font-bold tracking-wider">OKB</span>
            </div>
            <div className="flex gap-2">
              {["0.05", "0.1", "0.5", "1.0"].map(v => (
                <button key={v} onClick={() => setDepositAmount(v)}
                  className="flex-1 rounded bg-surface-2 border border-border py-1.5 text-[10px] text-text-3 hover:text-text-2 transition-all">{v}</button>
              ))}
            </div>

            {depositMsg && (
              <div className={`flex items-center gap-2 rounded-lg p-3 ${depositMsg.type === "ok" ? "bg-green/8 border border-green/20" : "bg-red/8 border border-red/20"}`}>
                {depositMsg.type === "ok" ? <CheckCircle size={13} className="text-green" /> : <AlertCircle size={13} className="text-red" />}
                <p className={`text-[11px] ${depositMsg.type === "ok" ? "text-green" : "text-red"}`}>{depositMsg.text}</p>
              </div>
            )}

            {isConnected ? (
              <button onClick={handleDeposit} disabled={depositing || !depositAmount || parseFloat(depositAmount) <= 0}
                className="w-full rounded-lg bg-blue py-3 text-[13px] font-bold text-white hover:bg-blue-light transition-colors disabled:opacity-30">
                {depositing ? "Processing..." : `Deposit ${depositAmount || "0"} OKB`}
              </button>
            ) : (
              <button onClick={connect}
                className="w-full rounded-lg bg-blue py-3 text-[13px] font-bold text-white flex items-center justify-center gap-2">
                <Wallet size={13} /> Login to Deposit
              </button>
            )}
          </div>
        ) : (
          <p className="text-[12px] text-text-3">Subscribe first to deposit funds</p>
        )}
      </div>

      {/* Prediction History */}
      <div className="rounded-xl bg-surface border border-border p-4">
        <div className="label-sm mb-3">PREDICTION HISTORY</div>
        {agent.predictions?.length ? agent.predictions.map(p => {
          const ok = p.market_status === "RESOLVED" && p.prediction === p.market_outcome;
          const pending = p.market_status !== "RESOLVED";
          return (
            <Link key={p.id} to={`/markets/${p.market_id}`}
              className="flex items-center justify-between py-2.5 px-2 rounded-md hover:bg-surface-2 transition-colors border-b border-border last:border-0">
              <div className="flex-1 min-w-0"><p className="text-[12px] font-medium truncate">{p.question}</p><p className="text-[9px] text-text-3 mt-0.5">{p.market_type}</p></div>
              <div className="flex items-center gap-2 ml-3">
                <span className={`text-[11px] font-bold ${p.prediction === "YES" ? "text-green" : "text-red"}`}>{p.prediction}</span>
                {pending ? <Clock size={11} className="text-text-3" /> : ok ? <CheckCircle size={11} className="text-green" /> : <XCircle size={11} className="text-red" />}
              </div>
            </Link>
          );
        }) : <p className="text-[11px] text-text-3">No predictions yet. Agent will predict when markets are available.</p>}
      </div>
    </div>
  );
}
