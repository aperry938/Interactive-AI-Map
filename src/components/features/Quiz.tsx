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
            <h3 id="quiz-question" className="font-medium text-sm text-her-dark dark:text-her-cream mb-3">{quiz.question}</h3>
            <div className="space-y-2" role="radiogroup" aria-label="Answer options">
                {quiz.options.map((option) => {
                    const isCorrect = option === quiz.correctAnswer;
                    const isSelected = option === selectedAnswer;

                    let classes = "w-full text-left p-3 rounded-lg border text-sm transition-all duration-200 ";
                    if (isSubmitted) {
                        if (isCorrect) {
                            classes += "border-emerald-500/50 bg-emerald-500/5 text-emerald-500";
                        } else if (isSelected) {
                            classes += "border-red-500/50 bg-red-500/5 text-red-500";
                        } else {
                            classes += "border-her-dark/10 dark:border-white/10 text-her-dark/40 dark:text-her-cream/40";
                        }
                    } else {
                        if (isSelected) {
                            classes += "border-her-red/50 bg-her-red/5 text-her-dark dark:text-her-cream";
                        } else {
                            classes += "border-her-dark/10 dark:border-white/10 text-her-dark/70 dark:text-her-cream/70 hover:border-her-dark/20 dark:hover:border-white/20";
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
                    className="mt-3 w-full py-2.5 px-4 bg-white dark:bg-white/15 text-her-dark dark:text-her-cream text-sm font-medium rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Submit Answer
                </button>
            )}

            {isSubmitted && quiz.explanation && (
                <div className="mt-3 p-3 glass rounded-2xl">
                    <p className="font-serif text-xs text-her-dark/60 dark:text-her-cream/60 leading-relaxed">
                        {quiz.explanation}
                    </p>
                </div>
            )}
        </div>
    );
};
