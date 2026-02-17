import React from 'react';

interface ProgressBarProps {
    progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => (
    <div className="w-full bg-white/[0.06] rounded-full h-1">
        <div
            className="bg-her-cream/30 h-1 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
        />
    </div>
);
