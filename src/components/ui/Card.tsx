import React from 'react';
import type { Tier } from '../../types';
import { TIER_CONFIG } from '../../types';

interface CardProps {
  tier?: Tier;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  tier,
  className = '',
  children,
  onClick,
  hoverable = false,
}) => {
  const tierColor = tier ? TIER_CONFIG[tier].color : undefined;

  return (
    <div
      className={`glass rounded-2xl p-4 ${hoverable ? 'spring-hover cursor-pointer' : ''} ${className}`}
      style={{ boxShadow: tierColor ? `inset 3px 0 0 ${tierColor}` : undefined }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
};
