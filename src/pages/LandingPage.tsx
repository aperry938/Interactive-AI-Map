import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { navigate } from '../router/AppRouter';
import { curriculum } from '../data/curriculum';

export const LandingPage: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const totalConcepts = Object.keys(curriculum).length;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className={`relative z-10 max-w-lg w-full text-center transition-all duration-1000 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}>
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-light tracking-[0.08em] text-white/85 leading-relaxed mb-6">
          Interactive AI/ML
          <br />
          <span className="text-white/40">Learning Platform</span>
        </h1>

        <p className="text-sm font-light text-white/30 leading-relaxed max-w-sm mx-auto mb-12">
          An adaptive learning ecosystem — from data preprocessing to constitutional AI.
          {' '}{totalConcepts} concepts across five tiers of mastery.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          <motion.button
            onClick={() => navigate('/learn')}
            className="group flex items-center gap-3 px-8 py-3 rounded-full bg-white/[0.08] border border-white/[0.08] text-white/70 text-xs uppercase tracking-[0.25em] font-medium transition-all duration-500 hover:bg-white/[0.12] hover:border-white/[0.15] hover:text-white/90"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Begin Exploring
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-white/30 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.button>

          <button
            onClick={() => navigate('/pioneers')}
            className="text-[10px] uppercase tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors duration-500"
          >
            AI Encyclopedia
          </button>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: visible ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 text-[10px] text-white/15 tracking-wider"
        >
          Built by{' '}
          <a
            href="https://aperry938.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/25 hover:text-white/50 transition-colors duration-300"
          >
            Anthony C. Perry
          </a>
        </motion.p>
      </div>
    </div>
  );
};
