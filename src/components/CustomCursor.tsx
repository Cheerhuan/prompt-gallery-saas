'use client';
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springX = useSpring(cursorX, { stiffness: 500, damping: 28 });
  const springY = useSpring(cursorY, { stiffness: 500, damping: 28 });

  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on desktop (hover: hover)
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsVisible(mq.matches);

    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const hoverStart = () => setIsHovering(true);
    const hoverEnd = () => setIsHovering(false);

    window.addEventListener('mousemove', move);
    // Add hover detection for interactive elements
    document.querySelectorAll('a, button, [role="button"]').forEach(el => {
      el.addEventListener('mouseenter', hoverStart);
      el.addEventListener('mouseleave', hoverEnd);
    });

    return () => {
      window.removeEventListener('mousemove', move);
      document.querySelectorAll('a, button, [role="button"]').forEach(el => {
        el.removeEventListener('mouseenter', hoverStart);
        el.removeEventListener('mouseleave', hoverEnd);
      });
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* 主游標 - 大圓點 */}
      <motion.div
        style={{
          position: 'fixed',
          left: springX,
          top: springY,
          width: isHovering ? 48 : 32,
          height: isHovering ? 48 : 32,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.2)',
          backgroundColor: isHovering ? 'rgba(99,102,241,0.1)' : 'transparent',
          backdropFilter: 'blur(4px)',
          transform: 'translate(-50%, -50%)',
          zIndex: 99999,
          pointerEvents: 'none',
          transition: 'width 0.3s, height 0.3s, background-color 0.3s',
        }}
      />
      {/* 追隨光環 */}
      <motion.div
        style={{
          position: 'fixed',
          left: cursorX,
          top: cursorY,
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.4)',
          transform: 'translate(-50%, -50%)',
          zIndex: 99999,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
