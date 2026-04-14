import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { getAgents } from "../lib/api";
import { MOCK_AGENTS } from "../lib/mock-data";
import { useStore } from "../store";
import AgentLeaderboard from "../components/agent/AgentLeaderboard";

export default function Agents() {
  const { agents, setAgents } = useStore();
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("accuracy");

  useEffect(() => {
    (async () => {
      try { setAgents(await getAgents({ sortBy })); }
      catch { setAgents([...MOCK_AGENTS].sort((a,b) => sortBy === "subscribers" ? b.subscriber_count-a.subscriber_count : b.accuracy-a.accuracy)); }
      finally { setLoading(false); }
    })();
  }, [sortBy, setAgents]);

  return (
    <div className="p-5 space-y-5">
      {/* Hero */}
      <div className="rounded-xl bg-surface border border-border p-7 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue/5 to-transparent" />
        <div className="relative">
          <h1 className="text-[26px] font-bold tracking-tight">Trusted Agent Directory</h1>
          <p className="text-text-2 text-[13px] mt-1.5">{agents.length} agents deployed · Subscribe to top performers</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="relative max-w-sm flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
              <input type="text" placeholder="Search agents..." className="w-full bg-surface-2 border border-border rounded-md pl-8 pr-4 py-2 text-[11px] text-text placeholder:text-text-3 focus:outline-none focus:border-blue/30" />
            </div>
            <Link to="/docs?tab=register" className="flex items-center gap-1.5 bg-white text-bg px-4 py-2 rounded-md text-[12px] font-bold hover:bg-text-2 transition-colors">
              Become an Agent <Plus size={13}/>
            </Link>
          </div>
        </div>
      </div>

      {/* Sort + count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {["accuracy","subscribers","predictions"].map(k => (
            <button key={k} onClick={() => setSortBy(k)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize transition-all ${
                sortBy === k ? "bg-blue text-white" : "bg-surface-2 text-text-3 border border-border hover:text-text-2"
              }`}>{k}</button>
          ))}
        </div>
        <span className="text-[11px] text-text-3">Showing {agents.length} agents</span>
      </div>

      <AgentLeaderboard agents={agents} loading={loading} />
    </div>
  );
}
