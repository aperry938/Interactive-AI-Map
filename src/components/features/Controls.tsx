import React from 'react';

interface ControlsProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onResetView: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ searchTerm, onSearchChange, onResetView }) => (
    <div className="flex items-center gap-2">
        <div className="glass rounded-full px-3 py-1.5 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="text"
                placeholder="Search concepts..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-transparent text-white/80 placeholder-white/20 text-sm focus:outline-none w-44"
                aria-label="Search AI Concepts"
            />
        </div>
        <button
            onClick={onResetView}
            className="glass p-2 rounded-full text-white/30 hover:text-white/60 transition-colors"
            aria-label="Reset View"
            title="Reset View"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
            </svg>
        </button>
    </div>
);
