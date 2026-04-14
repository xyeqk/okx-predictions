import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { createAgent } from "../lib/api";
import { STRATEGY_TEMPLATES } from "../lib/constants";

export default function CreateAgent() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [strat, setStrat] = useState(STRATEGY_TEMPLATES[0].id);
  const [params, setParams] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tmpl = STRATEGY_TEMPLATES.find(t => t.id === strat)!;
  const val = (k: string, d: number) => params[k] ?? d;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true); setError("");
    try {
      const config: Record<string, number> = {};
      tmpl.params.forEach(p => { config[p.key] = val(p.key, p.default); });
      const r = await createAgent({ name, strategyType: strat, config });
      nav(`/agents/${r.id}`);
    } catch (err: any) { setError(err.response?.data?.error || err.message); } finally { setLoading(false); }
  };

  return (
    <div className="p-5 max-w-lg">
      <Link to="/agents" className="text-[11px] text-text-3 hover:text-text-2 flex items-center gap-1 mb-4"><ArrowLeft size={13}/>Back</Link>
      <div className="rounded-xl bg-surface border border-border p-6 space-y-5">
        <div>
          <div className="label-sm mb-1">DEPLOY</div>
          <h1 className="text-[22px] font-bold tracking-tight">New Agent</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1"><label className="label-sm">NAME</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="My Alpha Agent"
              className="w-full rounded-md bg-surface-2 border border-border px-3.5 py-2.5 text-[12px] text-text placeholder:text-text-3 focus:outline-none focus:border-blue/30" required /></div>
          <div className="space-y-1"><label className="label-sm">STRATEGY</label>
            <div className="grid grid-cols-3 gap-2">
              {STRATEGY_TEMPLATES.map(t => (
                <button key={t.id} type="button" onClick={() => { setStrat(t.id); setParams({}); }}
                  className={`rounded-md bg-surface-2 border p-2.5 text-left transition-all ${strat === t.id ? "border-blue bg-blue-dim" : "border-border opacity-40 hover:opacity-100"}`}>
                  <div className="text-lg mb-0.5">{t.icon}</div><div className="text-[10px] font-bold">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 rounded-md bg-surface-2 border border-border p-3.5">
            <span className="label-sm">PARAMETERS</span>
            {tmpl.params.map(p => (
              <div key={p.key} className="space-y-1">
                <div className="flex justify-between text-[11px]"><span className="text-text-2">{p.label}</span><span className="text-blue-light font-bold">{val(p.key, p.default)}</span></div>
                <input type="range" min={p.min} max={p.max} step={p.step} value={val(p.key, p.default)}
                  onChange={e => setParams({...params, [p.key]: parseFloat(e.target.value)})} className="w-full accent-blue" />
              </div>
            ))}
          </div>
          {error && <div className="flex items-center gap-2 rounded-md bg-red-dim border border-red/20 p-2.5"><AlertCircle size={12} className="text-red"/><p className="text-[11px] text-red">{error}</p></div>}
          <button type="submit" disabled={loading || !name.trim()}
            className="w-full rounded-md bg-blue py-2.5 text-[12px] font-bold text-white hover:bg-blue-light transition-colors disabled:opacity-30">
            {loading ? "Deploying..." : "Deploy Agent"}</button>
        </form>
      </div>
    </div>
  );
}
