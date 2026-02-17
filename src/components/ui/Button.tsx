import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
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

  const baseClasses = `inline-flex items-center justify-center gap-2 font-light rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]}`;

  const variantClasses = {
    primary: `bg-white/[0.10] border border-white/[0.10] text-white/80 hover:bg-white/[0.15] active:scale-[0.98]`,
    secondary: `bg-white/[0.05] border border-white/[0.08] text-white/60 hover:bg-white/[0.08] active:scale-[0.98]`,
    ghost: `text-white/50 hover:text-white/70 active:scale-[0.98]`,
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
