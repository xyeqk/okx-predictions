import { useEffect, useRef } from 'react';

class Pixel {
  width: number; height: number; ctx: CanvasRenderingContext2D;
  x: number; y: number; color: string; speed: number; size: number;
  sizeStep: number; minSize: number; maxSizeInteger: number; maxSize: number;
  delay: number; counter: number; counterStep: number;
  isIdle: boolean; isReverse: boolean; isShimmer: boolean;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, x: number, y: number, color: string, speed: number, delay: number) {
    this.width = canvas.width; this.height = canvas.height; this.ctx = ctx;
    this.x = x; this.y = y; this.color = color;
    this.speed = (Math.random() * 0.8 + 0.1) * speed;
    this.size = 0; this.sizeStep = Math.random() * 0.4;
    this.minSize = 0.5; this.maxSizeInteger = 2;
    this.maxSize = Math.random() * (this.maxSizeInteger - this.minSize) + this.minSize;
    this.delay = delay; this.counter = 0;
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
    this.isIdle = false; this.isReverse = false; this.isShimmer = false;
  }

  draw() {
    const o = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x + o, this.y + o, this.size, this.size);
  }

  appear() {
    this.isIdle = false;
    if (this.counter <= this.delay) { this.counter += this.counterStep; return; }
    if (this.size >= this.maxSize) this.isShimmer = true;
    if (this.isShimmer) this.shimmer(); else this.size += this.sizeStep;
    this.draw();
  }

  disappear() {
    this.isShimmer = false; this.counter = 0;
    if (this.size <= 0) { this.isIdle = true; return; }
    this.size -= 0.1; this.draw();
  }

  shimmer() {
    if (this.size >= this.maxSize) this.isReverse = true;
    else if (this.size <= this.minSize) this.isReverse = false;
    this.size += this.isReverse ? -this.speed : this.speed;
  }
}

const VARIANTS: Record<string, { gap: number; speed: number; colors: string; noFocus: boolean }> = {
  default: { gap: 5, speed: 35, colors: '#f8fafc,#f1f5f9,#cbd5e1', noFocus: false },
  blue: { gap: 10, speed: 25, colors: '#e0f2fe,#7dd3fc,#0ea5e9', noFocus: false },
  yellow: { gap: 3, speed: 20, colors: '#fef08a,#fde047,#eab308', noFocus: false },
  pink: { gap: 6, speed: 80, colors: '#fecdd3,#fda4af,#e11d48', noFocus: true },
};

interface PixelCardProps {
  variant?: 'default' | 'blue' | 'yellow' | 'pink';
  gap?: number; speed?: number; colors?: string; noFocus?: boolean;
  className?: string; children: React.ReactNode;
}

export default function PixelCard({ variant = 'default', gap, speed, colors, noFocus, className = '', children }: PixelCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animRef = useRef<number | null>(null);
  const timeRef = useRef(performance.now());
  const reducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches).current;

  const cfg = VARIANTS[variant] || VARIANTS.default;
  const fGap = gap ?? cfg.gap;
  const fSpeed = speed ?? cfg.speed;
  const fColors = colors ?? cfg.colors;
  const fNoFocus = noFocus ?? cfg.noFocus;

  const effectiveSpeed = (v: number) => {
    if (v <= 0 || reducedMotion) return 0;
    return Math.min(v, 100) * 0.001;
  };

  const initPixels = () => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = Math.floor(rect.width), h = Math.floor(rect.height);
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = w; canvasRef.current.height = h;
    canvasRef.current.style.width = `${w}px`; canvasRef.current.style.height = `${h}px`;

    const colArr = fColors.split(',');
    const pxs: Pixel[] = [];
    for (let x = 0; x < w; x += fGap) {
      for (let y = 0; y < h; y += fGap) {
        const color = colArr[Math.floor(Math.random() * colArr.length)];
        const dx = x - w/2, dy = y - h/2;
        const delay = reducedMotion ? 0 : Math.sqrt(dx*dx + dy*dy);
        pxs.push(new Pixel(canvasRef.current, ctx, x, y, color, effectiveSpeed(fSpeed), delay));
      }
    }
    pixelsRef.current = pxs;
  };

  const doAnimate = (fn: 'appear' | 'disappear') => {
    animRef.current = requestAnimationFrame(() => doAnimate(fn));
    const now = performance.now();
    if (now - timeRef.current < 1000/60) return;
    timeRef.current = now - ((now - timeRef.current) % (1000/60));

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    let allIdle = true;
    for (const px of pixelsRef.current) {
      px[fn]();
      if (!px.isIdle) allIdle = false;
    }
    if (allIdle && animRef.current) cancelAnimationFrame(animRef.current);
  };

  const startAnim = (fn: 'appear' | 'disappear') => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(() => doAnimate(fn));
  };

  useEffect(() => {
    initPixels();
    const ro = new ResizeObserver(() => initPixels());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => { ro.disconnect(); if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [fGap, fSpeed, fColors, fNoFocus]);

  return (
    <div ref={containerRef}
      className={`relative overflow-hidden border border-[#27272a] rounded-xl isolate transition-colors duration-200 select-none ${className}`}
      onMouseEnter={() => startAnim('appear')}
      onMouseLeave={() => startAnim('disappear')}
      onFocus={fNoFocus ? undefined : (e) => { if (!e.currentTarget.contains(e.relatedTarget)) startAnim('appear'); }}
      onBlur={fNoFocus ? undefined : (e) => { if (!e.currentTarget.contains(e.relatedTarget)) startAnim('disappear'); }}
      tabIndex={fNoFocus ? -1 : 0}
    >
      <canvas className="absolute inset-0 w-full h-full block" ref={canvasRef} />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
