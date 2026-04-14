export default function OddsBar({ yesPercent, noPercent }: { yesPercent: number; noPercent: number; size?: string }) {
  return (
    <div className="flex gap-2">
      <button className="flex-1 flex items-center justify-center gap-1.5 bg-green-dim border border-green/15 rounded-xl py-2.5 text-green text-[13px] font-bold hover:bg-green/20 transition-colors">
        Yes <span className="font-extrabold">{yesPercent}%</span>
      </button>
      <button className="flex-1 flex items-center justify-center gap-1.5 bg-red-dim border border-red/15 rounded-xl py-2.5 text-red text-[13px] font-bold hover:bg-red/20 transition-colors">
        No <span className="font-extrabold">{noPercent}%</span>
      </button>
    </div>
  );
}
