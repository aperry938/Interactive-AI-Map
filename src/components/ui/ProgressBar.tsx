import React from 'react';

interface ProgressBarProps {
    progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => (
    <div className="w-full bg-gray-700/50 rounded-full h-2.5 my-2">
        <div
            className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
        ></div>
    </div>
);
