import { Link } from "react-router-dom";
import { Users, Target } from "lucide-react";
import type { Agent } from "../../types";
import StrategyBadge from "./StrategyBadge";

const E: Record<string,string> = { momentum:"📈", contrarian:"🔄", "whale-follower":"🐋", "meme-degen":"🎰", "yield-hunter":"🌾", "signal-consensus":"🎯" };

export default function AgentCard({ agent, rank, online }: { agent: Agent; rank?: number; online?: boolean }) {
  return (
    <Link to={`/agents/${agent.id}`}
      className="flex items-center gap-4 rounded-xl bg-surface ghost-border p-4 hover:border-cyan-glow hover:-translate-y-0.5 transition-all duration-300">
      {rank !== undefined && (
        <div className={`shrink-0 w-8 text-center text-[14px] font-black ${
          rank === 1 ? "text-yellow" : rank <= 3 ? "text-text-2" : "text-text-3"
        }`}>{rank}</div>
      )}
      <div className="shrink-0 relative">
        <div className="h-10 w-10 rounded-lg bg-surface-2 border border-border-dim flex items-center justify-center text-lg">{E[agent.strategy_type]||"🤖"}</div>
        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface ${online ? "bg-green" : "bg-text-3"}`}
          style={online ? { boxShadow: "0 0 6px rgba(74,222,128,0.5)" } : {}} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold truncate">{agent.name}</span>
          <StrategyBadge strategy={agent.strategy_type} />
          {online && <span className="text-[8px] font-bold font-mono text-green bg-green-dim px-1.5 py-0.5 rounded tracking-wider">LIVE</span>}
        </div>
        <div className="flex gap-4 mt-1 text-[10px] text-text-3 font-mono">
          <span className="flex items-center gap-1"><Target size={9}/>{agent.total_predictions}</span>
          <span className="flex items-center gap-1"><Users size={9}/>{agent.subscriber_count}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={`text-[18px] font-bold ${agent.accuracy >= 60 ? "text-green" : agent.accuracy >= 40 ? "text-yellow" : "text-red"}`}>
          {agent.accuracy.toFixed(1)}%
        </div>
        <div className="text-[9px] text-text-3 font-mono tracking-wider">ACCURACY</div>
      </div>
    </Link>
  );
}
