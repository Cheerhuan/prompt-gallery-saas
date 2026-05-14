'use client';
import { useRef, useCallback, useEffect, useState } from 'react';

interface TiltOptions {
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
  maxGlare?: number;
}

interface TiltStyles {
  transform: string;
  transition: string;
}

export function use3DTilt(options: TiltOptions = {}) {
  const {
    maxTilt = 10,
    perspective = 1000,
    scale = 1.02,
    speed = 400,
    glare = false,
    maxGlare = 0.5,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isHoverSupported, setIsHoverSupported] = useState(true);
  const frameRef = useRef<number>(0);
  const mouseX = useRef(0.5);
  const mouseY = useRef(0.5);
  const isHovering = useRef(false);

  // Check (hover: hover) media query — skip touch devices
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsHoverSupported(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsHoverSupported(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const updateTransform = useCallback(() => {
    if (!ref.current || !isHovering.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = mouseX.current;
    const y = mouseY.current;

    // Calculate rotation: center of element = 0 tilt, edges = maxTilt
    const rotateY = (x - 0.5) * 2 * maxTilt;
    const rotateX = (0.5 - y) * 2 * maxTilt;

    const glareOpacity = glare
      ? Math.min(
          maxGlare,
          Math.abs((x - 0.5) * 2) * 0.5 + Math.abs((0.5 - y) * 2) * 0.5
        )
      : 0;

    ref.current.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale},${scale},${scale})`;

    if (glare) {
      const glareEl = ref.current.querySelector('[data-tilt-glare]') as HTMLElement | null;
      if (glareEl) {
        glareEl.style.opacity = String(glareOpacity);
        glareEl.style.background = `linear-gradient(135deg, rgba(255,255,255,${glareOpacity}) 0%, transparent 100%)`;
      }
    }

    frameRef.current = requestAnimationFrame(updateTransform);
  }, [maxTilt, perspective, scale, glare, maxGlare]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!ref.current || !isHoverSupported) return;
      const rect = ref.current.getBoundingClientRect();
      mouseX.current = (e.clientX - rect.left) / rect.width;
      mouseY.current = (e.clientY - rect.top) / rect.height;
      if (!isHovering.current) {
        isHovering.current = true;
        setIsHovered(true);
        frameRef.current = requestAnimationFrame(updateTransform);
      }
    },
    [isHoverSupported, updateTransform]
  );

  const handleMouseLeave = useCallback(() => {
    isHovering.current = false;
    setIsHovered(false);
    cancelAnimationFrame(frameRef.current);
    if (ref.current) {
      ref.current.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`;
      ref.current.style.transition = `transform ${speed}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      if (glare) {
        const glareEl = ref.current.querySelector('[data-tilt-glare]') as HTMLElement | null;
        if (glareEl) glareEl.style.opacity = '0';
      }
      // Remove transition after animation completes so rAF updates are instant
      setTimeout(() => {
        if (ref.current) ref.current.style.transition = 'none';
      }, speed);
    }
  }, [perspective, speed, glare]);

  const handleMouseEnter = useCallback(() => {
    if (!ref.current || !isHoverSupported) return;
    // Reset transition for smooth entry
    ref.current.style.transition = `transform ${speed * 0.6}ms cubic-bezier(0.16, 1, 0.3, 1)`;
  }, [isHoverSupported, speed]);

  // Attach/cleanup event listeners
  useEffect(() => {
    const el = ref.current;
    if (!el || !isHoverSupported) return;

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(frameRef.current);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isHoverSupported, handleMouseEnter, handleMouseMove, handleMouseLeave]);

  const style: TiltStyles = {
    transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`,
    transition: `transform ${speed}ms cubic-bezier(0.16, 1, 0.3, 1)`,
  };

  return { ref, isHovered, style };
}
