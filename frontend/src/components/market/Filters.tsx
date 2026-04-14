import { useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { useStore } from "../../store";

export default function Filters() {
  const { selectedType, setSelectedType } = useStore();
  const [search, setSearch] = useState("");
  const [volumeRange, setVolumeRange] = useState(100);
  const [timeframe, setTimeframe] = useState("all");
  const [showStatus, setShowStatus] = useState(true);
  const [showType, setShowType] = useState(true);
  const [statusFilter, setStatusFilter] = useState("OPEN");

  return (
    <div className="w-[220px] shrink-0 space-y-4">
      <div className="rounded-xl bg-surface border border-border p-4 space-y-4">
        <h3 className="text-[15px] font-bold">Filters</h3>

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search markets..."
            className="w-full bg-surface-2 border border-border rounded-md pl-8 pr-3 py-2 text-[11px] text-text placeholder:text-text-3 focus:outline-none focus:border-blue/30" />
        </div>

        {/* Category */}
        <div>
          <button onClick={() => setShowType(!showType)} className="flex items-center justify-between w-full text-[11px] font-semibold text-text-2 mb-2">
            Category {showType ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
          </button>
          {showType && (
            <div className="space-y-1">
              {[
                { key: null, label: "All Markets" },
                { key: "SPORTS", label: "Sports" },
                { key: "CRYPTO", label: "Crypto" },
                { key: "POLITICAL", label: "Political" },
                { key: "ENTERTAINMENT", label: "Entertainment" },
                { key: "OTHER", label: "Other" },
              ].map(({ key, label }) => (
                <label key={label} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-surface-2 cursor-pointer transition-colors">
                  <input type="radio" name="type" checked={selectedType === key}
                    onChange={() => setSelectedType(key)}
                    className="accent-blue h-3 w-3" />
                  <span className={`text-[11px] ${selectedType === key ? "text-text font-medium" : "text-text-2"}`}>{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <button onClick={() => setShowStatus(!showStatus)} className="flex items-center justify-between w-full text-[11px] font-semibold text-text-2 mb-2">
            Status {showStatus ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
          </button>
          {showStatus && (
            <div className="space-y-1">
              {["OPEN", "RESOLVED"].map(s => (
                <label key={s} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-surface-2 cursor-pointer transition-colors">
                  <input type="radio" name="status" checked={statusFilter === s}
                    onChange={() => setStatusFilter(s)}
                    className="accent-blue h-3 w-3" />
                  <span className={`text-[11px] ${statusFilter === s ? "text-text font-medium" : "text-text-2"}`}>{s}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Timeframe */}
        <div>
          <div className="text-[11px] font-semibold text-text-2 mb-2">Timeframe</div>
          <div className="grid grid-cols-3 gap-1">
            {[
              { key: "all", label: "All" },
              { key: "24h", label: "24h" },
              { key: "7d", label: "7d" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTimeframe(key)}
                className={`rounded-md py-1.5 text-[10px] font-semibold transition-all ${
                  timeframe === key ? "bg-blue text-white" : "bg-surface-2 text-text-3 border border-border hover:text-text-2"
                }`}>{label}</button>
            ))}
          </div>
        </div>

        {/* Volume range */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-semibold text-text-2">Min Volume</span>
            <span className="text-blue font-bold">${volumeRange}</span>
          </div>
          <input type="range" min={0} max={1000} step={10} value={volumeRange}
            onChange={(e) => setVolumeRange(parseInt(e.target.value))}
            className="w-full accent-blue" />
          <div className="flex justify-between text-[9px] text-text-3 mt-0.5">
            <span>$0</span><span>$1,000</span>
          </div>
        </div>
      </div>

      {/* Stats card */}
      <div className="rounded-xl bg-surface border border-border p-4 space-y-2.5">
        <div className="label-sm mb-1">MARKET STATS</div>
        {[
          ["Open Markets", "4", "text-green"],
          ["Resolved", "0", "text-text-2"],
          ["Total Volume", "$0.05", "text-blue"],
        ].map(([label, value, color]) => (
          <div key={label} className="flex justify-between text-[11px]">
            <span className="text-text-3">{label}</span>
            <span className={`font-semibold ${color}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
