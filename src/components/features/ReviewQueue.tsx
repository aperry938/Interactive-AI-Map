import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLearner } from '../../stores/learnerStore';
import { curriculum } from '../../data/curriculum';
import { getDueForReview } from '../../engine/spacedRepetition';
import { TIER_CONFIG } from '../../types/index';
import type { Tier } from '../../types/index';

interface ReviewQueueProps {
  onSelectConcept: (id: string) => void;
}

// Small circular mastery gauge
const MasteryGauge: React.FC<{ mastery: number }> = ({ mastery }) => {
  const pct = mastery;
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const color = pct >= 0.85 ? '#10B981' : pct >= 0.5 ? '#F59E0B' : '#3B82F6';

  return (
    <svg width={36} height={36} viewBox="0 0 36 36" className="shrink-0">
      <circle cx={18} cy={18} r={r} fill="none" stroke="rgba(44,26,26,0.06)" strokeWidth={3} />
      <motion.circle
        cx={18} cy={18} r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${circumference}` }}
        animate={{ strokeDasharray: `${circumference * pct} ${circumference * (1 - pct)}` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        transform="rotate(-90 18 18)"
      />
      <text x={18} y={18} textAnchor="middle" dominantBaseline="central" className="text-[8px] fill-her-dark/50 dark:fill-her-cream/50 font-medium">
        {Math.round(pct * 100)}
      </text>
    </svg>
  );
};

// Tier badge
const TierBadge: React.FC<{ tier: Tier }> = ({ tier }) => {
  const cfg = TIER_CONFIG[tier];
  return (
    <span
      className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
      style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
    >
      T{tier}
    </span>
  );
};

// Time-since-last-review helper
function timeSince(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface CardData {
  id: string;
  name: string;
  tier: Tier;
  mastery: number;
  nextReview: number;
  lastReviewTimestamp: number;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onSelectConcept }) => {
  const { profile, getMastery } = useLearner();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const cards: CardData[] = useMemo(() => {
    const dueIds = getDueForReview(profile.conceptStates);

    return dueIds
      .map(id => {
        const concept = curriculum[id];
        if (!concept) return null;
        const state = profile.conceptStates[id];
        const lastAttempt = state?.attemptHistory.length
          ? state.attemptHistory[state.attemptHistory.length - 1].timestamp
          : 0;
        return {
          id,
          name: concept.name,
          tier: concept.tier as Tier,
          mastery: getMastery(id),
          nextReview: state?.nextReviewTimestamp ?? 0,
          lastReviewTimestamp: lastAttempt,
        };
      })
      .filter((c): c is CardData => c !== null)
      .sort((a, b) => a.nextReview - b.nextReview);
  }, [profile.conceptStates, getMastery]);

  const visibleCards = cards.filter(c => !dismissedIds.has(c.id));

  const handleSelect = useCallback((id: string) => {
    // Animate dismissal, then navigate
    setDismissedIds(prev => new Set(prev).add(id));
    // Small delay to let the exit animation play
    setTimeout(() => onSelectConcept(id), 300);
  }, [onSelectConcept]);

  if (visibleCards.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-12 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-14 h-14 rounded-full bg-her-red/5 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-her-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-her-dark/80 dark:text-her-cream/80">All caught up!</p>
        <p className="text-xs text-her-dark/40 dark:text-her-cream/40 mt-1">No reviews due.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-her-dark/50 dark:text-her-cream/50 mb-3">
        Review Queue ({visibleCards.length})
      </h4>
      <AnimatePresence mode="popLayout">
        {visibleCards.map((card, i) => (
          <motion.button
            key={card.id}
            layout
            onClick={() => handleSelect(card.id)}
            className="w-full flex items-center gap-3 px-4 py-3 glass rounded-2xl hover:bg-white/60 dark:hover:bg-white/[0.08] transition-colors text-left group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300, scale: 0.95 }}
            transition={{
              layout: { type: 'spring', damping: 20, stiffness: 200 },
              opacity: { duration: 0.25 },
              x: { duration: 0.3, delay: i * 0.05 },
            }}
          >
            <MasteryGauge mastery={card.mastery} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-her-dark dark:text-her-cream truncate group-hover:text-her-dark dark:group-hover:text-white transition-colors">
                  {card.name}
                </span>
                <TierBadge tier={card.tier} />
              </div>
              {card.lastReviewTimestamp > 0 && (
                <span className="text-[11px] text-her-dark/30 dark:text-her-cream/30">
                  Last reviewed {timeSince(card.lastReviewTimestamp)}
                </span>
              )}
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-her-dark/20 dark:text-her-cream/20 group-hover:text-her-dark/40 dark:group-hover:text-her-cream/40 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ReviewQueue;
