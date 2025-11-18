import React, { useState } from 'react';
import type { TreeNode } from '../../types';
import { QuizComponent } from './Quiz';

interface NodeDetailModalProps {
    node: TreeNode;
    isMastered: boolean;
    onClose: () => void;
    onMaster: (nodeId: string) => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({ node, isMastered, onClose, onMaster }) => {
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizResult, setQuizResult] = useState<boolean | null>(null);

    const handleQuizComplete = (correct: boolean) => {
        setQuizResult(correct);
        if (correct) {
            onMaster(node.id);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center" onClick={onClose}>
            <div
                className="w-full max-w-2xl bg-gray-800/80 border border-gray-700 rounded-xl shadow-2xl m-4 transform transition-all duration-300 ease-in-out"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-cyan-400 pr-4 glow-text">{node.name}</h2>
                        <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full" aria-label="Close Panel">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="mt-4 text-gray-300">
                        <p className="whitespace-pre-wrap">{node.description || "No description available."}</p>
                        {node.link && (
                            <a href={node.link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-cyan-400 hover:text-cyan-300 hover:underline">
                                Learn More &rarr;
                            </a>
                        )}
                        {isMastered ? (
                            <div className="mt-6 p-3 rounded-lg bg-green-500/20 text-green-300 border border-green-400/50 text-center font-semibold">
                                ✨ Concept Mastered! ✨
                            </div>
                        ) : showQuiz ? (
                            <QuizComponent quiz={node.quiz!} onComplete={handleQuizComplete} />
                        ) : node.quiz ? (
                            <button onClick={() => setShowQuiz(true)} className="mt-6 w-full font-bold py-2 px-4 rounded-lg bg-purple-500 hover:bg-purple-400 text-white transition-colors">
                                Test Your Knowledge
                            </button>
                        ) : null}

                        {quizResult !== null && !quizResult && (
                            <p className="text-red-400 text-center mt-4">Not quite! Review the material and try again later.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
