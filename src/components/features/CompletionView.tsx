import React from 'react';
import { AmbientBackground } from '../ui/AmbientBackground';

interface CompletionViewProps {
    onReset: () => void;
}

export const CompletionView: React.FC<CompletionViewProps> = ({ onReset }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-300">
            <AmbientBackground />
            <div className="relative z-10 bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] p-10 rounded-2xl max-w-lg w-full text-center">
                <div className="mb-6">
                    <div className="inline-block p-4 rounded-full bg-white/[0.06] mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl text-white/85 font-light tracking-[0.05em] mb-2">
                        All Concepts Mastered
                    </h2>
                    <p className="text-white/40 font-light leading-relaxed">
                        You have explored and mastered every concept in the AI/ML map.
                    </p>
                </div>

                <div className="text-sm text-white/40 font-light mb-8 leading-relaxed">
                    <p>
                        From foundational machine learning to transformer architectures,
                        you have built a comprehensive understanding of modern AI.
                    </p>
                </div>

                <button
                    onClick={onReset}
                    className="px-6 py-2.5 bg-white/[0.10] border border-white/[0.10] text-white/80 rounded-full font-light hover:bg-white/[0.15] transition-all"
                >
                    Start Over
                </button>
            </div>
        </div>
    );
};
