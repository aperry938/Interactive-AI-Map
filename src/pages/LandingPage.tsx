import React, { useState, useEffect } from 'react';
import { navigate } from '../router/AppRouter';
import { TIER_CONFIG } from '../types';
import type { Tier } from '../types';
import { getConceptsByTier } from '../data/curriculum';

export const LandingPage: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const tiers = ([1, 2, 3, 4, 5] as Tier[]).map(t => ({
    tier: t,
    config: TIER_CONFIG[t],
    count: getConceptsByTier(t).length,
  }));

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden transition-colors duration-300">
      <div className={`relative z-10 max-w-2xl w-full text-center transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-[0.05em] text-her-dark dark:text-her-cream leading-tight mb-4">
          Interactive AI/ML
          <br />
          Learning Platform
        </h1>

        <p className="font-serif text-lg md:text-xl text-her-dark/50 dark:text-her-cream/50 mb-8 leading-relaxed max-w-xl mx-auto">
          An adaptive, research-grade learning ecosystem for artificial intelligence
          — from data preprocessing to constitutional AI
        </p>

        {/* Tier preview cards — monotone */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {tiers.map(({ tier, config, count }) => (
            <div
              key={tier}
              className="glass rounded-lg px-3 py-2 text-left min-w-[120px]"
            >
              <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-her-dark/50 dark:text-her-cream/50">
                Tier {tier}
              </div>
              <div className="text-xs text-her-dark/60 dark:text-her-cream/60">{config.label}</div>
              <div className="text-xs text-her-dark/30 dark:text-her-cream/30 mt-0.5">{count} concepts</div>
            </div>
          ))}
        </div>

        <div className="glass rounded-xl p-6 mb-8 text-left max-w-lg mx-auto">
          <p className="font-serif text-sm text-her-dark/70 dark:text-her-cream/70 leading-relaxed mb-3">
            Investigating how <em>adaptive interactive visualization</em> with
            Bayesian Knowledge Tracing affects comprehension of machine learning
            concepts across different expertise levels.
          </p>
          <p className="text-xs text-her-dark/40 dark:text-her-cream/40 leading-relaxed">
            Powered by: Cognitive Load Theory (Sweller) &middot; Bayesian Knowledge Tracing (Corbett &amp; Anderson) &middot; Spaced Repetition (Ebbinghaus) &middot; Explorable Explanations (Victor)
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate('/learn')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-her-dark font-medium rounded-full shadow-glow-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            Begin Exploring
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <button
            onClick={() => navigate('/pioneers')}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 dark:bg-white/10 rounded-full border border-her-dark/10 dark:border-white/10 text-her-dark/70 dark:text-her-cream/70 font-medium transition-all duration-300 hover:border-her-dark/20 dark:hover:border-white/20"
          >
            AI Encyclopedia
          </button>
        </div>

        <p className={`mt-12 text-xs text-her-dark/40 dark:text-her-cream/40 transition-all duration-700 delay-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          Built by{' '}
          <a
            href="https://aperry938.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-her-red hover:text-her-orange underline underline-offset-2"
          >
            Anthony C. Perry
          </a>
          {' '}&middot; Human-Centered AI Research Portfolio
        </p>
      </div>
    </div>
  );
};
