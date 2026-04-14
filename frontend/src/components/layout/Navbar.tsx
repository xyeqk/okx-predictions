import { Link, useLocation } from "react-router-dom";
import { Plus, Wallet, LogOut, Zap } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";

const links = [
  { path: "/", label: "Markets" },
  { path: "/agents", label: "Agents" },
  { path: "/portfolio", label: "Portfolio" },
];

export default function Navbar() {
  const loc = useLocation();
  const { address, balance, connecting, connect, disconnect, isConnected } = useWallet();

  return (
    <nav className="border-b border-border/50 bg-bg/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="mx-auto max-w-[1200px] px-6 flex h-[60px] items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-pink flex items-center justify-center">
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-primary to-pink opacity-20 blur-md" />
          </div>
          <span className="text-[17px] font-bold tracking-tight">PredictX</span>
        </Link>

        {/* Nav */}
        <div className="flex items-center gap-1 bg-surface/80 rounded-xl p-1 border border-border/50">
          {links.map(({ path, label }) => (
            <Link key={path} to={path}
              className={`px-5 py-[7px] rounded-lg text-[13px] font-semibold transition-all ${
                loc.pathname === path
                  ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/20"
                  : "text-text-2 hover:text-text"
              }`}>{label}</Link>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <Link to="/markets/create"
            className="flex items-center gap-1.5 rounded-xl bg-surface border border-border px-4 py-[9px] text-[13px] font-semibold text-text hover:border-primary/30 hover:text-primary transition-all">
            <Plus size={14} strokeWidth={2.5} /> Create
          </Link>

          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-green-dim border border-green/20 px-4 py-[9px]">
                <div className="h-2 w-2 rounded-full bg-green animate-pulse" />
                <span className="text-green text-[12px] font-bold">{balance}</span>
                <span className="text-text-3 text-[11px] font-mono">{address?.slice(0,6)}...{address?.slice(-4)}</span>
              </div>
              <button onClick={disconnect} className="p-2 rounded-lg text-text-3 hover:text-red hover:bg-red-dim transition-all"><LogOut size={13}/></button>
            </div>
          ) : (
            <button onClick={connect} disabled={connecting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-[9px] text-[13px] font-bold text-white hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50">
              <Wallet size={14} /> {connecting ? "..." : "Connect"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
