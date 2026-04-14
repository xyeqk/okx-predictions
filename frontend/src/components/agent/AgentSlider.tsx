import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Target, Users, TrendingUp } from "lucide-react";
import type { Agent } from "../../types";
import StrategyBadge from "./StrategyBadge";
import PixelCard from "../common/PixelCard";

const E: Record<string,string> = { momentum:"📈", contrarian:"🔄", "whale-follower":"🐋", "meme-degen":"🎰", "yield-hunter":"🌾", "signal-consensus":"🎯" };

export default function AgentSlider({ agents }: { agents: Agent[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left"|"right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="label-sm">TOP AGENTS</div>
        <div className="flex items-center gap-2">
          <Link to="/agents" className="text-[11px] font-bold text-blue-light hover:text-text transition-colors tracking-wider">VIEW ALL</Link>
          <button onClick={() => scroll("left")} className="h-8 w-8 rounded-md bg-surface-2 border border-border flex items-center justify-center text-text-3 hover:text-text hover:border-border-2 transition-all"><ChevronLeft size={14}/></button>
          <button onClick={() => scroll("right")} className="h-8 w-8 rounded-md bg-surface-2 border border-border flex items-center justify-center text-text-3 hover:text-text hover:border-border-2 transition-all"><ChevronRight size={14}/></button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {agents.map((agent, i) => (
          <div key={agent.id} className="shrink-0 w-[260px]">
            <PixelCard variant="blue" gap={10} speed={25} className="!border-border">
              <Link to={`/agents/${agent.id}`} className="block p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-lg">{E[agent.strategy_type]||"🤖"}</div>
                    <div>
                      <div className="text-[14px] font-bold">{agent.name}</div>
                      <StrategyBadge strategy={agent.strategy_type} />
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-text-3">#{i+1}</div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface-2 rounded-md p-2 text-center">
                    <Target size={11} className="mx-auto text-blue-light mb-1" />
                    <div className="text-[14px] font-bold">{agent.total_predictions}</div>
                    <div className="text-[9px] text-text-3">Predictions</div>
                  </div>
                  <div className="bg-surface-2 rounded-md p-2 text-center">
                    <TrendingUp size={11} className="mx-auto text-green mb-1" />
                    <div className="text-[14px] font-bold text-green">{agent.accuracy.toFixed(0)}%</div>
                    <div className="text-[9px] text-text-3">Accuracy</div>
                  </div>
                  <div className="bg-surface-2 rounded-md p-2 text-center">
                    <Users size={11} className="mx-auto text-purple mb-1" />
                    <div className="text-[14px] font-bold">{agent.subscriber_count}</div>
                    <div className="text-[9px] text-text-3">Subs</div>
                  </div>
                </div>
              </Link>
            </PixelCard>
          </div>
        ))}
      </div>
    </div>
  );
}
