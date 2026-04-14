import { Link } from "react-router-dom";
import { BarChart2 } from "lucide-react";
import type { Market } from "../../types";
import { MARKET_TYPE_LABELS } from "../../lib/constants";
import { formatVolume, formatCountdown } from "../../lib/format";

const TYPE_BAR: Record<string, string> = { SPORTS: "bg-green", CRYPTO: "bg-blue", POLITICAL: "bg-purple", ENTERTAINMENT: "bg-pink", OTHER: "bg-yellow" };
const TYPE_BADGE: Record<string, string> = { SPORTS: "bg-green/80", CRYPTO: "bg-blue/80", POLITICAL: "bg-purple/80", ENTERTAINMENT: "bg-pink/80", OTHER: "bg-yellow/80" };

export default function MarketCard({ market }: { market: Market }) {
  const yes = parseFloat(market.yes_pool) || 0, no = parseFloat(market.no_pool) || 0;
  const total = yes + no;
  const yp = total === 0 ? 50 : Math.round((yes / total) * 100);
  const np = 100 - yp;

  return (
    <Link to={`/markets/${market.id}`} className="block p-5 space-y-4 bg-surface rounded-xl h-full">
      {/* Top row: badge + countdown */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold text-white px-2.5 py-1 rounded-md ${TYPE_BADGE[market.market_type]}`}>
          {MARKET_TYPE_LABELS[market.market_type]}
        </span>
        <span className="text-[10px] font-semibold text-text-3 bg-surface-2 px-2 py-0.5 rounded">
          {formatCountdown(market.deadline)}
        </span>
      </div>

      {/* Question */}
      <h3 className="text-[15px] font-bold leading-snug text-text min-h-[44px]">
        {market.question}
      </h3>

      {/* Resolved badge */}
      {market.status === "RESOLVED" && (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded text-white ${market.outcome === "YES" ? "bg-green" : "bg-red"}`}>
          Resolved: {market.outcome}
        </span>
      )}

      {/* Volume */}
      <div className="flex items-center gap-1.5 text-text-3 text-[11px]">
        <BarChart2 size={11} />{formatVolume(total)} vol
      </div>

      {/* Odds */}
      <div className="flex items-center justify-between text-[13px] font-bold">
        <span className="text-green">{yp}% Yes</span>
        <span className="text-red">{np}% No</span>
      </div>

      {/* Bottom bar */}
      <div className="flex h-[4px] rounded-full overflow-hidden bg-surface-3">
        <div className={`${TYPE_BAR[market.market_type]} rounded-full transition-all duration-500`} style={{ width: `${yp}%` }} />
      </div>
    </Link>
  );
}
