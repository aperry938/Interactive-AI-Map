import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeDetailModal } from '../components/features/NodeDetailModal';
import { navigate } from '../router/AppRouter';
import { curriculum, getConceptsByTier } from '../data/curriculum';
import { TIER_CONFIG, MASTERY_THRESHOLD } from '../types';
import type { Tier, ConceptNode } from '../types';
import { useLearner } from '../stores/learnerStore';

interface LearnViewProps {
  initialConceptId?: string;
}

const ConceptRow: React.FC<{
  concept: ConceptNode;
  mastery: number;
  isUnlocked: boolean;
  onClick: () => void;
  index: number;
}> = ({ concept, mastery, isUnlocked, onClick, index }) => {
  const isMastered = mastery >= MASTERY_THRESHOLD;
  const pct = Math.round(mastery * 100);

  return (
    <motion.button
      onClick={onClick}
      disabled={!isUnlocked}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      className={`group w-full text-left py-4 border-b transition-all duration-300 ${
        isUnlocked
          ? 'border-white/[0.06] hover:bg-white/[0.03] cursor-pointer'
          : 'border-white/[0.03] cursor-not-allowed'
      }`}
      whileHover={isUnlocked ? { x: 4 } : undefined}
      whileTap={isUnlocked ? { scale: 0.995 } : undefined}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Status dot */}
          <div className="flex-shrink-0">
            {!isUnlocked ? (
              <div className="w-2 h-2 rounded-full bg-white/10" />
            ) : isMastered ? (
              <div className="w-2 h-2 rounded-full bg-her-cream/60" />
            ) : mastery > 0 ? (
              <div className="w-2 h-2 rounded-full bg-her-orange/40" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-white/15" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className={`text-sm font-light tracking-wide transition-colors duration-300 ${
              isUnlocked
                ? 'text-white/80 group-hover:text-white'
                : 'text-white/20'
            }`}>
              {concept.name}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Interactive indicator */}
          {isUnlocked && concept.explorationId && (
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-medium">
              interactive
            </span>
          )}

          {/* Mastery percentage */}
          {isUnlocked && mastery > 0 && (
            <span className={`text-xs tabular-nums font-light ${
              isMastered ? 'text-her-cream/50' : 'text-white/25'
            }`}>
              {pct}%
            </span>
          )}

          {/* Arrow */}
          {isUnlocked && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-white/15 group-hover:text-white/40 transition-all duration-300 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}

          {/* Lock */}
          {!isUnlocked && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export const LearnView: React.FC<LearnViewProps> = ({ initialConceptId }) => {
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(initialConceptId || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { getMastery, getConceptState } = useLearner();

  // Keyboard shortcut: Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSelectNode = useCallback((conceptId: string) => {
    setSelectedConceptId(conceptId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedConceptId(null);
  }, []);

  const handleOpenExploration = useCallback((explorationId: string) => {
    navigate(`/explore/${explorationId}`);
  }, []);

  const isUnlocked = useCallback((concept: ConceptNode): boolean => {
    if (concept.prerequisites.length === 0) return true;
    return concept.prerequisites.every(p => getMastery(p) >= MASTERY_THRESHOLD);
  }, [getMastery]);

  // Filter concepts by search
  const filteredTiers = useMemo(() => {
    const tiers = ([1, 2, 3, 4, 5] as Tier[]).map(tier => {
      const concepts = getConceptsByTier(tier);
      const filtered = searchTerm
        ? concepts.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.description.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : concepts;
      return { tier, concepts: filtered };
    });
    return tiers.filter(t => t.concepts.length > 0);
  }, [searchTerm]);

  // Stats
  const totalConcepts = Object.keys(curriculum).length;
  const masteredCount = Object.values(curriculum).filter(c => getMastery(c.id) >= MASTERY_THRESHOLD).length;
  const exploredCount = Object.values(curriculum).filter(c => {
    const state = getConceptState(c.id);
    return state.explored || state.attemptHistory.length > 0;
  }).length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-xl mx-auto px-6 pb-32 pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          {/* Stats */}
          <div className="flex items-end gap-8 mb-8">
            <div>
              <div className="text-4xl font-light text-white/80 tabular-nums tracking-tight">
                {masteredCount}
                <span className="text-white/15 text-2xl ml-1">/ {totalConcepts}</span>
              </div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-white/30 mt-1">
                mastered
              </div>
            </div>

            <div className="pb-1">
              <div className="text-lg font-light text-white/40 tabular-nums">
                {exploredCount}
              </div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-white/20 mt-1">
                explored
              </div>
            </div>
          </div>

          {/* Progress line */}
          <div className="h-px bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-her-cream/30 to-transparent"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max((masteredCount / totalConcepts) * 100, 1)}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          {/* Search */}
          <div className="mt-8">
            <div className={`relative transition-all duration-500 ${
              searchFocused ? 'opacity-100' : 'opacity-60 hover:opacity-80'
            }`}>
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search concepts..."
                className="w-full bg-transparent text-sm font-light text-white placeholder-white/20 outline-none border-b border-white/[0.06] focus:border-white/15 pb-2 transition-all duration-300"
              />
              {!searchTerm && !searchFocused && (
                <span className="absolute right-0 top-0 text-[10px] text-white/15 tracking-wider">
                  ⌘K
                </span>
              )}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-0 top-0 text-white/20 hover:text-white/50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tier sections */}
        {filteredTiers.map(({ tier, concepts }, tierIdx) => {
          const tierMastered = concepts.filter(c => getMastery(c.id) >= MASTERY_THRESHOLD).length;
          return (
            <motion.section
              key={tier}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: tierIdx * 0.1 }}
              className="mb-14"
            >
              {/* Tier header */}
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[10px] uppercase tracking-[0.25em] font-medium text-white/30">
                  {TIER_CONFIG[tier as Tier].label}
                </h2>
                <span className="text-[10px] text-white/15 tabular-nums tracking-wider">
                  {tierMastered}/{concepts.length}
                </span>
              </div>

              {/* Concept list */}
              <div>
                {concepts.map((concept, i) => (
                  <ConceptRow
                    key={concept.id}
                    concept={concept}
                    mastery={getMastery(concept.id)}
                    isUnlocked={isUnlocked(concept)}
                    onClick={() => handleSelectNode(concept.id)}
                    index={i}
                  />
                ))}
              </div>
            </motion.section>
          );
        })}

        {/* Empty state */}
        {filteredTiers.length === 0 && searchTerm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <p className="text-sm font-light text-white/25">
              No results for "{searchTerm}"
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/20 hover:text-white/50 transition-colors duration-300"
            >
              Clear search
            </button>
          </motion.div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedConceptId && (
          <NodeDetailModal
            conceptId={selectedConceptId}
            onClose={handleCloseDetail}
            onOpenExploration={handleOpenExploration}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
