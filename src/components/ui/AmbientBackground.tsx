import React from 'react';
import { motion } from 'framer-motion';

const orbs = [
  { color: '#D94436', size: 1000, x: '5%', y: '-15%', duration: 40, opacity: 0.12 },
  { color: '#E87C56', size: 1200, x: '55%', y: '45%', duration: 45, opacity: 0.1 },
  { color: '#2C1A1A', size: 900, x: '35%', y: '15%', duration: 35, opacity: 0.2 },
  { color: '#E6B8A2', size: 1100, x: '15%', y: '65%', duration: 42, opacity: 0.08 },
  { color: '#D94436', size: 800, x: '75%', y: '-8%', duration: 38, opacity: 0.06 },
];

export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Deep dark base */}
      <div className="absolute inset-0 bg-[#0A0707] transition-colors duration-500" />

      {/* Subtle radial gradient center glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 40% 30%, rgba(217, 68, 54, 0.06) 0%, rgba(10, 7, 7, 0) 70%)',
        }}
      />

      {/* Ambient orbs — very subtle */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            backgroundColor: orb.color,
            opacity: orb.opacity,
            filter: `blur(${Math.round(orb.size * 0.45)}px)`,
          }}
          animate={{
            x: [0, 40, -30, 20, 0],
            y: [0, -20, 15, -35, 0],
            scale: [1, 1.03, 0.98, 1.02, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Grid overlay */}
      <div className="absolute inset-0 grid-overlay opacity-40" />

      {/* Grain overlay */}
      <div className="grain-overlay absolute inset-0" />
    </div>
  );
};
