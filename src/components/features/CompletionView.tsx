import React from 'react';

interface CompletionViewProps {
    onReset: () => void;
}

export const CompletionView: React.FC<CompletionViewProps> = ({ onReset }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-md p-4">
            <div className="glass-panel p-10 rounded-2xl max-w-2xl w-full text-center border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                <div className="mb-6">
                    <div className="inline-block p-4 rounded-full bg-green-500/20 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500 mb-2">
                        Congratulations!
                    </h2>
                    <p className="text-xl text-gray-300">
                        You have mastered the entire AI Concept Map.
                    </p>
                </div>

                <div className="space-y-4 text-gray-400 mb-8">
                    <p>
                        You've explored the depths of Artificial Intelligence, from the core concepts to advanced applications.
                        This is a huge achievement in your learning journey.
                    </p>
                </div>

                <button
                    onClick={onReset}
                    className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 transition-all duration-300 hover:border-green-500 hover:text-green-400"
                >
                    Restart Journey
                </button>
            </div>
        </div>
    );
};
