import { ReactNode, useEffect, useRef } from "react";

interface ElectricBorderProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

export default function ElectricBorder({ children, className = "", color = "#99f7ff" }: ElectricBorderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.scale(2, 2);
    };

    // Generate a jagged line between two points
    const jaggedLine = (x1: number, y1: number, x2: number, y2: number, segments: number, intensity: number, seed: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);

      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const baseX = x1 + (x2 - x1) * t;
        const baseY = y1 + (y2 - y1) * t;

        // Perpendicular offset for jaggedness
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len;
        const ny = dx / len;

        const noise = Math.sin(seed + i * 13.7 + frame * 0.15) * intensity
                    + Math.sin(seed + i * 7.3 + frame * 0.23) * intensity * 0.6
                    + Math.sin(seed + i * 23.1 + frame * 0.31) * intensity * 0.3;

        ctx.lineTo(baseX + nx * noise, baseY + ny * noise);
      }
      ctx.stroke();
    };

    const draw = () => {
      const w = canvas.width / 2;
      const h = canvas.height / 2;
      ctx.clearRect(0, 0, w, h);

      const r = 12;
      const jag = 3.5; // jaggedness intensity
      const segs = 25; // segments per edge

      // Outer glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.7;

      // Top edge
      jaggedLine(r, 0.5, w - r, 0.5, segs, jag, 0);
      // Right edge
      jaggedLine(w - 0.5, r, w - 0.5, h - r, segs, jag, 100);
      // Bottom edge
      jaggedLine(w - r, h - 0.5, r, h - 0.5, segs, jag, 200);
      // Left edge
      jaggedLine(0.5, h - r, 0.5, r, segs, jag, 300);

      // Corners (simple arcs)
      ctx.beginPath(); ctx.arc(r, r, r - 0.5, Math.PI, Math.PI * 1.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(w - r, r, r - 0.5, -Math.PI / 2, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(w - r, h - r, r - 0.5, 0, Math.PI / 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(r, h - r, r - 0.5, Math.PI / 2, Math.PI); ctx.stroke();

      // Second layer - dimmer, different phase for depth
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 0.8;
      ctx.shadowBlur = 6;
      jaggedLine(r, 0.5, w - r, 0.5, segs, jag * 1.5, 50 + frame * 0.1);
      jaggedLine(w - 0.5, r, w - 0.5, h - r, segs, jag * 1.5, 150 + frame * 0.1);
      jaggedLine(w - r, h - 0.5, r, h - 0.5, segs, jag * 1.5, 250 + frame * 0.1);
      jaggedLine(0.5, h - r, 0.5, r, segs, jag * 1.5, 350 + frame * 0.1);

      // Spark nodes at random positions along edges
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 20;
      ctx.fillStyle = color;
      for (let i = 0; i < 4; i++) {
        const sparkPhase = (frame * 0.02 + i * 0.25) % 1;
        let sx: number, sy: number;
        const edge = Math.floor((sparkPhase * 4) % 4);
        const edgeFrac = (sparkPhase * 4) % 1;

        if (edge === 0) { sx = r + (w - 2 * r) * edgeFrac; sy = 0; }
        else if (edge === 1) { sx = w; sy = r + (h - 2 * r) * edgeFrac; }
        else if (edge === 2) { sx = w - r - (w - 2 * r) * edgeFrac; sy = h; }
        else { sx = 0; sy = h - r - (h - 2 * r) * edgeFrac; }

        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      frame++;
      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [color]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />
      <div className="relative">{children}</div>
    </div>
  );
}
