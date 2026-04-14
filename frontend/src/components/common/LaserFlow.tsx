import { useEffect, useRef } from "react";

interface LaserFlowProps {
  className?: string;
  color?: string;
}

export default function LaserFlow({ className = "", color = "#a855f7" }: LaserFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };

    const draw = () => {
      const w = canvas.width / 2;
      const h = canvas.height / 2;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const impactY = h * 0.65;

      // === MAIN BEAM — vertical laser from top ===
      const beamWidth = 3 + Math.sin(t * 3) * 1;

      // Core beam (bright white center)
      const beamGrad = ctx.createLinearGradient(cx, 0, cx, impactY);
      beamGrad.addColorStop(0, "rgba(255,255,255,0)");
      beamGrad.addColorStop(0.3, "rgba(255,255,255,0.9)");
      beamGrad.addColorStop(0.7, "rgba(255,255,255,1)");
      beamGrad.addColorStop(1, "rgba(255,255,255,1)");

      ctx.beginPath();
      ctx.moveTo(cx - beamWidth * 0.3, 0);
      ctx.lineTo(cx - beamWidth, impactY);
      ctx.lineTo(cx + beamWidth, impactY);
      ctx.lineTo(cx + beamWidth * 0.3, 0);
      ctx.closePath();
      ctx.fillStyle = beamGrad;
      ctx.globalAlpha = 0.8 + Math.sin(t * 5) * 0.15;
      ctx.fill();

      // Outer glow beam (colored)
      const glowGrad = ctx.createLinearGradient(cx, 0, cx, impactY);
      glowGrad.addColorStop(0, "transparent");
      glowGrad.addColorStop(0.4, color + "40");
      glowGrad.addColorStop(1, color + "80");

      ctx.beginPath();
      ctx.moveTo(cx - beamWidth * 2, 0);
      ctx.lineTo(cx - beamWidth * 6, impactY);
      ctx.lineTo(cx + beamWidth * 6, impactY);
      ctx.lineTo(cx + beamWidth * 2, 0);
      ctx.closePath();
      ctx.fillStyle = glowGrad;
      ctx.globalAlpha = 0.4;
      ctx.fill();

      // === IMPACT FLARE — where beam hits ===
      // Wide horizontal glow at impact point
      const flareGrad = ctx.createRadialGradient(cx, impactY, 0, cx, impactY, w * 0.6);
      flareGrad.addColorStop(0, "rgba(255,255,255,0.6)");
      flareGrad.addColorStop(0.1, color + "90");
      flareGrad.addColorStop(0.3, color + "30");
      flareGrad.addColorStop(1, "transparent");

      ctx.globalAlpha = 0.7 + Math.sin(t * 4) * 0.2;
      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.ellipse(cx, impactY, w * 0.5, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bright center flare
      const coreFlare = ctx.createRadialGradient(cx, impactY, 0, cx, impactY, 40);
      coreFlare.addColorStop(0, "rgba(255,255,255,0.9)");
      coreFlare.addColorStop(0.5, color + "60");
      coreFlare.addColorStop(1, "transparent");
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = coreFlare;
      ctx.beginPath();
      ctx.arc(cx, impactY, 40, 0, Math.PI * 2);
      ctx.fill();

      // === PARTICLES rising from impact ===
      ctx.globalAlpha = 1;
      for (let i = 0; i < 20; i++) {
        const seed = i * 7.3;
        const life = (t * 0.5 + seed) % 3;
        if (life > 2) continue;

        const px = cx + Math.sin(seed + t * 0.8) * (40 + life * 60);
        const py = impactY - life * 50 - Math.sin(seed) * 20;
        const size = (1 - life / 2) * 2;
        const alpha = (1 - life / 2) * 0.5;

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.fill();
      }

      // === AMBIENT GLOW — top area ===
      const ambientGrad = ctx.createRadialGradient(cx, 0, 0, cx, 0, w * 0.4);
      ambientGrad.addColorStop(0, color + "15");
      ambientGrad.addColorStop(1, "transparent");
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, w, h * 0.5);

      ctx.globalAlpha = 1;
      t += 0.016;
      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, [color]);

  return <canvas ref={canvasRef} className={`pointer-events-none ${className}`} />;
}
