import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, BarChart2, Bot, ArrowRight } from "lucide-react";
import { getMarkets, getAgents } from "../../lib/api";
import type { Market, Agent } from "../../types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      // Load all data
      getMarkets().then(setMarkets).catch(() => {});
      getAgents().then(setAgents).catch(() => {});
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // CMD+K to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose(); else document.dispatchEvent(new CustomEvent("open-search"));
      }
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();
  const filteredMarkets = q ? markets.filter(m => m.question.toLowerCase().includes(q) || m.market_type.toLowerCase().includes(q)) : [];
  const filteredAgents = q ? agents.filter(a => a.name.toLowerCase().includes(q) || a.strategy_type.toLowerCase().includes(q)) : [];

  const goTo = (path: string) => { nav(path); onClose(); };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Search size={18} className="text-text-3 shrink-0" />
          <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search markets, agents..."
            className="flex-1 bg-transparent text-[15px] text-text placeholder:text-text-3 focus:outline-none" />
          <button onClick={onClose} className="text-text-3 hover:text-text transition-colors"><X size={16} /></button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {/* Markets */}
          {filteredMarkets.length > 0 && (
            <div className="p-3">
              <div className="label-sm px-2 mb-2">MARKETS</div>
              {filteredMarkets.slice(0, 6).map(m => (
                <button key={m.id} onClick={() => goTo(`/markets/${m.id}`)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors text-left">
                  <BarChart2 size={14} className="text-blue-light shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{m.question}</p>
                    <p className="text-[10px] text-text-3">in {m.market_type}</p>
                  </div>
                  <ArrowRight size={12} className="text-text-3" />
                </button>
              ))}
            </div>
          )}

          {/* Agents */}
          {filteredAgents.length > 0 && (
            <div className="p-3 border-t border-border">
              <div className="label-sm px-2 mb-2">AGENTS</div>
              {filteredAgents.slice(0, 4).map(a => (
                <button key={a.id} onClick={() => goTo(`/agents/${a.id}`)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors text-left">
                  <Bot size={14} className="text-purple shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{a.name}</p>
                    <p className="text-[10px] text-text-3">{a.strategy_type} · {a.accuracy}% accuracy</p>
                  </div>
                  <ArrowRight size={12} className="text-text-3" />
                </button>
              ))}
            </div>
          )}

          {query && filteredMarkets.length === 0 && filteredAgents.length === 0 && (
            <div className="p-8 text-center text-text-3 text-[13px]">No results for "{query}"</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-border flex items-center justify-between text-[10px] text-text-3">
          <span>Type to search</span>
          <span className="flex gap-1">
            <kbd className="bg-surface-2 border border-border px-1.5 py-0.5 rounded text-[9px]">ESC</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
