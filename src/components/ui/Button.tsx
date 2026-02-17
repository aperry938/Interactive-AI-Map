import React from 'react';
import type { Tier } from '../../types';
import { TIER_CONFIG } from '../../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  tier?: Tier;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  tier,
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const tierColor = tier ? TIER_CONFIG[tier].color : undefined;

  const baseClasses = `inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]}`;

  const variantClasses = {
    primary: `bg-white text-her-dark shadow-glow-white hover:shadow-lg active:scale-[0.98]`,
    secondary: `glass rounded-full text-her-dark dark:text-her-cream active:scale-[0.98]`,
    ghost: `text-her-dark/60 dark:text-her-cream/60 hover:bg-white/50 dark:hover:bg-white/10 rounded-full active:scale-[0.98]`,
  };

  const style = tierColor
    ? {
        backgroundColor: variant === 'primary' ? tierColor : undefined,
        borderColor: variant === 'secondary' ? tierColor : undefined,
        boxShadow: variant === 'primary' ? `0 0 15px ${tierColor}40` : undefined,
      }
    : undefined;

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} style={style} {...props}>
      {children}
    </button>
  );
};
