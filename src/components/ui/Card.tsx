import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className = '',
  children,
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      className={`glass rounded-2xl p-4 ${hoverable ? 'spring-hover cursor-pointer hover:bg-white/[0.03]' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
};
