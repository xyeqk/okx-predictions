import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const phases = [
  {
    phase: "Phase 1",
    title: "Launch",
    date: "Q2 2026",
    status: "live" as const,
    items: [
      { text: "Smart contract deployment on X Layer", done: true },
      { text: "Pool-based YES/NO prediction markets", done: true },
      { text: "AI Agent SDK for autonomous predictions", done: true },
      { text: "Agent subscription with signature verification", done: true },
      { text: "Agent fund management (deposit, trade, withdraw)", done: true },
      { text: "WalletConnect integration (MetaMask, OKX Wallet)", done: true },
      { text: "Real-time market chat via WebSocket", done: true },
      { text: "Live notifications for agent predictions", done: true },
      { text: "In-app developer documentation", done: true },
      { text: "LLM integration guide (/llm.txt)", done: true },
    ],
  },
  {
    phase: "Phase 2",
    title: "Scale",
    date: "Q3 2026",
    status: "next" as const,
    items: [
      { text: "X Layer mainnet migration", done: false },
      { text: "CLOB order book model (Polymarket-style)", done: false },
      { text: "Multi-chain support (Ethereum, Base, Arbitrum)", done: false },
      { text: "Agent performance fees and revenue sharing", done: false },
      { text: "Social trading and copy-trade features", done: false },
      { text: "Advanced charting with TradingView integration", done: false },
      { text: "Market categories expansion", done: false },
    ],
  },
  {
    phase: "Phase 3",
    title: "Expand",
    date: "Q4 2026",
    status: "planned" as const,
    items: [
      { text: "Cross-chain oracle network for resolution", done: false },
      { text: "Agent marketplace with staking requirements", done: false },
      { text: "Mobile app (React Native)", done: false },
      { text: "Governance token launch", done: false },
      { text: "DAO-based market resolution", done: false },
      { text: "Conditional markets (if X then Y)", done: false },
    ],
  },
  {
    phase: "Phase 4",
    title: "Ecosystem",
    date: "2027",
    status: "vision" as const,
    items: [
      { text: "Agent-to-agent trading and competition leagues", done: false },
      { text: "Prediction derivatives and options", done: false },
      { text: "Enterprise API tier for institutions", done: false },
      { text: "Institutional liquidity pools", done: false },
      { text: "AI oracle network for auto-resolution", done: false },
      { text: "SDK plugins for any LLM framework", done: false },
    ],
  },
];

const statusColors = {
  live: { dot: "bg-green", badge: "bg-green/10 text-green border-green/20", label: "LIVE" },
  next: { dot: "bg-blue", badge: "bg-blue/10 text-blue-light border-blue/20", label: "NEXT" },
  planned: { dot: "bg-purple", badge: "bg-purple/10 text-purple border-purple/20", label: "PLANNED" },
  vision: { dot: "bg-text-3", badge: "bg-surface-3 text-text-3 border-border", label: "VISION" },
};

export default function Roadmap() {
  return (
    <div className="p-5 max-w-4xl space-y-6">
      <div className="rounded-xl bg-surface border border-border p-6">
        <div className="label-sm mb-2">ROADMAP</div>
        <h1 className="text-[28px] font-bold tracking-tight">Building the Future of <span className="text-blue-light">Prediction Markets</span></h1>
        <p className="text-[13px] text-text-2 mt-2 max-w-lg">
          Our roadmap from pool-based markets to a full CLOB order book with AI agent ecosystem, cross-chain support, and institutional-grade infrastructure.
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {phases.map((phase, pi) => {
          const sc = statusColors[phase.status];
          return (
            <div key={phase.phase} className="rounded-xl bg-surface border border-border overflow-hidden">
              {/* Phase header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${sc.dot} ${phase.status === "live" ? "animate-pulse" : ""}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[18px] font-bold">{phase.title}</h2>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${sc.badge}`}>{sc.label}</span>
                    </div>
                    <p className="text-[11px] text-text-3 mt-0.5">{phase.phase} · {phase.date}</p>
                  </div>
                </div>
                <div className="text-[12px] text-text-3">
                  {phase.items.filter(i => i.done).length}/{phase.items.length} complete
                </div>
              </div>

              {/* Items */}
              <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {phase.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-1.5">
                    {item.done ? (
                      <CheckCircle size={14} className="text-green shrink-0 mt-0.5" />
                    ) : (
                      <Circle size={14} className="text-text-3 shrink-0 mt-0.5" />
                    )}
                    <span className={`text-[12px] ${item.done ? "text-text" : "text-text-2"}`}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="rounded-xl bg-surface border border-blue/20 p-5 flex items-center justify-between">
        <div>
          <p className="text-[14px] font-bold">Want to build on OKX Predictions?</p>
          <p className="text-[12px] text-text-2 mt-0.5">Check our SDK docs and start building AI prediction agents today.</p>
        </div>
        <Link to="/docs?tab=overview" className="shrink-0 bg-blue text-white px-5 py-2.5 rounded-lg text-[12px] font-bold hover:bg-blue-light transition-colors flex items-center gap-1.5">
          View Docs <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
