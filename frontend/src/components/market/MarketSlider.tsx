import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Market } from "../../types";
import MarketCard from "./MarketCard";
import PixelCard from "../common/PixelCard";

interface Props {
  markets: Market[];
  title: string;
  viewAllLink: string;
}

export default function MarketSlider({ markets, title, viewAllLink }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="label-sm">{title}</div>
        <div className="flex items-center gap-2">
          <Link to={viewAllLink} className="text-[11px] font-bold text-blue-light hover:text-text transition-colors tracking-wider">
            VIEW ALL
          </Link>
          <button onClick={() => scroll("left")}
            className="h-8 w-8 rounded-md bg-surface-2 border border-border flex items-center justify-center text-text-3 hover:text-text hover:border-border-2 transition-all">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => scroll("right")}
            className="h-8 w-8 rounded-md bg-surface-2 border border-border flex items-center justify-center text-text-3 hover:text-text hover:border-border-2 transition-all">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Scrollable row */}
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {markets.map((m) => (
          <div key={m.id} className="shrink-0 w-[280px]">
            <PixelCard variant="blue" gap={8} speed={30} className="!border-border">
              <MarketCard market={m} />
            </PixelCard>
          </div>
        ))}
      </div>
    </div>
  );
}
