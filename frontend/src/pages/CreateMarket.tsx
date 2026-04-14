import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, AlertCircle, HelpCircle } from "lucide-react";
import { createMarketOnChain } from "../lib/contract";
import { createMarket as createMarketApi } from "../lib/api";
import { useWallet } from "../hooks/useWallet";
import type { MarketType } from "../types";

const TYPES: { key: MarketType; label: string; desc: string }[] = [
  { key: "SPORTS" as MarketType, label: "Sports", desc: "Sports events & matches" },
  { key: "CRYPTO" as MarketType, label: "Crypto", desc: "Token prices & crypto events" },
  { key: "POLITICAL" as MarketType, label: "Political", desc: "Elections & policy" },
  { key: "ENTERTAINMENT" as MarketType, label: "Entertainment", desc: "Movies, music, culture" },
  { key: "OTHER" as MarketType, label: "Other", desc: "Anything else" },
];
const TYPE_MAP: Record<string, number> = { SPORTS: 0, CRYPTO: 1, POLITICAL: 2, ENTERTAINMENT: 3, OTHER: 4 };

export default function CreateMarket() {
  const nav = useNavigate();
  const { isConnected, address, connect } = useWallet();
  const [type, setType] = useState<MarketType>("CRYPTO" as MarketType);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("24");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !isConnected) return;
    setLoading(true); setError("");
    try {
      const now = Math.floor(Date.now() / 1000);
      const dl = now + parseInt(duration) * 3600;
      const res = dl + 3600;
      const meta = { description, category: type };

      // User signs on-chain via their connected wallet
      await createMarketOnChain(TYPE_MAP[type], question, JSON.stringify(meta), dl, res, 100);

      // Also save to backend DB
      try {
        await createMarketApi({
          marketType: type, question, metadata: meta,
          deadline: dl * 1000, resolutionTime: res * 1000,
          creatorFeeBps: 100, category: type, creator: address || "",
        });
      } catch {}
      nav("/");
    } catch (err: any) {
      const msg = err?.info?.error?.message || err?.reason || err?.message || "Failed";
      setError(msg.includes("rejected") || msg.includes("denied") ? "Transaction cancelled" : msg);
    }
    setLoading(false);
  };

  const inp = "w-full rounded-lg bg-surface-2 border border-border px-4 py-3 text-[13px] text-text placeholder:text-text-3 focus:outline-none focus:border-blue/30";

  return (
    <div className="p-5 max-w-xl">
      <Link to="/" className="text-[11px] text-text-3 hover:text-text-2 flex items-center gap-1 mb-4">
        <ArrowLeft size={13}/>Back
      </Link>

      <div className="rounded-xl bg-surface border border-border p-6 space-y-6">
        <div>
          <div className="label-sm mb-1">CREATE</div>
          <h1 className="text-[24px] font-bold tracking-tight">New Prediction Market</h1>
          <p className="text-[13px] text-text-3 mt-1">Create a YES/NO question that will be resolved after the deadline.</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* Category */}
          <div className="space-y-2">
            <label className="label-sm">CATEGORY</label>
            <div className="grid grid-cols-5 gap-2">
              {TYPES.map(t => (
                <button key={t.key} type="button" onClick={() => setType(t.key)}
                  className={`rounded-lg bg-surface-2 border p-3 text-center transition-all ${
                    type === t.key ? "border-blue bg-blue/8 ring-1 ring-blue/20" : "border-border opacity-50 hover:opacity-100"
                  }`}>
                  <div className="text-[13px] font-bold">{t.label}</div>
                  <div className="text-[9px] text-text-3 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question */}
          <div className="space-y-2">
            <label className="label-sm">QUESTION</label>
            <input type="text" value={question} onChange={e => setQuestion(e.target.value)}
              placeholder="Will OKB reach $1.5 by end of week?"
              className={inp} required />
            <p className="text-[10px] text-text-3 flex items-center gap-1">
              <HelpCircle size={10}/> Must be a YES or NO question. This will be shown to all users.
            </p>
          </div>

          {/* Description (optional) */}
          <div className="space-y-2">
            <label className="label-sm">DESCRIPTION <span className="text-text-3 normal-case">(optional)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Add context, resolution criteria, or data sources..."
              rows={3}
              className={`${inp} resize-none`} />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="label-sm">BETTING DURATION</label>
            <div className="flex gap-2">
              {[
                { v: "1", l: "1 hour" },
                { v: "6", l: "6 hours" },
                { v: "12", l: "12 hours" },
                { v: "24", l: "1 day" },
                { v: "48", l: "2 days" },
                { v: "72", l: "3 days" },
              ].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => setDuration(v)}
                  className={`flex-1 rounded-lg py-2.5 text-[12px] font-semibold border transition-all ${
                    duration === v ? "bg-blue/10 text-blue-light border-blue/30" : "bg-surface-2 border-border text-text-3 hover:text-text-2"
                  }`}>{l}</button>
              ))}
            </div>
            <p className="text-[10px] text-text-3">
              Market resolves 1 hour after betting closes. Resolution is done by the platform resolver.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red/8 border border-red/20 p-3">
              <AlertCircle size={13} className="text-red shrink-0"/>
              <p className="text-[12px] text-red">{error}</p>
            </div>
          )}

          {isConnected ? (
            <button type="submit" disabled={loading || !question.trim()}
              className="w-full rounded-lg bg-blue py-3 text-[14px] font-bold text-white hover:bg-blue-light transition-colors disabled:opacity-30">
              {loading ? "Confirm in wallet..." : "Create Market"}
            </button>
          ) : (
            <button type="button" onClick={connect}
              className="w-full rounded-lg bg-blue py-3 text-[14px] font-bold text-white hover:bg-blue-light transition-colors">
              Login to Create Market
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
