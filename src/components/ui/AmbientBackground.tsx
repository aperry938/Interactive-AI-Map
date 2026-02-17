import React from 'react';
import { motion } from 'framer-motion';

// Large, visible orbs that create the warm gradient wash like her-os
const orbs = [
  { color: '#D94436', size: 900, x: '10%', y: '-10%', duration: 35, opacity: 0.25 },
  { color: '#E87C56', size: 1100, x: '60%', y: '50%', duration: 40, opacity: 0.3 },
  { color: '#F2E8DC', size: 800, x: '40%', y: '20%', duration: 30, opacity: 0.35 },
  { color: '#E6B8A2', size: 1000, x: '20%', y: '70%', duration: 38, opacity: 0.2 },
  { color: '#D94436', size: 700, x: '80%', y: '-5%', duration: 32, opacity: 0.15 },
];

export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Base background */}
      <div className="absolute inset-0 bg-her-cream dark:bg-[#0F0A0A] transition-colors duration-500" />

      {/* Ambient orbs — large and visible to create the warm wash */}
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
            filter: `blur(${Math.round(orb.size * 0.4)}px)`,
          }}
          animate={{
            x: [0, 60, -40, 30, 0],
            y: [0, -30, 20, -50, 0],
            scale: [1, 1.05, 0.97, 1.03, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Grid overlay — dark mode only */}
      <div className="absolute inset-0 grid-overlay opacity-0 dark:opacity-100 transition-opacity duration-500" />

      {/* Grain overlay */}
      <div className="grain-overlay absolute inset-0" />
    </div>
  );
};
