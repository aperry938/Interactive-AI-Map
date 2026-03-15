import React, { useMemo } from 'react';
import type { Tier } from '../../types';

interface ForgettingCurveChartProps {
  currentMastery: number;
  daysSinceReview: number;
  tier: Tier;
  width?: number;
  height?: number;
}

/**
 * SVG visualization of Ebbinghaus forgetting curve for a concept.
 * Shows exponential decay from current mastery, with the learner's
 * current position marked on the curve.
 */
export const ForgettingCurveChart: React.FC<ForgettingCurveChartProps> = ({
  currentMastery,
  daysSinceReview,
  tier,
  width = 280,
  height = 120,
}) => {
  const padding = { top: 12, right: 16, bottom: 24, left: 36 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const halfLife = Math.max(3, 14 - (tier - 1) * 2);
  const maxDays = halfLife * 4;
  const pInit = 0.1;

  const curvePoints = useMemo(() => {
    const points: string[] = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const days = (i / steps) * maxDays;
      const retention = Math.pow(0.5, days / halfLife);
      const mastery = pInit + (currentMastery - pInit) * retention;
      const x = padding.left + (days / maxDays) * chartW;
      const y = padding.top + (1 - mastery) * chartH;
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }, [currentMastery, halfLife, maxDays, chartW, chartH]);

  // Current position on curve
  const clampedDays = Math.min(daysSinceReview, maxDays);
  const currentRetention = Math.pow(0.5, clampedDays / halfLife);
  const currentY = pInit + (currentMastery - pInit) * currentRetention;
  const dotX = padding.left + (clampedDays / maxDays) * chartW;
  const dotY = padding.top + (1 - currentY) * chartH;

  // Mastery threshold line at 0.85
  const thresholdY = padding.top + (1 - 0.85) * chartH;

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <svg width={width} height={height} className="block" role="img" aria-label={`Forgetting curve: half-life ${halfLife} days, current mastery ${Math.round(currentMastery * 100)}%`}>
      {/* Grid lines */}
      {yLabels.map(v => {
        const y = padding.top + (1 - v) * chartH;
        return (
          <g key={v}>
            <line
              x1={padding.left} y1={y} x2={width - padding.right} y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth={0.5}
            />
            <text x={padding.left - 6} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize={8} fontFamily="Inter">
              {Math.round(v * 100)}
            </text>
          </g>
        );
      })}

      {/* Mastery threshold */}
      <line
        x1={padding.left} y1={thresholdY} x2={width - padding.right} y2={thresholdY}
        stroke="rgba(242,232,220,0.15)" strokeWidth={0.5} strokeDasharray="3,3"
      />
      <text x={width - padding.right + 2} y={thresholdY + 3} fill="rgba(242,232,220,0.25)" fontSize={7} fontFamily="Inter">
        85%
      </text>

      {/* Curve */}
      <polyline
        points={curvePoints}
        fill="none"
        stroke="rgba(242,232,220,0.35)"
        strokeWidth={1.5}
      />

      {/* Current position dot */}
      <circle cx={dotX} cy={dotY} r={3.5} fill="rgba(242,232,220,0.6)" />
      <circle cx={dotX} cy={dotY} r={6} fill="none" stroke="rgba(242,232,220,0.2)" strokeWidth={0.5} />

      {/* X-axis label */}
      <text x={padding.left + chartW / 2} y={height - 4} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={8} fontFamily="Inter">
        days since review (half-life: {halfLife}d)
      </text>

      {/* Half-life marker */}
      {(() => {
        const hlX = padding.left + (halfLife / maxDays) * chartW;
        return (
          <line
            x1={hlX} y1={padding.top} x2={hlX} y2={padding.top + chartH}
            stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} strokeDasharray="2,2"
          />
        );
      })()}
    </svg>
  );
};
