import React from 'react';

interface ProgressBarProps {
    progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => (
    <div className="w-full bg-her-dark/5 dark:bg-white/5 rounded-full h-1.5">
        <div
            className="bg-gradient-to-r from-her-red to-her-orange h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
        />
    </div>
);
