import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface TrueFocusProps {
  sentence?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  className?: string;
}

export default function TrueFocus({
  sentence = 'True Focus',
  manualMode = false,
  blurAmount = 5,
  borderColor = '#5227FF',
  glowColor = 'rgba(82, 39, 255, 0.6)',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  className = '',
}: TrueFocusProps) {
  const words = sentence.split(' ');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [focusRect, setFocusRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!manualMode) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % words.length);
      }, (animationDuration + pauseBetweenAnimations) * 1000);
      return () => clearInterval(interval);
    }
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  useEffect(() => {
    if (currentIndex === null || currentIndex === -1) return;
    if (!wordRefs.current[currentIndex] || !containerRef.current) return;
    const parentRect = containerRef.current.getBoundingClientRect();
    const activeRect = wordRefs.current[currentIndex]!.getBoundingClientRect();
    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    });
  }, [currentIndex, words.length]);

  return (
    <div ref={containerRef} className={`relative flex gap-[0.35em] items-center ${className}`} style={{ outline: 'none', userSelect: 'none' }}>
      {words.map((word, index) => (
        <span
          key={index}
          ref={el => { wordRefs.current[index] = el; }}
          className="relative cursor-pointer"
          style={{
            filter: index === currentIndex ? 'blur(0px)' : `blur(${blurAmount}px)`,
            transition: `filter ${animationDuration}s ease`,
          }}
          onMouseEnter={() => manualMode && (setLastActiveIndex(index), setCurrentIndex(index))}
          onMouseLeave={() => manualMode && setCurrentIndex(lastActiveIndex!)}
        >
          {word}
        </span>
      ))}

      <motion.div
        className="absolute top-0 left-0 pointer-events-none"
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: currentIndex >= 0 ? 1 : 0,
        }}
        transition={{ duration: animationDuration }}
        style={{ '--bc': borderColor, '--gc': glowColor } as React.CSSProperties}
      >
        {/* Corner brackets */}
        <span className="absolute w-4 h-4 border-[3px] rounded-[3px] top-[-10px] left-[-10px] border-r-0 border-b-0"
          style={{ borderColor: 'var(--bc)', filter: 'drop-shadow(0 0 4px var(--bc))' }} />
        <span className="absolute w-4 h-4 border-[3px] rounded-[3px] top-[-10px] right-[-10px] border-l-0 border-b-0"
          style={{ borderColor: 'var(--bc)', filter: 'drop-shadow(0 0 4px var(--bc))' }} />
        <span className="absolute w-4 h-4 border-[3px] rounded-[3px] bottom-[-10px] left-[-10px] border-r-0 border-t-0"
          style={{ borderColor: 'var(--bc)', filter: 'drop-shadow(0 0 4px var(--bc))' }} />
        <span className="absolute w-4 h-4 border-[3px] rounded-[3px] bottom-[-10px] right-[-10px] border-l-0 border-t-0"
          style={{ borderColor: 'var(--bc)', filter: 'drop-shadow(0 0 4px var(--bc))' }} />
      </motion.div>
    </div>
  );
}
