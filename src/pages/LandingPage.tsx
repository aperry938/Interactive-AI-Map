import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { navigate } from '../router/AppRouter';
import { curriculum } from '../data/curriculum';
import { useLearner } from '../stores/learnerStore';
import { MASTERY_THRESHOLD } from '../types';

const GraphPreview = lazy(() =>
  import('../components/features/GraphPreview').then(m => ({ default: m.GraphPreview }))
);

const ScienceCard: React.FC<{
  title: string;
  formula: string;
  description: string;
  delay: number;
}> = ({ title, formula, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay }}
    className="glass rounded-2xl p-5 text-left"
  >
    <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">{title}</h3>
    <div className="text-xs font-mono text-her-cream/50 mb-3 leading-relaxed">{formula}</div>
    <p className="text-[11px] font-light text-white/25 leading-relaxed">{description}</p>
  </motion.div>
);

export const LandingPage: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const totalConcepts = Object.keys(curriculum).length;
  const explorationCount = Object.values(curriculum).filter(c => c.explorationId).length;
  const { getMastery, getConceptState, profile } = useLearner();

  const isReturningUser = profile.onboardingProfile != null;
  const masteredCount = isReturningUser
    ? Object.keys(curriculum).filter(id => getMastery(id) >= MASTERY_THRESHOLD).length
    : 0;
  const exploredCount = isReturningUser
    ? Object.keys(curriculum).filter(id => {
        const state = getConceptState(id);
        return state.explored || state.attemptHistory.length > 0;
      }).length
    : 0;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-hidden">
      {/* Graph preview background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <Suspense fallback={null}>
          <GraphPreview className="w-full h-full" />
        </Suspense>
      </div>

      {/* Gradient overlay to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0707]/90 via-[#0A0707]/70 to-[#0A0707]/95 pointer-events-none" />

      {/* Main content */}
      <div className={`relative z-10 max-w-2xl w-full px-6 pt-24 md:pt-32 transition-all duration-1000 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}>
        {/* Hero */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.1 }}
            className="text-[9px] uppercase tracking-[0.35em] text-white/20 mb-6"
          >
            Adaptive Educational Technology
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-light tracking-[0.06em] text-white/90 leading-tight mb-6">
            Interactive AI/ML
            <br />
            <span className="text-white/35">Learning Map</span>
          </h1>

          <p className="text-sm font-light text-white/30 leading-relaxed max-w-md mx-auto mb-10">
            A knowledge-graph-driven learning platform with Bayesian mastery tracking,
            spaced repetition, and {explorationCount} interactive explorations across {totalConcepts} concepts.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4">
            <motion.button
              onClick={() => navigate('/map')}
              className="group flex items-center gap-3 px-8 py-3 rounded-full bg-white/[0.08] border border-white/[0.08] text-white/70 text-xs uppercase tracking-[0.25em] font-medium transition-all duration-500 hover:bg-white/[0.12] hover:border-white/[0.15] hover:text-white/90"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isReturningUser ? 'Continue Learning' : 'Enter the Map'}
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

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/methodology')}
                className="text-[10px] uppercase tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors duration-500"
              >
                Methodology
              </button>
              <span className="text-white/10 text-[8px]">&middot;</span>
              <button
                onClick={() => navigate('/pioneers')}
                className="text-[10px] uppercase tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors duration-500"
              >
                Encyclopedia
              </button>
            </div>
          </div>
        </div>

        {/* Returning user stats */}
        {isReturningUser && (masteredCount > 0 || exploredCount > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex justify-center mb-16"
          >
            <div className="text-center px-8 border-r border-white/[0.06]">
              <div className="text-2xl font-light text-white/60 tabular-nums">{masteredCount}</div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-white/20 mt-1">mastered</div>
            </div>
            <div className="text-center px-8 border-r border-white/[0.06]">
              <div className="text-2xl font-light text-white/40 tabular-nums">{exploredCount}</div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-white/20 mt-1">explored</div>
            </div>
            <div className="text-center px-8">
              <div className="text-2xl font-light text-white/30 tabular-nums">{totalConcepts - masteredCount}</div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-white/20 mt-1">remaining</div>
            </div>
          </motion.div>
        )}

        {/* Learning science cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          <ScienceCard
            title="Bayesian Knowledge Tracing"
            formula="P(L|obs) = P(obs|L) * P(L) / P(obs)"
            description="Each concept's mastery is modeled as a latent probability, updated via Bayesian inference after every quiz attempt."
            delay={0.6}
          />
          <ScienceCard
            title="Spaced Repetition"
            formula="R(t) = e^(-t/S)"
            description="Review intervals expand with mastery. The forgetting curve drives optimal timing to maximize long-term retention."
            delay={0.75}
          />
          <ScienceCard
            title="Prerequisite Graph"
            formula="G = (V, E) where V = concepts"
            description="A directed acyclic graph enforces learning order. New concepts unlock only when their prerequisites are mastered."
            delay={0.9}
          />
        </div>

        {/* Platform capabilities */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-20"
        >
          {[
            `${totalConcepts} concepts`,
            '5 mastery tiers',
            `${explorationCount} interactive explorations`,
            '3 quiz formats',
            'Adaptive difficulty',
            "Bloom's taxonomy alignment",
          ].map((item) => (
            <span key={item} className="text-[10px] text-white/15 tracking-wider">{item}</span>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: visible ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="text-center pb-8"
        >
          <p className="text-[10px] text-white/15 tracking-wider">
            Built by{' '}
            <a
              href="https://aperry938.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/25 hover:text-white/50 transition-colors duration-300"
            >
              Anthony C. Perry
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
