import type { Agent } from "../../types";
import AgentCard from "./AgentCard";

export default function AgentLeaderboard({ agents, loading }: { agents: Agent[]; loading?: boolean }) {
  if (loading) return <div className="space-y-2">{Array.from({length:5}).map((_,i) => <div key={i} className="rounded-xl bg-surface ghost-border h-[68px] animate-pulse"/>)}</div>;
  if (!agents.length) return <div className="text-center py-16 rounded-xl bg-surface ghost-border"><p className="text-4xl mb-2 opacity-20">🤖</p><p className="text-text-3 text-[13px]">No agents deployed yet</p></div>;
  return <div className="space-y-2">{agents.map((a,i) => <AgentCard key={a.id} agent={a} rank={i+1}/>)}</div>;
}
