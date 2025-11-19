import React, { useState } from 'react';
import type { TreeNode } from '../../types';
import { QuizComponent } from './Quiz';
import { generateInsight } from '../../services/gemini';

interface NodeDetailModalProps {
    node: TreeNode;
    isMastered: boolean;
    onClose: () => void;
    onMaster: (nodeId: string) => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({ node, isMastered, onClose, onMaster }) => {
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizResult, setQuizResult] = useState<boolean | null>(null);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    const handleQuizComplete = (correct: boolean) => {
        setQuizResult(correct);
        if (correct) {
            onMaster(node.id);
        }
    }

    const handleGenerateInsight = async () => {
        setIsLoadingAI(true);
        const insight = await generateInsight(node.name, node.description);
        setAiInsight(insight);
        setIsLoadingAI(false);
    };

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

                        {/* AI Insight Section */}
                        <div className="mt-6 border-t border-gray-700 pt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
                                    <span className="text-xl">✨</span> AI Insight
                                </h3>
                                {!aiInsight && !isLoadingAI && (
                                    <button
                                        onClick={handleGenerateInsight}
                                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-full transition-colors"
                                    >
                                        Generate
                                    </button>
                                )}
                            </div>

                            {isLoadingAI ? (
                                <div className="flex items-center gap-2 text-gray-400 animate-pulse">
                                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    Consulting the neural network...
                                </div>
                            ) : aiInsight ? (
                                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 text-gray-200 italic">
                                    "{aiInsight}"
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Get a unique, futuristic perspective on this concept powered by Gemini.</p>
                            )}
                        </div>

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
