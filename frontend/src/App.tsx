import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import Beams from "./components/common/Beams";
import Home from "./pages/Home";
import Markets from "./pages/Markets";
import MarketDetail from "./pages/MarketDetail";
import CreateMarket from "./pages/CreateMarket";
import Agents from "./pages/Agents";
import AgentDetail from "./pages/AgentDetail";
import Portfolio from "./pages/Portfolio";
import Docs from "./pages/Docs";
import Roadmap from "./pages/Roadmap";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-bg text-text">
        <div className="fixed inset-0 z-0 opacity-30">
          <Beams beamWidth={3} beamHeight={30} beamNumber={20} lightColor="#5227FF" speed={2} noiseIntensity={1.75} scale={0.2} rotation={30} />
        </div>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 ml-[240px] relative z-10">
          <TopBar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/markets/create" element={<CreateMarket />} />
              <Route path="/markets/:id" element={<MarketDetail />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/agents/:id" element={<AgentDetail />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/roadmap" element={<Roadmap />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
