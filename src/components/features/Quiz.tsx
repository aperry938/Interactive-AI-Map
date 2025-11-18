import React, { useState } from 'react';
import type { Quiz } from '../../types';

interface QuizComponentProps {
    quiz: Quiz;
    onComplete: (correct: boolean) => void;
}

export const QuizComponent: React.FC<QuizComponentProps> = ({ quiz, onComplete }) => {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = () => {
        if (selectedAnswer === null) return;
        setIsSubmitted(true);
        onComplete(selectedAnswer === quiz.correctAnswer);
    };

    return (
        <div className="mt-6 border-t border-cyan-400/20 pt-4">
            <h3 className="font-semibold text-lg text-white mb-2">{quiz.question}</h3>
            <div className="space-y-2">
                {quiz.options.map((option) => {
                    const isCorrect = option === quiz.correctAnswer;
                    const isSelected = option === selectedAnswer;
                    let buttonClass = "w-full text-left p-3 rounded-lg border transition-all duration-200 ";
                    if (isSubmitted) {
                        if (isCorrect) {
                            buttonClass += "bg-green-500/30 border-green-400 text-white";
                        } else if (isSelected) {
                            buttonClass += "bg-red-500/30 border-red-400 text-white";
                        } else {
                            buttonClass += "bg-gray-700 border-gray-600 text-gray-400";
                        }
                    } else {
                        if (isSelected) {
                            buttonClass += "bg-cyan-500/30 border-cyan-400 text-white";
                        } else {
                            buttonClass += "bg-gray-700/50 border-gray-600 hover:bg-gray-700";
                        }
                    }
                    return (
                        <button key={option} onClick={() => !isSubmitted && setSelectedAnswer(option)} disabled={isSubmitted} className={buttonClass}>
                            {option}
                        </button>
                    )
                })}
            </div>
            {!isSubmitted && (
                <button onClick={handleSubmit} disabled={selectedAnswer === null} className="mt-4 w-full font-bold py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-gray-900 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                    Submit Answer
                </button>
            )}
        </div>
    );
};
