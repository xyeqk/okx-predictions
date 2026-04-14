import { ReactNode, useRef, useState } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export default function GlowCard({ children, className = "", glowColor = "rgba(37, 99, 235, 0.15)" }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouse}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Glow follows cursor */}
      {hovering && (
        <div
          className="absolute pointer-events-none transition-opacity duration-300"
          style={{
            width: 200,
            height: 200,
            left: pos.x - 100,
            top: pos.y - 100,
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            opacity: hovering ? 1 : 0,
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
