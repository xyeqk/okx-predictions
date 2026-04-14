import { useStore } from "../../store";

const cats = [
  { key: null, label: "All" },
  { key: "PRICE", label: "Crypto" },
  { key: "MEME", label: "Meme" },
  { key: "WHALE", label: "Whale" },
  { key: "YIELD", label: "DeFi" },
];

export default function CategoryChips() {
  const { selectedType, setSelectedType } = useStore();

  return (
    <div className="flex items-center gap-1.5 mb-1">
      {cats.map(({ key, label }) => (
        <button key={label} onClick={() => setSelectedType(key)}
          className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all ${
            selectedType === key
              ? "bg-blue text-white"
              : "bg-surface-2 text-text-3 border border-border hover:text-text-2 hover:border-border-2"
          }`}>
          {label}
        </button>
      ))}
    </div>
  );
}
