import React from 'react';
import type { Tier } from '../../types';
import { TIER_CONFIG } from '../../types';

interface BadgeProps {
  tier?: Tier;
  label?: string;
  variant?: 'tier' | 'mastery' | 'status';
  mastery?: number;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  tier,
  label,
  variant = 'tier',
  mastery,
  className = '',
}) => {
  if (variant === 'tier' && tier) {
    const config = TIER_CONFIG[tier];
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full ${className}`}
        style={{ backgroundColor: config.color + '15', color: config.color }}
      >
        T{tier} {config.label}
      </span>
    );
  }

  if (variant === 'mastery' && mastery !== undefined) {
    const pct = Math.round(mastery * 100);
    const color =
      pct >= 85 ? '#10B981' : pct >= 50 ? '#F59E0B' : pct >= 20 ? '#3B82F6' : '#64748B';
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full ${className}`}
        style={{ backgroundColor: `${color}20`, color }}
      >
        {pct}%
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium rounded-full bg-her-dark/5 dark:bg-white/5 text-her-dark/60 dark:text-her-cream/60 ${className}`}
    >
      {label}
    </span>
  );
};
