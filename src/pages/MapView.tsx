import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KnowledgeGraph } from '../components/features/KnowledgeGraph';
import { NodeDetailModal } from '../components/features/NodeDetailModal';
import { navigate } from '../router/AppRouter';
import { curriculum } from '../data/curriculum';
import { MASTERY_THRESHOLD } from '../types';
import { useLearner } from '../stores/learnerStore';
import { getDueForReview } from '../engine/spacedRepetition';
import { getRecommendedNext } from '../engine/recommender';

export const MapView: React.FC = () => {
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { getMastery, getConceptState, profile } = useLearner();

  // Keyboard shortcut: Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // Escape to close search
      if (e.key === 'Escape' && searchFocused) {
        searchRef.current?.blur();
        setSearchTerm('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchFocused]);

  const handleSelectNode = useCallback((conceptId: string) => {
    setSelectedConceptId(conceptId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedConceptId(null);
  }, []);

  const handleOpenExploration = useCallback((explorationId: string) => {
    navigate(`/explore/${explorationId}`);
  }, []);

  // Compute stats
  const allIds = Object.keys(curriculum);
  const totalConcepts = allIds.length;
  const masteredCount = allIds.filter(id => getMastery(id) >= MASTERY_THRESHOLD).length;
  const dueForReview = getDueForReview(profile.conceptStates).length;
  const recommended = getRecommendedNext(curriculum, profile.conceptStates);
  const exploredCount = allIds.filter(id => {
    const state = getConceptState(id);
    return state.explored || state.attemptHistory.length > 0;
  }).length;

  return (
    <div className="h-full relative overflow-hidden">
      {/* Full-screen knowledge graph */}
      <KnowledgeGraph
        searchTerm={searchTerm}
        onSelectNode={handleSelectNode}
        selectedNodeId={selectedConceptId}
        hideOverlays
      />

      {/* Floating search bar — top left */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="absolute top-4 left-4 z-20"
      >
        <div className={`glass rounded-full px-4 py-2.5 flex items-center gap-3 transition-all duration-300 ${
          searchFocused ? 'w-72 border-white/15' : 'w-56'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white/25 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search concepts..."
            className="bg-transparent text-sm font-light text-white placeholder-white/20 outline-none flex-1 w-full"
            aria-label="Search concepts"
          />
          {!searchTerm && !searchFocused && (
            <span className="text-[9px] text-white/15 tracking-wider flex-shrink-0">⌘K</span>
          )}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </motion.div>

      {/* Floating view toggle — top right */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="absolute top-4 right-4 z-20"
      >
        <button
          onClick={() => navigate('/learn')}
          className="glass rounded-full px-4 py-2.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-all duration-300 hover:border-white/15"
          aria-label="Switch to list view"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          List
        </button>
      </motion.div>

      {/* Floating stats panel — bottom right */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="absolute bottom-6 right-4 z-20"
      >
        <div className="glass rounded-2xl px-5 py-4 space-y-3 min-w-[160px]">
          <div className="flex items-center justify-between gap-6">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/25">Mastered</span>
            <span className="text-sm font-light text-white/70 tabular-nums">
              {masteredCount}<span className="text-white/20">/{totalConcepts}</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/25">Explored</span>
            <span className="text-sm font-light text-white/40 tabular-nums">{exploredCount}</span>
          </div>
          {dueForReview > 0 && (
            <div className="flex items-center justify-between gap-6">
              <span className="text-[9px] uppercase tracking-[0.2em] text-her-orange/40">Due</span>
              <button
                onClick={() => navigate('/review')}
                className="text-sm font-light text-her-orange/50 hover:text-her-orange/80 tabular-nums transition-colors"
              >
                {dueForReview}
              </button>
            </div>
          )}
          {/* Progress bar */}
          <div className="h-px bg-white/[0.06] overflow-hidden mt-1">
            <div
              className="h-full bg-gradient-to-r from-her-cream/30 to-transparent transition-all duration-1000"
              style={{ width: `${Math.max((masteredCount / totalConcepts) * 100, 2)}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Floating recommended next — bottom left */}
      {recommended.length > 0 && !selectedConceptId && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="absolute bottom-6 left-4 z-20 max-w-[240px]"
        >
          <div className="glass rounded-2xl px-5 py-4">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/25 block mb-3">Recommended</span>
            <div className="space-y-2">
              {recommended.slice(0, 3).map(id => {
                const concept = curriculum[id];
                if (!concept) return null;
                return (
                  <button
                    key={id}
                    onClick={() => handleSelectNode(id)}
                    className="group w-full text-left flex items-center gap-2 py-1 transition-all duration-300"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-her-cream/30 flex-shrink-0" />
                    <span className="text-xs font-light text-white/40 group-hover:text-white/70 transition-colors truncate">
                      {concept.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

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
