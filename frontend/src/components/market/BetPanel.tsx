import { useState } from "react";
import { useWallet } from "../../hooks/useWallet";
import { Wallet, CheckCircle, AlertCircle } from "lucide-react";
import { placeBetOnChain } from "../../lib/contract";
import { recordBet } from "../../lib/api";

interface Props { marketId: number; yesPercent: number; noPercent: number; onBetPlaced?: () => void; disabled?: boolean; }

export default function BetPanel({ marketId, yesPercent, noPercent, onBetPlaced, disabled }: Props) {
  const { isConnected, connect } = useWallet();
  const [side, setSide] = useState<"YES"|"NO"|null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);

  const handleBet = async () => {
    if (!side || !amount || parseFloat(amount) <= 0) return;
    setLoading(true); setError(null); setTxHash(null);
    try {
      const result = await placeBetOnChain(marketId, side, amount);
      setTxHash(result.txHash);
      // Get user address from the receipt
      const userAddr = result.receipt?.from || address || "unknown";
      console.log("[BetPanel] Recording bet:", { marketId, side, amount, userAddr, txHash: result.txHash });
      // Record in backend DB so it shows in UI
      await recordBet(marketId, { side, amount, userAddress: userAddr, txHash: result.txHash });
      setAmount(""); setSide(null);
      // Small delay to let backend process
      setTimeout(() => onBetPlaced?.(), 500);
    } catch (err: any) {
      const msg = err?.info?.error?.message || err?.reason || err?.message || "Transaction failed";
      setError(msg.includes("rejected") || msg.includes("denied") || msg.includes("cancel") ? "Transaction cancelled" : msg);
    }
    setLoading(false);
  };

  const payout = () => {
    if (!side || !amount) return "0.00";
    const a = parseFloat(amount) || 0, w = side === "YES" ? yesPercent : noPercent;
    return w === 0 ? (a*2).toFixed(4) : (a*(100/w)).toFixed(4);
  };

  return (
    <div className="rounded-xl bg-surface border border-border p-5 space-y-4">
      <div className="label-sm">BUY SHARES</div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => { setSide("YES"); setTxHash(null); setError(null); }} disabled={disabled}
          className={`rounded-lg py-3 text-[13px] font-bold transition-all ${
            side === "YES" ? "bg-green text-bg" : "bg-green/10 text-green border border-green/10 hover:bg-green/20"
          } disabled:opacity-30`}>YES {yesPercent}%</button>
        <button onClick={() => { setSide("NO"); setTxHash(null); setError(null); }} disabled={disabled}
          className={`rounded-lg py-3 text-[13px] font-bold transition-all ${
            side === "NO" ? "bg-red text-bg" : "bg-red/10 text-red border border-red/10 hover:bg-red/20"
          } disabled:opacity-30`}>NO {noPercent}%</button>
      </div>

      {side && (
        <div className="space-y-3">
          <div className="relative">
            <input type="number" step="0.001" min="0" placeholder="0.00" value={amount}
              onChange={e => { setAmount(e.target.value); setError(null); }}
              className="w-full rounded-lg bg-surface-2 border border-border px-4 py-3 text-[16px] font-bold text-text placeholder:text-text-3 focus:outline-none focus:border-blue/30" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 text-[10px] font-bold tracking-wider">OKB</span>
          </div>
          <div className="flex gap-1.5">
            {["0.01","0.05","0.1","0.5"].map(v => (
              <button key={v} onClick={() => setAmount(v)}
                className="flex-1 rounded bg-surface-2 border border-border py-1.5 text-[10px] text-text-3 hover:text-text-2 hover:border-border-2 transition-all">{v}</button>
            ))}
          </div>
          <div className="flex justify-between text-[12px]"><span className="text-text-3">Payout</span><span className="text-blue-light font-bold">{payout()} OKB</span></div>

          {txHash && (
            <div className="flex items-center gap-2 bg-green/8 border border-green/20 rounded-lg p-3">
              <CheckCircle size={14} className="text-green shrink-0"/>
              <div className="min-w-0"><p className="text-[11px] font-bold text-green">Bet placed!</p><p className="text-[10px] text-text-3 font-mono truncate">{txHash}</p></div>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red/8 border border-red/20 rounded-lg p-3">
              <AlertCircle size={14} className="text-red shrink-0"/><p className="text-[11px] text-red">{error}</p>
            </div>
          )}

          {isConnected ? (
            <button onClick={handleBet} disabled={loading || !amount || parseFloat(amount) <= 0}
              className={`w-full rounded-lg py-3 text-[12px] font-bold tracking-wider transition-all disabled:opacity-30 ${
                side === "YES" ? "bg-green text-bg" : "bg-red text-white"
              }`}>{loading ? "CONFIRM IN WALLET..." : `BET ${side}`}</button>
          ) : (
            <button onClick={connect}
              className="w-full rounded-lg bg-blue py-3 text-[12px] font-bold text-white flex items-center justify-center gap-2">
              <Wallet size={13}/> CONNECT WALLET TO BET
            </button>
          )}
        </div>
      )}
    </div>
  );
}
