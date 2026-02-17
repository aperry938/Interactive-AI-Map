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
        <div role="group" aria-labelledby="quiz-question">
            <h3 id="quiz-question" className="font-light text-sm text-white/85 mb-3">{quiz.question}</h3>
            <div className="space-y-2" role="radiogroup" aria-label="Answer options">
                {quiz.options.map((option) => {
                    const isCorrect = option === quiz.correctAnswer;
                    const isSelected = option === selectedAnswer;

                    let classes = "w-full text-left p-3 rounded-lg border text-sm transition-all duration-200 ";
                    if (isSubmitted) {
                        if (isCorrect) {
                            classes += "border-her-cream/50 bg-her-cream/5 text-her-cream/70";
                        } else if (isSelected) {
                            classes += "border-white/20 bg-white/[0.03] text-white/40";
                        } else {
                            classes += "border-white/[0.06] text-white/30";
                        }
                    } else {
                        if (isSelected) {
                            classes += "border-white/20 bg-white/[0.06] text-white/80";
                        } else {
                            classes += "border-white/[0.06] text-white/50 hover:border-white/[0.12]";
                        }
                    }

                    return (
                        <button
                            key={option}
                            onClick={() => !isSubmitted && setSelectedAnswer(option)}
                            disabled={isSubmitted}
                            className={classes}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>

            {!isSubmitted && (
                <button
                    onClick={handleSubmit}
                    disabled={selectedAnswer === null}
                    className="mt-3 w-full py-2.5 px-4 bg-white/[0.10] border border-white/[0.10] text-white/80 text-sm font-light rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Submit Answer
                </button>
            )}

            {isSubmitted && quiz.explanation && (
                <div className="mt-3 p-3 glass rounded-2xl">
                    <p className="text-xs text-white/40 font-light leading-relaxed">
                        {quiz.explanation}
                    </p>
                </div>
            )}
        </div>
    );
};
