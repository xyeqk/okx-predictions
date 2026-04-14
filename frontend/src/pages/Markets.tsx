import { useEffect, useState } from "react";
import { useStore } from "../store";
import { getMarkets } from "../lib/api";
import { MOCK_MARKETS } from "../lib/mock-data";
import MarketGrid from "../components/market/MarketGrid";
import Filters from "../components/market/Filters";
import { ChevronRight } from "lucide-react";

export default function Markets() {
  const { markets, setMarkets, selectedType, searchQuery } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setMarkets(await getMarkets(selectedType ? { type: selectedType } : undefined)); }
      catch { setMarkets(selectedType ? MOCK_MARKETS.filter(m => m.market_type === selectedType) : MOCK_MARKETS); }
      finally { setLoading(false); }
    })();
  }, [selectedType, setMarkets]);

  const filtered = searchQuery ? markets.filter(m => m.question.toLowerCase().includes(searchQuery.toLowerCase())) : markets;

  return (
    <div className="p-5 space-y-5">
      <div>
        <div className="label-sm mb-1">EXPLORE</div>
        <h1 className="text-[24px] font-bold tracking-tight">All Markets</h1>
      </div>

      <div className="flex gap-5">
        <Filters />
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[13px] text-text-2">Showing <span className="text-text font-semibold">{filtered.length}</span> markets</div>
          </div>
          <MarketGrid markets={filtered} loading={loading} />
        </div>
      </div>
    </div>
  );
}
