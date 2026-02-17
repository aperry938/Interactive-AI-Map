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
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] font-light rounded-full bg-white/[0.06] text-white/50 ${className}`}
      >
        T{tier} {config.label}
      </span>
    );
  }

  if (variant === 'mastery' && mastery !== undefined) {
    const pct = Math.round(mastery * 100);
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] font-light rounded-full bg-white/[0.06] text-white/40 ${className}`}
      >
        {pct}%
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] font-light rounded-full bg-white/[0.06] text-white/50 ${className}`}
    >
      {label}
    </span>
  );
};
