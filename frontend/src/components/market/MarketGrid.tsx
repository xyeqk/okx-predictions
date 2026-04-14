import type { Market } from "../../types";
import MarketCard from "./MarketCard";
import PixelCard from "../common/PixelCard";

export default function MarketGrid({ markets, loading }: { markets: Market[]; loading?: boolean }) {
  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-surface border border-border overflow-hidden animate-pulse">
          <div className="h-[150px] bg-surface-2" />
          <div className="p-3.5 space-y-3"><div className="h-4 bg-surface-2 rounded w-4/5" /><div className="h-3 bg-surface-2 rounded w-2/5" /><div className="h-[3px] bg-surface-2 rounded-full" /></div>
        </div>
      ))}
    </div>
  );

  if (!markets.length) return (
    <div className="text-center py-20 rounded-xl bg-surface border border-border">
      <div className="text-4xl mb-3 opacity-20">📊</div>
      <p className="text-text-2 font-semibold text-[14px]">No markets found</p>
      <p className="text-text-3 text-[12px] mt-1">Create the first prediction market</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {markets.map((m) => (
        <PixelCard key={m.id} variant="blue" gap={8} speed={30} className="!border-border">
          <MarketCard market={m} />
        </PixelCard>
      ))}
    </div>
  );
}
