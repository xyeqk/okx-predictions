import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Bot, Briefcase, Plus, BookOpen, ChevronRight, Copy, Check, Map } from "lucide-react";
import { getAgents } from "../../lib/api";
import type { Agent } from "../../types";
import { useWallet } from "../../hooks/useWallet";
import TrueFocus from "../common/TrueFocus";
import PixelBlast from "../common/PixelBlast";

const nav = [
  { path: "/", label: "Discover", icon: LayoutGrid },
  { path: "/markets", label: "Markets", icon: LayoutGrid },
  { path: "/agents", label: "Agents", icon: Bot },
  { path: "/portfolio", label: "Portfolio", icon: Briefcase },
  { path: "/roadmap", label: "Roadmap", icon: Map },
];

function WalletCard({ address, balance, onDisconnect }: { address: string | null; balance: string; onDisconnect: () => void }) {
  const [copied, setCopied] = useState(false);
  const display = address && address.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address || "Unknown";

  const copy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-surface-2 rounded-lg p-3.5 border border-border">
      <div className="flex items-center gap-1.5 mb-2">
        <div className="h-2 w-2 rounded-full bg-green" />
        <span className="text-[11px] font-semibold text-green">Connected</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[12px] font-mono text-text-2 truncate flex-1">{display}</span>
        <button onClick={copy} className="shrink-0 text-text-3 hover:text-blue transition-colors" title="Copy address">
          {copied ? <Check size={12} className="text-green" /> : <Copy size={12} />}
        </button>
      </div>
      <div className="text-[14px] font-bold text-text">{balance}</div>
      <button onClick={onDisconnect} className="mt-2 text-[11px] text-text-3 hover:text-red transition-colors">Disconnect</button>
    </div>
  );
}

export default function Sidebar() {
  const loc = useLocation();
  const { address, balance, isConnected, connect, disconnect } = useWallet();
  const [agents, setAgentsData] = useState<Agent[]>([]);

  useEffect(() => {
    getAgents().then(setAgentsData).catch(() => {});
    const interval = setInterval(() => { getAgents().then(setAgentsData).catch(() => {}); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const topAgent = agents[0];

  return (
      <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-surface border-r border-border flex flex-col z-40">
        {/* Logo */}
        <div className="px-6 pt-8 pb-6">
          <TrueFocus
            sentence="OKX Predictions"
            manualMode={false}
            blurAmount={5}
            borderColor="#2563eb"
            glowColor="rgba(37, 99, 235, 0.6)"
            animationDuration={0.5}
            pauseBetweenAnimations={1.5}
            className="text-[22px] font-extrabold tracking-tight"
          />
        </div>

        {/* Nav */}
        <div className="px-3 space-y-1">
          <div className="label-sm px-3 mb-2">BROWSE</div>
          {nav.map(({ path, label, icon: Icon }) => {
            const active = loc.pathname === path || (path === "/agents" && loc.pathname.startsWith("/agents"));
            return (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-semibold transition-all relative overflow-hidden ${
                  active
                    ? "text-text border border-blue/30 bg-blue/5"
                    : "text-text-2 hover:text-text hover:bg-surface-2/50 border border-transparent"
                }`}>
                {active && (
                  <div className="absolute inset-0 pointer-events-none">
                    <PixelBlast color="#2563eb" pixelSize={3} speed={0.2} edgeFade={0.1} />
                  </div>
                )}
                <Icon size={17} strokeWidth={1.5} className={`relative z-10 ${active ? "text-blue-light" : ""}`} />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Agent card — dynamic */}
        {topAgent && (
          <Link to={`/agents/${topAgent.id}`} className="block px-3 mt-6">
            <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: 140 }}>
              <div className="absolute inset-0">
                <PixelBlast color="#2563eb" pixelSize={4} speed={0.3} edgeFade={0.15} />
              </div>
              <div className="relative p-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="h-2 w-2 rounded-full bg-green" />
                    <span className="text-[10px] font-bold text-green tracking-wider">TOP AGENT</span>
                  </div>
                  <div className="text-[16px] font-bold tracking-tight">{topAgent.name}</div>
                  <div className="text-[11px] text-text-2 mt-0.5">{topAgent.accuracy}% accuracy · {topAgent.total_predictions} predictions</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-3">{agents.length} agent{agents.length !== 1 ? "s" : ""} deployed</span>
                  <span className="text-[10px] text-text-3">{topAgent.subscriber_count} subs</span>
                </div>
              </div>
            </div>
          </Link>
        )}
        {!topAgent && (
          <div className="px-3 mt-6">
            <div className="rounded-xl bg-surface-2 border border-border p-4 text-center">
              <p className="text-[11px] text-text-3">No agents yet</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-3 mt-6 flex-1">
          <div className="label-sm px-3 mb-2">QUICK ACTIONS</div>
          <Link to="/markets/create" className="flex items-center justify-between px-4 py-2.5 rounded-lg text-[13px] text-text-2 hover:text-text hover:bg-surface-2/50 transition-all">
            <span className="flex items-center gap-2.5"><Plus size={14}/>Create Market</span>
            <ChevronRight size={13} className="text-text-3" />
          </Link>
          <Link to="/docs" className="flex items-center justify-between px-4 py-2.5 rounded-lg text-[13px] text-text-2 hover:text-text hover:bg-surface-2/50 transition-all">
            <span className="flex items-center gap-2.5"><BookOpen size={14}/>Docs</span>
            <ChevronRight size={13} className="text-text-3" />
          </Link>
        </div>

        {/* Wallet */}
        <div className="p-3 border-t border-border">
          {isConnected ? (
            <WalletCard address={address} balance={balance} onDisconnect={disconnect} />
          ) : (
            <button onClick={connect}
              className="w-full rounded-lg bg-blue px-4 py-3 text-[13px] font-bold text-white hover:bg-blue-light transition-colors">
              Connect Wallet
            </button>
          )}
        </div>
      </aside>
  );
}
