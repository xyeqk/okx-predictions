import { useState, useEffect } from "react";
import { Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { truncateAddress, timeAgo } from "../../lib/format";

interface FeedItem { id: number; type: "whale"|"signal"|"meme"; title: string; detail: string; time: number; }

const MOCK: FeedItem[] = [
  { id:1, type:"whale", title:"Whale bought 500 ETH", detail:"0x742d...bD18", time:Math.floor(Date.now()/1000)-120 },
  { id:2, type:"signal", title:"Smart Money: OKB", detail:"3 wallets, $200K+", time:Math.floor(Date.now()/1000)-300 },
  { id:3, type:"meme", title:"New meme on X Layer", detail:"DOGE2.0", time:Math.floor(Date.now()/1000)-480 },
  { id:4, type:"whale", title:"Whale sold 1K LINK", detail:"0x8ba1...BA72", time:Math.floor(Date.now()/1000)-720 },
];

const IC = { whale: AlertTriangle, signal: TrendingUp, meme: Zap };
const CL = { whale: "text-purple", signal: "text-green", meme: "text-pink" };

export default function LiveFeed() {
  const [feed, setFeed] = useState<FeedItem[]>(MOCK);
  useEffect(() => {
    const i = setInterval(() => {
      const types: ("whale"|"signal"|"meme")[] = ["whale","signal","meme"];
      const titles = { whale:["Whale bought 200 BTC","Large ETH deposit"], signal:["Smart Money: ARB","Buy signal: MATIC"], meme:["New pump.fun trending","Meme 10x in 1h"] };
      const t = types[Math.floor(Math.random()*types.length)];
      setFeed(p => [{ id:Date.now(), type:t, title:titles[t][Math.floor(Math.random()*titles[t].length)],
        detail:truncateAddress("0x"+Math.random().toString(16).slice(2,42)), time:Math.floor(Date.now()/1000) }, ...p.slice(0,6)]);
    }, 8000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="rounded-xl bg-surface border border-border p-4">
      <div className="flex items-center gap-2 mb-3"><div className="h-1.5 w-1.5 rounded-full bg-green animate-pulse"/><span className="text-[13px] font-bold">Live Feed</span></div>
      <div className="space-y-0.5">
        {feed.map(item => { const I = IC[item.type]; return (
          <div key={item.id} className="flex items-center gap-2.5 py-2 px-1.5 rounded hover:bg-surface-2 transition-colors">
            <I size={11} className={CL[item.type]}/>
            <div className="flex-1 min-w-0"><p className="text-[11px] font-medium truncate">{item.title}</p><p className="text-[10px] text-text-3 truncate">{item.detail}</p></div>
            <span className="text-[10px] text-text-3 shrink-0">{timeAgo(item.time)}</span>
          </div>
        );})}
      </div>
    </div>
  );
}
