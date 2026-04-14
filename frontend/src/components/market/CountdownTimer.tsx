import { useEffect, useState } from "react";
import { formatCountdown } from "../../lib/format";

export default function CountdownTimer({ deadline }: { deadline: number }) {
  const [text, setText] = useState(formatCountdown(deadline));
  useEffect(() => { const i = setInterval(() => setText(formatCountdown(deadline)), 60000); return () => clearInterval(i); }, [deadline]);
  const expired = deadline <= Math.floor(Date.now() / 1000);

  return (
    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${expired ? "bg-surface-3 text-text-3" : "bg-orange-dim text-orange"}`}>
      {expired ? "Ended" : text}
    </span>
  );
}
