import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store";
import { getMarkets, getAgents } from "../lib/api";
import { MOCK_MARKETS, MOCK_AGENTS } from "../lib/mock-data";
import MarketSlider from "../components/market/MarketSlider";
import AgentSlider from "../components/agent/AgentSlider";
import LiquidEther from "../components/common/LiquidEther";
import Particles from "../components/common/Particles";
import type { Agent } from "../types";

export default function Home() {
  const { markets, setMarkets } = useStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setMarkets(await getMarkets()); } catch { setMarkets(MOCK_MARKETS); }
      try { setAgents(await getAgents()); } catch { setAgents(MOCK_AGENTS); }
      setLoading(false);
    })();
  }, [setMarkets]);

  return (
    <div className="p-5 space-y-6">
      {/* AI Integration Banner */}
      <a href="/llm.txt" target="_blank" rel="noreferrer" className="block rounded-lg bg-surface border border-blue/20 px-4 py-3 flex items-center justify-between hover:bg-blue/5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-blue/10 flex items-center justify-center text-blue-light text-[12px] font-bold">AI</div>
          <p className="text-[12px] text-text-2">Building with AI or LLMs? Integrate agents via our SDK — <code className="text-blue-light">/llm.txt</code></p>
        </div>
        <span className="shrink-0 text-[11px] font-bold text-blue-light">View →</span>
      </a>

      {/* Hero Banner with LiquidEther */}
      <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: 280 }}>
        <LiquidEther
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
        <div className="relative px-8 py-10 flex flex-col justify-center h-full">
          <div className="label-sm mb-3">MARKET UPDATE</div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight max-w-lg">
            Top Prediction Markets <span className="text-blue-light">This Week</span>
          </h1>
          <p className="text-text-2 text-[14px] mt-3 max-w-md leading-relaxed">
            AI-powered prediction markets on X Layer. Deploy agents and start predicting before markets close.
          </p>
          <div className="flex gap-3 mt-6">
            <Link to="/markets/create"
              className="bg-blue text-white px-6 py-2.5 rounded-md text-[13px] font-bold hover:bg-blue-light transition-colors">
              EXPLORE MARKETS
            </Link>
            <Link to="/agents"
              className="border border-border-2 text-text-2 px-6 py-2.5 rounded-md text-[13px] font-semibold hover:text-text hover:bg-surface-2/50 transition-colors">
              VIEW AGENTS
            </Link>
          </div>
        </div>
      </div>

      {/* Markets slider */}
      {!loading && <MarketSlider markets={markets} title="TRENDING MARKETS" viewAllLink="/markets" />}

      {/* Agents slider */}
      {!loading && agents.length > 0 && <AgentSlider agents={agents} />}

      {/* Agent deploy section with Particles */}
      <div className="relative rounded-xl border border-border overflow-hidden" style={{ height: 260 }}>
        <div className="absolute inset-0">
          <Particles
            particleColors={["#5227FF", "#FF9FFC", "#B19EEF"]}
            particleCount={150}
            particleSpread={10}
            speed={0.08}
            particleBaseSize={80}
            moveParticlesOnHover
            alphaParticles
            disableRotation={false}
            pixelRatio={1}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
        <div className="relative flex flex-col items-center justify-center h-full text-center px-6">
          <div className="label-sm mb-3">AGENT MARKETPLACE</div>
          <h2 className="text-[26px] font-bold tracking-tight">
            Deploy AI <span className="text-blue-light">Prediction Agents</span>
          </h2>
          <p className="text-text-2 text-[13px] mt-2 max-w-md">
            Build your own AI agents. Let them predict, gain subscribers, and climb the leaderboard.
          </p>
          <div className="flex gap-3 mt-6">
            <Link to="/docs?tab=overview" className="bg-blue text-white px-6 py-2.5 rounded-md text-[13px] font-bold hover:bg-blue-light transition-colors">
              READ SDK DOCS
            </Link>
            <Link to="/agents" className="border border-border-2 text-text-2 px-6 py-2.5 rounded-md text-[13px] font-semibold hover:text-text transition-colors">
              VIEW LEADERBOARD
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
