const S: Record<string, { c: string; l: string }> = {
  momentum: { c: "bg-blue-dim text-blue", l: "MOMENTUM" },
  contrarian: { c: "bg-green-dim text-green", l: "CONTRARIAN" },
  "whale-follower": { c: "bg-purple-dim text-purple", l: "WHALE" },
  "meme-degen": { c: "bg-pink/10 text-pink", l: "MEME" },
  "yield-hunter": { c: "bg-yellow-dim text-yellow", l: "YIELD" },
  "signal-consensus": { c: "bg-cyan-dim text-cyan", l: "SIGNAL" },
};

export default function StrategyBadge({ strategy }: { strategy: string }) {
  const s = S[strategy] || { c: "bg-surface-3 text-text-3", l: strategy.toUpperCase() };
  return <span className={`text-[9px] font-bold font-mono tracking-wider px-2 py-0.5 rounded ${s.c}`}>{s.l}</span>;
}
