'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface BeforeAfterProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export const BeforeAfter = ({ 
  beforeImage, 
  afterImage, 
  beforeLabel = 'Raw Prompt', 
  afterLabel = 'Engineered Prompt' 
}: BeforeAfterProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const mouseX = useMotionValue(50);
  
  // Transform the 0-100 slider value into a percentage string for the clip-path
  const clipPath = useTransform(mouseX, (v) => `inset(0 ${100 - v}% 0 0)`);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const clampedX = Math.max(0, Math.min(100, x));
    mouseX.set(clampedX);
    setSliderPosition(clampedX);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12">
      <div 
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 cursor-ew-resize select-none group"
        onMouseMove={(e) => handleMove(e.clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      >
        {/* After Image (Base Layer) */}
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={afterImage} 
            alt="Engineered result" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay" />
        </div>

        {/* Before Image (Clipped Layer) */}
        <motion.div 
          style={{ clipPath }}
          className="absolute inset-0 w-full h-full z-10"
        >
          <img 
            src={beforeImage} 
            alt="Raw result" 
            className="w-full h-full object-cover grayscale-[0.3] contrast-75"
          />
          <div className="absolute inset-0 bg-black/20" />
        </motion.div>

        {/* Labels */}
        <div className="absolute inset-0 z-20 pointer-events-none p-6 flex justify-between items-end">
          <span className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-widest text-zinc-400 font-medium">
            {beforeLabel}
          </span>
          <span className="px-3 py-1 rounded-lg bg-indigo-500/60 backdrop-blur-md border border-indigo-400/30 text-[10px] uppercase tracking-widest text-indigo-100 font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            {afterLabel}
          </span>
        </div>

        {/* Slider Handle */}
        <motion.div 
          style={{ left: `${sliderPosition}%` }}
          className="absolute top-0 bottom-0 z-30 w-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-900 border-2 border-white/80 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
            <div className="flex gap-1">
              <div className="w-0.5 h-3 bg-white/50 rounded-full" />
              <div className="w-0.5 h-3 bg-white rounded-full" />
              <div className="w-0.5 h-3 bg-white/50 rounded-full" />
            </div>
          </div>
          
          {/* Handle Glow Effect */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-indigo-400 to-transparent opacity-50 blur-sm" />
        </motion.div>
      </div>
    </div>
  );
};
