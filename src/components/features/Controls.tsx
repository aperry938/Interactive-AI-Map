import React from 'react';

interface ControlsProps {
    onSearch: (term: string) => void;
    onReset: () => void;
    searchTerm: string;
}

export const Controls: React.FC<ControlsProps> = ({ onSearch, onReset, searchTerm }) => (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 p-2 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700">
        <input
            type="text"
            placeholder="Search concepts..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="bg-gray-700 text-white placeholder-gray-400 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-48"
            aria-label="Search AI Concepts"
        />
        <button
            onClick={onReset}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200"
            aria-label="Reset View"
            title="Reset View"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
            </svg>
        </button>
    </div>
);
