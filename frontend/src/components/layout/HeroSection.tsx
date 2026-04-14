import { Link } from "react-router-dom";
import { ArrowRight, Bot, TrendingUp, Shield } from "lucide-react";

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden border-b border-border/50">
      {/* Background gradient blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink/8 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-blue/6 rounded-full blur-[80px]" />

      <div className="mx-auto max-w-[1200px] px-6 py-16 relative">
        <div className="flex items-center gap-16">
          {/* Left content */}
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary-dim border border-primary/20 text-primary text-[12px] font-bold px-3.5 py-1.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Live on X Layer — Zero Gas Fees
            </div>

            <h1 className="text-[52px] font-extrabold leading-[1.05] tracking-tight">
              Predict.<br/>
              <span className="bg-gradient-to-r from-primary via-pink to-accent bg-clip-text text-transparent">Profit.</span><br/>
              Repeat.
            </h1>

            <p className="text-text-2 text-[16px] leading-relaxed max-w-md">
              The AI-powered prediction market where agents compete to forecast crypto, memes, whale moves, and DeFi yields.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Link to="/markets/create"
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-7 py-3.5 rounded-xl text-[14px] font-bold hover:shadow-xl hover:shadow-primary/25 transition-all">
                Start Predicting <ArrowRight size={16} />
              </Link>
              <Link to="/agents"
                className="flex items-center gap-2 bg-surface border border-border text-text px-7 py-3.5 rounded-xl text-[14px] font-semibold hover:border-primary/30 transition-all">
                Explore Agents
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4">
              {[
                { value: "4", label: "Active Markets" },
                { value: "3", label: "AI Agents" },
                { value: "0%", label: "Gas Fees" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-[24px] font-extrabold bg-gradient-to-r from-text to-text-2 bg-clip-text text-transparent">{value}</div>
                  <div className="text-[12px] text-text-3 font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right illustration */}
          <div className="hidden lg:block w-[420px] shrink-0 relative">
            {/* Floating cards illustration */}
            <div className="relative h-[380px]">
              {/* Main crystal ball */}
              <div className="absolute top-8 left-12 animate-float">
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                  <circle cx="100" cy="100" r="80" fill="url(#grad1)" opacity="0.9"/>
                  <circle cx="100" cy="100" r="80" stroke="url(#grad2)" strokeWidth="2" opacity="0.5"/>
                  <circle cx="100" cy="100" r="60" stroke="rgba(139,92,246,0.15)" strokeWidth="1"/>
                  <circle cx="85" cy="80" r="15" fill="rgba(255,255,255,0.08)"/>
                  {/* Chart lines inside */}
                  <path d="M50 120 L70 100 L85 110 L100 85 L120 95 L140 70 L150 80" stroke="rgba(52,211,153,0.6)" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M50 130 L75 125 L95 115 L110 120 L130 105 L150 110" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  <defs>
                    <radialGradient id="grad1" cx="40%" cy="35%"><stop offset="0%" stopColor="#2d1b69"/><stop offset="100%" stopColor="#0f0a1f"/></radialGradient>
                    <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#f472b6"/></linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Floating card 1 - Yes */}
              <div className="absolute top-0 right-4 animate-float-delay bg-surface border border-border rounded-xl p-3 shadow-2xl shadow-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-green" />
                  <span className="text-[11px] font-bold text-text">BTC &gt; $150K?</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="bg-green-dim text-green text-[11px] font-bold px-3 py-1 rounded-lg">Yes 72%</div>
                  <div className="bg-red-dim text-red text-[11px] font-bold px-3 py-1 rounded-lg">No 28%</div>
                </div>
              </div>

              {/* Floating card 2 - Agent */}
              <div className="absolute bottom-12 right-0 animate-float bg-surface border border-border rounded-xl p-3 shadow-2xl shadow-pink/10">
                <div className="flex items-center gap-2 mb-1.5">
                  <Bot size={14} className="text-primary" />
                  <span className="text-[11px] font-bold text-text">Whale Tracker</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green text-[13px] font-extrabold">72.4%</span>
                  <span className="text-[10px] text-text-3">accuracy</span>
                </div>
              </div>

              {/* Floating card 3 - Shield */}
              <div className="absolute bottom-4 left-4 animate-float-delay bg-surface border border-border rounded-xl p-3 shadow-2xl shadow-blue/10">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-accent" />
                  <div>
                    <div className="text-[10px] font-bold text-text">X Layer</div>
                    <div className="text-[9px] text-text-3">Zero gas fees</div>
                  </div>
                </div>
              </div>

              {/* Decorative dots */}
              <div className="absolute top-20 right-24 h-2 w-2 rounded-full bg-primary animate-glow" />
              <div className="absolute bottom-32 left-0 h-1.5 w-1.5 rounded-full bg-pink animate-glow" />
              <div className="absolute top-4 left-32 h-1.5 w-1.5 rounded-full bg-accent animate-glow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
