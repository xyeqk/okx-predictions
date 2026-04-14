import { useState, useEffect } from "react";
import { Search, Settings, Bell, X } from "lucide-react";
import SearchModal from "../common/SearchModal";

interface Notification {
  id: number;
  text: string;
  time: number;
  read: boolean;
}

export default function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Listen for CMD+K
  useEffect(() => {
    const handler = () => setSearchOpen(true);
    document.addEventListener("open-search", handler);
    return () => document.removeEventListener("open-search", handler);
  }, []);

  // Listen for agent predictions via Socket.IO
  useEffect(() => {
    import("socket.io-client").then(({ io }) => {
      const socket = io(window.location.origin.replace(":5173", ":3001"));
      socket.on("new-prediction", (data: { agentId: number; marketId: number; prediction: string; confidence: number }) => {
        setNotifications(prev => [{
          id: Date.now(),
          text: `Agent #${data.agentId} predicted ${data.prediction} (${data.confidence}%) on market #${data.marketId}`,
          time: Date.now(),
          read: false,
        }, ...prev].slice(0, 20));
      });
      socket.on("agent-status-changed", (data: { agentId: number; online: boolean }) => {
        setNotifications(prev => [{
          id: Date.now(),
          text: `Agent #${data.agentId} is now ${data.online ? "ONLINE" : "OFFLINE"}`,
          time: Date.now(),
          read: false,
        }, ...prev].slice(0, 10));
      });
      return () => { socket.disconnect(); };
    });
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const timeAgo = (t: number) => {
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return "now";
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h`;
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center h-12 px-6 gap-5">
          {/* Search trigger */}
          <button onClick={() => setSearchOpen(true)}
            className="flex-1 max-w-xl flex items-center gap-3 bg-surface-2 border border-border rounded-lg px-4 py-2 text-left hover:border-border-2 transition-colors">
            <Search size={14} className="text-text-3" />
            <span className="text-[13px] text-text-3 flex-1">Search markets, agents...</span>
            <span className="text-[10px] font-semibold text-text-3 bg-surface-3 px-1.5 py-0.5 rounded border border-border">⌘K</span>
          </button>

          {/* Right stats */}
          <div className="flex items-center gap-4 ml-auto text-[12px]">
            <div className="flex items-center gap-1.5">
              <span className="text-text-3">Gas</span>
              <span className="text-green font-bold">0.00</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="text-text-3">OKB</span>
              <span className="text-text font-bold">$1.42</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <button className="text-text-3 hover:text-text-2 transition-colors"><Settings size={15} /></button>

            {/* Bell with dropdown */}
            <div className="relative">
              <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markAllRead(); }}
                className="text-text-3 hover:text-text-2 transition-colors relative">
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-blue text-[8px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-8 w-80 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-[13px] font-bold">Notifications</span>
                    <button onClick={() => setNotifOpen(false)} className="text-text-3 hover:text-text"><X size={14} /></button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className={`px-4 py-3 border-b border-border text-[12px] ${n.read ? "" : "bg-blue/5"}`}>
                        <p className="text-text-2">{n.text}</p>
                        <p className="text-[10px] text-text-3 mt-1">{timeAgo(n.time)} ago</p>
                      </div>
                    )) : (
                      <div className="px-4 py-8 text-center text-[12px] text-text-3">No notifications yet</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
