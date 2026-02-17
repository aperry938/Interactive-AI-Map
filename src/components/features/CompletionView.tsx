import React from 'react';
import { AmbientBackground } from '../ui/AmbientBackground';

interface CompletionViewProps {
    onReset: () => void;
}

export const CompletionView: React.FC<CompletionViewProps> = ({ onReset }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300">
            <AmbientBackground />
            <div className="relative z-10 glass-strong p-10 rounded-2xl max-w-lg w-full text-center">
                <div className="mb-6">
                    <div className="inline-block p-4 rounded-full bg-her-red/5 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-her-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl text-her-dark dark:text-her-cream font-light tracking-[0.05em] mb-2">
                        All Concepts Mastered
                    </h2>
                    <p className="font-serif text-her-dark/50 dark:text-her-cream/50 leading-relaxed">
                        You have explored and mastered every concept in the AI/ML map.
                    </p>
                </div>

                <div className="font-serif text-sm text-her-dark/50 dark:text-her-cream/50 mb-8 leading-relaxed">
                    <p>
                        From foundational machine learning to transformer architectures,
                        you have built a comprehensive understanding of modern AI.
                    </p>
                </div>

                <button
                    onClick={onReset}
                    className="px-6 py-2.5 bg-white dark:bg-white/15 text-her-dark dark:text-her-cream rounded-full font-medium hover:bg-white/80 dark:hover:bg-white/20 transition-all"
                >
                    Start Over
                </button>
            </div>
        </div>
    );
};
