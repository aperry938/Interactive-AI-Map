import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLearner } from '../../stores/learnerStore';
import { curriculum, getConceptsByTier } from '../../data/curriculum';
import { getDueForReview } from '../../engine/spacedRepetition';
import type { Tier, ConceptNode } from '../../types/index';
import { TIER_CONFIG, MASTERY_THRESHOLD } from '../../types/index';

interface ProgressDashboardProps {
  onClose?: () => void;
  fullPage?: boolean;
}

// ============================================================================
// Mastery Bar Chart
// ============================================================================

const MasteryBarChart: React.FC<{ conceptsByTier: Record<number, ConceptNode[]>; getMastery: (id: string) => number }> = ({ conceptsByTier, getMastery }) => (
  <div className="space-y-6">
    {([1, 2, 3, 4, 5] as Tier[]).map(tier => {
      const concepts = conceptsByTier[tier] || [];
      if (concepts.length === 0) return null;
      const cfg = TIER_CONFIG[tier];
      return (
        <div key={tier}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: cfg.color }}>
            T{tier} &mdash; {cfg.label}
          </h4>
          <div className="space-y-1.5">
            {concepts.map((c, idx) => {
              const m = getMastery(c.id);
              const pct = Math.round(m * 100);
              const barColor = pct >= 85 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#3B82F6';
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="text-xs text-her-dark/50 dark:text-her-cream/50 w-32 truncate shrink-0" title={c.name}>{c.name}</span>
                  <div className="flex-1 h-3 bg-her-dark/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: barColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.03, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-xs text-her-dark/50 dark:text-her-cream/50 w-9 text-right shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    })}
  </div>
);

// ============================================================================
// Activity Heatmap (GitHub-style, 30 days)
// ============================================================================

const ActivityHeatmap: React.FC<{ sessionHistory: { date: string; quizzesAttempted: number }[] }> = ({ sessionHistory }) => {
  const { cells, maxCount } = useMemo(() => {
    const countByDate: Record<string, number> = {};
    for (const s of sessionHistory) {
      countByDate[s.date] = (countByDate[s.date] || 0) + s.quizzesAttempted;
    }

    const today = new Date();
    const days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, count: countByDate[key] || 0 });
    }
    const mx = Math.max(1, ...days.map(d => d.count));
    return { cells: days, maxCount: mx };
  }, [sessionHistory]);

  const cols = Math.ceil(cells.length / 7);

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-her-dark/50 dark:text-her-cream/50 mb-2">Activity (30 days)</h4>
      <div
        className="inline-grid gap-1"
        style={{
          gridTemplateRows: `repeat(7, 14px)`,
          gridTemplateColumns: `repeat(${cols}, 14px)`,
          gridAutoFlow: 'column',
        }}
      >
        {cells.map((cell, i) => {
          const intensity = cell.count / maxCount;
          const bg = cell.count === 0
            ? 'rgba(44,26,26,0.04)'
            : `rgba(16, 185, 129, ${0.2 + intensity * 0.8})`;
          return (
            <motion.div
              key={cell.date}
              className="rounded-sm dark:![background-color:rgba(255,255,255,0.04)]"
              style={{ width: 14, height: 14, backgroundColor: bg }}
              title={`${cell.date}: ${cell.count} quiz${cell.count !== 1 ? 'zes' : ''}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.015 }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// Tier Progress Rings (SVG concentric circles with Framer Motion)
// ============================================================================

const TierProgressRings: React.FC<{ conceptsByTier: Record<number, ConceptNode[]>; getMastery: (id: string) => number }> = ({ conceptsByTier, getMastery }) => {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;

  const rings = ([1, 2, 3, 4, 5] as Tier[]).map((tier, i) => {
    const concepts = conceptsByTier[tier] || [];
    const mastered = concepts.filter(c => getMastery(c.id) >= MASTERY_THRESHOLD).length;
    const pct = concepts.length > 0 ? mastered / concepts.length : 0;
    const radius = 25 + i * 17;
    const circumference = 2 * Math.PI * radius;
    const cfg = TIER_CONFIG[tier];
    return { tier, radius, circumference, pct, color: cfg.color, label: cfg.label, mastered, total: concepts.length };
  });

  return (
    <div className="flex flex-col items-center">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-her-dark/50 dark:text-her-cream/50 mb-3">Tier Mastery</h4>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((r, i) => (
          <g key={r.tier}>
            {/* background track */}
            <circle cx={cx} cy={cy} r={r.radius} fill="none" stroke="rgba(44,26,26,0.06)" strokeWidth={8} className="dark:!stroke-[rgba(255,255,255,0.06)]" />
            {/* animated progress arc */}
            <motion.circle
              cx={cx} cy={cy} r={r.radius}
              fill="none"
              stroke={r.color}
              strokeWidth={8}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${r.circumference}` }}
              animate={{
                strokeDasharray: `${r.circumference * r.pct} ${r.circumference * (1 - r.pct)}`,
              }}
              transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
              transform={`rotate(-90 ${cx} ${cy})`}
              opacity={r.pct > 0 ? 1 : 0.15}
            />
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {rings.map(r => (
          <span key={r.tier} className="text-[10px] flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
            <span className="text-her-dark/40 dark:text-her-cream/40">{r.label}</span>
            <span className="text-her-dark/30 dark:text-her-cream/30">{r.mastered}/{r.total}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Strengths & Needs Review Lists
// ============================================================================

const ConceptList: React.FC<{ title: string; items: { name: string; mastery: number }[]; variant: 'strengths' | 'review' }> = ({ title, items, variant }) => {
  if (items.length === 0) return null;
  const badgeClass = variant === 'strengths'
    ? 'bg-emerald-500/20 text-emerald-400'
    : 'bg-amber-500/20 text-amber-400';

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-her-dark/50 dark:text-her-cream/50 mb-2">{title}</h4>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <motion.div
            key={item.name}
            className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-her-dark/[0.03] dark:bg-white/[0.03]"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <span className="text-sm text-her-dark/80 dark:text-her-cream/80">{item.name}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
              {Math.round(item.mastery * 100)}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Session Stats
// ============================================================================

interface SessionStatsProfile {
  conceptStates: Record<string, { explored: boolean; attemptHistory: { correct: boolean }[] }>;
  sessionHistory: { conceptsStudied: string[] }[];
}

const SessionStats: React.FC<{ currentSessionStart: number; profile: SessionStatsProfile }> = ({ currentSessionStart, profile }) => {
  const durationMin = Math.max(0, Math.round((Date.now() - currentSessionStart) / 60000));
  const hours = Math.floor(durationMin / 60);
  const mins = durationMin % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  let totalAttempts = 0;
  let totalCorrect = 0;
  const states = Object.values(profile.conceptStates) as { explored: boolean; attemptHistory: { correct: boolean }[] }[];
  for (const state of states) {
    for (const a of state.attemptHistory) {
      totalAttempts++;
      if (a.correct) totalCorrect++;
    }
  }
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  // Learning velocity: avg concepts studied per session
  const sessionCount = profile.sessionHistory.length;
  const totalConceptsStudied = profile.sessionHistory.reduce(
    (sum, s) => sum + s.conceptsStudied.length, 0
  );
  const velocity = sessionCount > 0
    ? (totalConceptsStudied / sessionCount).toFixed(1)
    : '0';

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-her-dark/50 dark:text-her-cream/50 mb-2">Session Stats</h4>
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="Duration" value={durationStr} />
        <StatBox label="Accuracy" value={`${accuracy}%`} />
        <StatBox label="Velocity" value={`${velocity}/s`} subtitle="concepts/session" />
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: string; subtitle?: string }> = ({ label, value, subtitle }) => (
  <motion.div
    className="px-3 py-2.5 glass rounded-2xl text-center"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <div className="text-lg font-semibold text-her-dark dark:text-her-cream">{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-her-dark/40 dark:text-her-cream/40">{label}</div>
    {subtitle && <div className="text-[9px] text-her-dark/30 dark:text-her-cream/30">{subtitle}</div>}
  </motion.div>
);

// ============================================================================
// Main Dashboard Component
// ============================================================================

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ onClose, fullPage = false }) => {
  const { profile, getMastery } = useLearner();

  const conceptsByTier = useMemo(() => {
    const result: Record<number, ConceptNode[]> = {};
    for (let t = 1; t <= 5; t++) {
      result[t] = getConceptsByTier(t);
    }
    return result;
  }, []);

  const strengths = useMemo(() => {
    const all = Object.values(curriculum)
      .map(c => ({ name: c.name, mastery: getMastery(c.id) }))
      .filter(c => c.mastery > 0.1)
      .sort((a, b) => b.mastery - a.mastery)
      .slice(0, 5);
    return all;
  }, [getMastery]);

  const needsReview = useMemo(() => {
    const dueIds = getDueForReview(profile.conceptStates);
    const sorted = dueIds
      .map(id => ({
        id,
        name: curriculum[id]?.name ?? id,
        mastery: getMastery(id),
        nextReview: profile.conceptStates[id]?.nextReviewTimestamp ?? 0,
      }))
      .sort((a, b) => a.nextReview - b.nextReview);
    return sorted.map(s => ({ name: s.name, mastery: s.mastery }));
  }, [profile.conceptStates, getMastery]);

  const content = (
    <motion.div
      className="space-y-8 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg text-her-dark dark:text-her-cream font-light tracking-[0.05em]">Progress Dashboard</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-her-dark/40 dark:text-her-cream/40 hover:text-her-red rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Session Stats */}
      <SessionStats currentSessionStart={profile.currentSessionStart} profile={profile} />

      {/* Tier Progress Rings */}
      <TierProgressRings conceptsByTier={conceptsByTier} getMastery={getMastery} />

      {/* Activity Heatmap */}
      <ActivityHeatmap sessionHistory={profile.sessionHistory} />

      {/* Mastery Bar Chart */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-her-dark/50 dark:text-her-cream/50 mb-3">Concept Mastery</h4>
        <MasteryBarChart conceptsByTier={conceptsByTier} getMastery={getMastery} />
      </div>

      {/* Strengths */}
      <ConceptList title="Strengths" items={strengths} variant="strengths" />

      {/* Needs Review */}
      <ConceptList title="Needs Review" items={needsReview} variant="review" />
    </motion.div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen overflow-y-auto">
        <div className="max-w-2xl mx-auto py-8">
          {content}
        </div>
      </div>
    );
  }

  // Slide-in panel mode
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <motion.div
        className="h-full w-full max-w-md glass-strong border-l border-white/[0.06] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {content}
      </motion.div>
    </div>
  );
};

export default ProgressDashboard;
