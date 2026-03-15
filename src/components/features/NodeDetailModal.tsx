import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Tier, Difficulty } from '../../types';
import { TIER_CONFIG, MASTERY_THRESHOLD } from '../../types';
import { curriculum } from '../../data/curriculum';
import { CodeBlock } from '../ui/CodeBlock';
import { useLearner } from '../../stores/learnerStore';
import { updateMastery, isMastered, getDefaultParams, applyForgetting, computeTransferBoosts } from '../../engine/bkt';
import { selectDifficulty } from '../../engine/difficultyAdjuster';
import { computeNextReview } from '../../engine/spacedRepetition';
import { DEFAULT_BKT_PARAMS } from '../../types';
import { ForgettingCurveChart } from './ForgettingCurveChart';
import { generateInsight } from '../../services/gemini';
import { createTelemetryEvent } from '../../services/telemetry';
import { useToast } from '../../hooks/useToast';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface NodeDetailModalProps {
  conceptId: string;
  onClose: () => void;
  onOpenExploration?: (explorationId: string) => void;
}

const AccordionSection: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border-t border-white/[0.04]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-left group"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 transition-colors">
          {title}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3 w-3 text-white/15 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        ref={contentRef}
        className="accordion-content"
        style={{
          maxHeight: isOpen ? `${contentRef.current?.scrollHeight || 1000}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="pb-4">{children}</div>
      </div>
    </div>
  );
};

const MathDisplay: React.FC<{ latex: string }> = ({ latex }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(latex, ref.current, { displayMode: true, throwOnError: false });
      } catch {
        if (ref.current) ref.current.textContent = latex;
      }
    }
  }, [latex]);
  return <div ref={ref} className="my-3" />;
};

const MasteryGauge: React.FC<{ mastery: number }> = ({ mastery }) => {
  const pct = Math.round(mastery * 100);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (mastery * circumference);

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle
          cx="40" cy="40" r="36" fill="none"
          stroke="rgba(242,232,220,0.40)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-light text-white/50">{pct}%</span>
      </div>
    </div>
  );
};

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  conceptId,
  onClose,
  onOpenExploration,
}) => {
  const concept = curriculum[conceptId];
  const { getMastery, getConceptState, recordAttempt, updateMastery: setMastery, setNextReview, markExplored, logTelemetryEvent } = useLearner();
  const toast = useToast();
  const addToast = toast.addToast;
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(1);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [orderingItems, setOrderingItems] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [consecutiveIncorrect, setConsecutiveIncorrect] = useState(0);
  const [orderingAnnouncement, setOrderingAnnouncement] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const mastery = getMastery(conceptId);
  const conceptState = getConceptState(conceptId);
  const mastered = isMastered(mastery);

  // Focus trap
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    const timer = setTimeout(() => {
      const closeBtn = modalRef.current?.querySelector<HTMLElement>('[aria-label="Close Panel"]');
      closeBtn?.focus();
    }, 50);
    return () => {
      clearTimeout(timer);
      previousFocusRef.current?.focus();
    };
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, input, a, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onClose]);

  useEffect(() => {
    if (!concept) return;
    markExplored(conceptId);
    logTelemetryEvent(createTelemetryEvent('concept_open', { conceptId, tier: concept.tier }));
    const recommended = selectDifficulty(mastery, conceptState.attemptHistory);
    setSelectedDifficulty(recommended);
  }, [conceptId]);

  // Get quizzes for selected difficulty
  const availableQuizzes = concept ? concept.quizzes.filter(q => q.difficulty === selectedDifficulty) : [];
  const currentQuiz = availableQuizzes[quizIndex % Math.max(1, availableQuizzes.length)] ?? null;

  // Initialize ordering items when quiz changes
  useEffect(() => {
    if (currentQuiz?.type === 'ordering' && Array.isArray(currentQuiz.correctAnswer)) {
      const shuffled = [...currentQuiz.correctAnswer].sort(() => Math.random() - 0.5);
      setOrderingItems(shuffled);
    }
  }, [currentQuiz?.id]);

  if (!concept) return null;

  const isQuizAnswered = (): boolean => {
    if (!currentQuiz) return false;
    if (currentQuiz.type === 'multiple-choice') return selectedAnswer !== null;
    if (currentQuiz.type === 'fill-blank') return fillBlankAnswer.trim().length > 0;
    if (currentQuiz.type === 'ordering') return orderingItems.length > 0;
    return false;
  };

  const isQuizCorrect = (): boolean => {
    if (!currentQuiz) return false;
    if (currentQuiz.type === 'multiple-choice') return selectedAnswer === currentQuiz.correctAnswer;
    if (currentQuiz.type === 'fill-blank') {
      const userAnswer = fillBlankAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
      const correct = (currentQuiz.correctAnswer as string).toLowerCase().replace(/\s+/g, ' ');
      return userAnswer === correct;
    }
    if (currentQuiz.type === 'ordering' && Array.isArray(currentQuiz.correctAnswer)) {
      return JSON.stringify(orderingItems) === JSON.stringify(currentQuiz.correctAnswer);
    }
    return false;
  };

  const handleQuizSubmit = () => {
    if (!currentQuiz || !isQuizAnswered()) return;
    const correct = isQuizCorrect();
    setQuizSubmitted(true);

    if (correct) {
      setConsecutiveIncorrect(0);
    } else {
      setConsecutiveIncorrect(prev => prev + 1);
    }

    recordAttempt(conceptId, correct, selectedDifficulty, hintsRevealed);

    const hintPenalty = Math.pow(0.5, hintsRevealed);
    const effectiveCorrect = correct && hintPenalty > 0.5;
    const newMastery = updateMastery(mastery, effectiveCorrect, DEFAULT_BKT_PARAMS);
    setMastery(conceptId, newMastery);

    logTelemetryEvent(createTelemetryEvent('quiz_attempt', { conceptId, difficulty: selectedDifficulty, correct, hintsUsed: hintsRevealed, masteryBefore: mastery, masteryAfter: newMastery }));

    if (newMastery >= MASTERY_THRESHOLD && mastery < MASTERY_THRESHOLD) {
      const tier = concept.tier as number;
      if (tier >= 5) {
        addToast(`Remarkable achievement! You've mastered: ${concept.name}!`, 'success');
      } else if (tier >= 3) {
        addToast(`Impressive! You've mastered: ${concept.name}!`, 'success');
      } else {
        addToast(`Mastered: ${concept.name}!`, 'success');
      }

      // Apply knowledge transfer boosts to connected, unattempted concepts
      const boosts = computeTransferBoosts(conceptId, curriculum, conceptState ? { ...Object.fromEntries(Object.entries(curriculum).map(([id]) => [id, getConceptState(id)])) } : {});
      for (const [boostId, boostedValue] of Object.entries(boosts)) {
        setMastery(boostId, boostedValue);
      }
    }

    if (correct) {
      const newStreak = conceptState.consecutiveCorrect + 1;
      if (newStreak === 5) {
        addToast('5 correct streak! Outstanding!', 'success');
      } else if (newStreak === 3) {
        addToast("3 in a row! You're building mastery!", 'success');
      } else {
        addToast('Nice work!', 'success');
      }
    }

    const nextReview = computeNextReview(
      newMastery,
      effectiveCorrect ? conceptState.consecutiveCorrect + 1 : 0,
      Date.now()
    );
    setNextReview(conceptId, nextReview);
  };

  const handleNextQuiz = () => {
    setQuizIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setFillBlankAnswer('');
    setOrderingItems([]);
    setDragIdx(null);
    setQuizSubmitted(false);
    setHintsRevealed(0);
  };

  const handleOrderingDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleOrderingDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newItems = [...orderingItems];
    const [removed] = newItems.splice(dragIdx, 1);
    newItems.splice(idx, 0, removed);
    setOrderingItems(newItems);
    setDragIdx(idx);
  };

  const handleOrderingKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (quizSubmitted) return;
    if (e.key === 'ArrowUp' && idx > 0) {
      e.preventDefault();
      const newItems = [...orderingItems];
      [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
      setOrderingItems(newItems);
      setOrderingAnnouncement(`${newItems[idx - 1]} moved to position ${idx}. Now at position ${idx} of ${newItems.length}.`);
      requestAnimationFrame(() => {
        const container = modalRef.current?.querySelector('[role="listbox"]');
        const items = container?.querySelectorAll<HTMLElement>('[role="option"]');
        items?.[idx - 1]?.focus();
      });
    } else if (e.key === 'ArrowDown' && idx < orderingItems.length - 1) {
      e.preventDefault();
      const newItems = [...orderingItems];
      [newItems[idx], newItems[idx + 1]] = [newItems[idx + 1], newItems[idx]];
      setOrderingItems(newItems);
      setOrderingAnnouncement(`${newItems[idx + 1]} moved to position ${idx + 2}. Now at position ${idx + 2} of ${newItems.length}.`);
      requestAnimationFrame(() => {
        const container = modalRef.current?.querySelector('[role="listbox"]');
        const items = container?.querySelectorAll<HTMLElement>('[role="option"]');
        items?.[idx + 1]?.focus();
      });
    }
  };

  const lastAttempt = conceptState.attemptHistory.length > 0
    ? conceptState.attemptHistory[conceptState.attemptHistory.length - 1]
    : null;
  const timeSinceReview = lastAttempt
    ? Math.round((Date.now() - lastAttempt.timestamp) / (1000 * 60 * 60 * 24))
    : null;

  const prereqs = concept.prerequisites.map(id => curriculum[id]).filter(Boolean);

  const tierLabel = TIER_CONFIG[concept.tier as Tier].label;

  const handleGenerateInsight = async () => {
    setIsLoadingAI(true);
    const insight = await generateInsight(concept.name, concept.description);
    setAiInsight(insight);
    setIsLoadingAI(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 flex items-start justify-end" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="node-detail-title">
      <div
        ref={modalRef}
        className="h-full w-full max-w-md bg-[#0A0707]/95 backdrop-blur-xl border-l border-white/[0.06] rounded-l-2xl overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                  T{concept.tier} &mdash; {tierLabel} &mdash; {concept.bloomLevel}
                </span>
                {mastered && (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                    Mastered
                  </span>
                )}
              </div>
              <h2 id="node-detail-title" className="text-xl font-light text-white/85 tracking-wide">
                {concept.name}
              </h2>
              {timeSinceReview !== null && (
                <p className="text-xs text-white/30 mt-1">
                  Last reviewed {timeSinceReview === 0 ? 'today' : `${timeSinceReview} day${timeSinceReview !== 1 ? 's' : ''} ago`}
                </p>
              )}
              {timeSinceReview === null && (
                <p className="text-xs text-white/30 mt-1">Never reviewed</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 text-white/25 hover:text-white/60 rounded transition-colors ml-2 shrink-0"
              aria-label="Close Panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <MasteryGauge mastery={mastery} />

          <p className="text-sm text-white/50 font-light leading-relaxed mt-4 mb-4">
            {concept.description}
          </p>

          {prereqs.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1.5">Prerequisites</p>
              <div className="flex flex-wrap gap-1.5">
                {prereqs.map(p => (
                  <span
                    key={p.id}
                    className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40"
                  >
                    {p.name} {getMastery(p.id) >= MASTERY_THRESHOLD ? '\u2713' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          <AccordionSection title="How It Works" defaultOpen={false}>
            <p className="text-sm text-white/50 font-light leading-relaxed">
              {concept.detailedDescription}
            </p>
          </AccordionSection>

          {concept.mathNotation && (
            <AccordionSection title="The Math">
              <MathDisplay latex={concept.mathNotation} />
            </AccordionSection>
          )}

          {concept.codeExample && (
            <AccordionSection title="Code Example">
              <CodeBlock code={concept.codeExample} language="python" />
            </AccordionSection>
          )}

          {concept.explorationId && onOpenExploration && (
            <AccordionSection title="Try It">
              <p className="text-sm text-white/50 font-light mb-3">
                Explore this concept hands-on with an interactive simulation.
              </p>
              <button
                onClick={() => onOpenExploration(concept.explorationId!)}
                className="w-full py-2.5 px-4 text-white/80 text-[10px] uppercase tracking-[0.2em] font-light rounded-full transition-all hover:bg-white/[0.15] active:scale-[0.98] bg-white/[0.10] border border-white/[0.10]"
              >
                Open Interactive Exploration
              </button>
            </AccordionSection>
          )}

          {concept.quizzes.length > 0 && (
            <AccordionSection title="Test Yourself" defaultOpen={false}>
              <div className="flex gap-2 mb-4">
                {([1, 2, 3] as Difficulty[]).map(d => {
                  const hasQuizzes = concept.quizzes.some(q => q.difficulty === d);
                  const labels = ['Easy', 'Medium', 'Hard'];
                  const recommended = selectDifficulty(mastery, conceptState.attemptHistory);
                  return (
                    <button
                      key={d}
                      onClick={() => { setSelectedDifficulty(d); setQuizIndex(0); setSelectedAnswer(null); setQuizSubmitted(false); setHintsRevealed(0); }}
                      disabled={!hasQuizzes}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        selectedDifficulty === d
                          ? 'bg-white/[0.12] text-white/70'
                          : hasQuizzes
                            ? 'bg-white/[0.05] text-white/40 hover:bg-white/[0.08]'
                            : 'opacity-30 cursor-not-allowed bg-white/[0.05] text-white/30'
                      }`}
                    >
                      {labels[d - 1]} {d === recommended && hasQuizzes ? '*' : ''}
                    </button>
                  );
                })}
              </div>

              {currentQuiz ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/30">
                      {currentQuiz.type === 'multiple-choice' ? 'Multiple Choice' :
                       currentQuiz.type === 'fill-blank' ? 'Fill in the Blank' : 'Ordering'}
                    </span>
                  </div>

                  <p className="text-sm text-white/70 font-light mb-3">
                    {currentQuiz.question}
                  </p>

                  {currentQuiz.type === 'multiple-choice' && currentQuiz.options && (
                    <div className="space-y-2 mb-4">
                      {currentQuiz.options.map((opt, i) => {
                        const isCorrect = opt === currentQuiz.correctAnswer;
                        const isSelected = selectedAnswer === opt;
                        return (
                          <button
                            key={i}
                            onClick={() => !quizSubmitted && setSelectedAnswer(opt)}
                            disabled={quizSubmitted}
                            className={`w-full text-left p-3 text-sm rounded-lg border transition-all ${
                              quizSubmitted
                                ? isCorrect
                                  ? 'border-her-cream/50 bg-her-cream/5 text-her-cream/70'
                                  : isSelected
                                    ? 'border-white/20 bg-white/[0.03] text-white/40'
                                    : 'border-white/[0.06] text-white/30'
                                : isSelected
                                  ? 'border-white/20 bg-white/[0.06] text-white/70'
                                  : 'border-white/[0.06] text-white/50 hover:border-white/[0.12]'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuiz.type === 'fill-blank' && (
                    <div className="mb-4">
                      <input
                        type="text"
                        value={fillBlankAnswer}
                        onChange={(e) => !quizSubmitted && setFillBlankAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !quizSubmitted && isQuizAnswered() && handleQuizSubmit()}
                        disabled={quizSubmitted}
                        placeholder="Type your answer..."
                        className={`w-full p-3 text-sm rounded-lg border font-mono transition-all bg-transparent outline-none ${
                          quizSubmitted
                            ? isQuizCorrect()
                              ? 'border-her-cream/50 bg-her-cream/5 text-her-cream/70'
                              : 'border-white/20 bg-white/[0.03] text-white/40'
                            : 'border-white/[0.08] text-white/70 focus:border-white/20'
                        }`}
                      />
                      {quizSubmitted && !isQuizCorrect() && (
                        <p className="text-xs text-white/30 mt-1.5 font-mono">
                          Correct answer: <span className="text-her-cream/70">{currentQuiz.correctAnswer as string}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {currentQuiz.type === 'ordering' && (
                    <div className="mb-4 space-y-1.5" role="listbox" aria-label="Reorder items. Use arrow keys to move items up or down.">
                      {orderingItems.map((item, idx) => {
                        const correctArr = currentQuiz.correctAnswer as string[];
                        const isCorrectPosition = quizSubmitted && correctArr[idx] === item;
                        const isWrongPosition = quizSubmitted && correctArr[idx] !== item;
                        return (
                          <div
                            key={`${item}-${idx}`}
                            role="option"
                            tabIndex={0}
                            aria-label={`${item}, position ${idx + 1} of ${orderingItems.length}. Use arrow keys to reorder.`}
                            aria-selected={dragIdx === idx}
                            draggable={!quizSubmitted}
                            onDragStart={() => handleOrderingDragStart(idx)}
                            onDragOver={(e) => handleOrderingDragOver(e, idx)}
                            onDragEnd={() => setDragIdx(null)}
                            onKeyDown={(e) => handleOrderingKeyDown(e, idx)}
                            className={`flex items-center gap-2 p-3 text-sm rounded-lg border transition-all select-none ${
                              quizSubmitted
                                ? isCorrectPosition
                                  ? 'border-her-cream/50 bg-her-cream/5 text-her-cream/70'
                                  : isWrongPosition
                                    ? 'border-white/20 bg-white/[0.03] text-white/40'
                                    : 'border-white/[0.06] text-white/30'
                                : dragIdx === idx
                                  ? 'border-white/20 bg-white/[0.06] text-white/70 scale-[1.02]'
                                  : 'border-white/[0.06] text-white/50 hover:border-white/[0.12] cursor-grab'
                            }`}
                          >
                            <span className="text-xs text-white/30 w-5 shrink-0">{idx + 1}.</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                            </svg>
                            <span className="flex-1">{item}</span>
                            {quizSubmitted && isCorrectPosition && <span className="text-her-cream/70 text-xs">&#10003;</span>}
                            {quizSubmitted && isWrongPosition && <span className="text-white/40 text-xs">&#10007;</span>}
                          </div>
                        );
                      })}
                      {quizSubmitted && !isQuizCorrect() && (
                        <div className="mt-2 p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                          <p className="text-xs text-white/30 mb-1">Correct order:</p>
                          {(currentQuiz.correctAnswer as string[]).map((item, i) => (
                            <p key={i} className="text-xs text-her-cream/60 ml-2">{i + 1}. {item}</p>
                          ))}
                        </div>
                      )}
                      <div aria-live="assertive" aria-atomic="true" className="sr-only">
                        {orderingAnnouncement}
                      </div>
                    </div>
                  )}

                  {currentQuiz.hints && currentQuiz.hints.length > 0 && !quizSubmitted && (
                    <div className="mb-3">
                      {hintsRevealed > 0 && (
                        <div className="space-y-1 mb-2">
                          {currentQuiz.hints.slice(0, hintsRevealed).map((hint, i) => (
                            <p key={i} className="text-xs text-white/40 bg-white/[0.04] px-2 py-1 rounded">
                              Hint {i + 1}: {hint}
                            </p>
                          ))}
                        </div>
                      )}
                      {hintsRevealed < currentQuiz.hints.length && (
                        <button
                          onClick={() => setHintsRevealed(prev => prev + 1)}
                          className="text-xs text-white/30 hover:text-white/50 transition-colors"
                        >
                          Show hint ({hintsRevealed}/{currentQuiz.hints.length})
                        </button>
                      )}
                    </div>
                  )}

                  {!quizSubmitted ? (
                    <button
                      onClick={handleQuizSubmit}
                      disabled={!isQuizAnswered()}
                      className="w-full py-2 bg-white/[0.10] border border-white/[0.10] text-white/80 text-[10px] uppercase tracking-[0.2em] rounded-full disabled:opacity-50 transition-all hover:bg-white/[0.15]"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <div>
                      <motion.p
                        className={`text-sm mb-2 ${isQuizCorrect() ? 'text-her-cream/70' : 'text-white/40'}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 15, stiffness: 200 }}
                      >
                        {isQuizCorrect()
                          ? 'Correct! Great work.'
                          : consecutiveIncorrect >= 3
                            ? 'Even experts struggle with this topic. Would you like to revisit the fundamentals?'
                            : consecutiveIncorrect === 2
                              ? 'This is a challenging concept. Each attempt builds understanding.'
                              : "Not quite \u2014 let's review the explanation together."}
                      </motion.p>
                      {currentQuiz.explanation && (
                        <p className="text-white/30 text-xs font-light italic mb-3">
                          {currentQuiz.explanation}
                        </p>
                      )}
                      <button
                        onClick={handleNextQuiz}
                        className="w-full py-2 bg-white/[0.10] border border-white/[0.10] text-white/80 text-[10px] uppercase tracking-[0.2em] rounded-full transition-all hover:bg-white/[0.15]"
                      >
                        Next Question
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-white/30">No quizzes at this difficulty level.</p>
              )}
            </AccordionSection>
          )}

          {concept.resources.length > 0 && (
            <AccordionSection title="Learn More">
              <div className="divide-y divide-white/[0.04]">
                {concept.resources.map((resource, i) => (
                  <a
                    key={i}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-baseline gap-2.5 py-2.5 transition-colors group"
                  >
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 shrink-0">
                      {resource.type}
                    </span>
                    <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
                      {resource.title}
                    </span>
                  </a>
                ))}
              </div>
            </AccordionSection>
          )}

          <AccordionSection title="Mastery Model">
            {(() => {
              const params = getDefaultParams(concept.tier as Tier);
              const recommended = selectDifficulty(mastery, conceptState.attemptHistory);
              const diffLabels = ['Easy', 'Medium', 'Hard'];
              const nextReviewTs = conceptState.nextReviewTimestamp;
              const nextReviewDays = nextReviewTs > 0
                ? Math.max(0, Math.ceil((nextReviewTs - Date.now()) / (24 * 60 * 60 * 1000)))
                : null;

              // Mastery trajectory from attempt history
              const trajectoryPoints: Array<{ attempt: number; mastery: number }> = [];
              if (conceptState.attemptHistory.length > 0) {
                let m = params.pInit;
                trajectoryPoints.push({ attempt: 0, mastery: m });
                conceptState.attemptHistory.forEach((a, i) => {
                  m = updateMastery(m, a.correct, params, a.hintsUsed, a.difficulty);
                  trajectoryPoints.push({ attempt: i + 1, mastery: m });
                });
              }

              return (
                <div className="space-y-5">
                  {/* BKT Parameters */}
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 mb-2">Bayesian Knowledge Tracing Parameters (Tier {concept.tier})</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'P(L\u2080)', value: params.pInit, desc: 'Initial knowledge' },
                        { label: 'P(T)', value: params.pTransit, desc: 'Learning rate' },
                        { label: 'P(S)', value: params.pSlip, desc: 'Slip probability' },
                        { label: 'P(G)', value: params.pGuess, desc: 'Guess probability' },
                      ].map(p => (
                        <div key={p.label} className="bg-white/[0.03] rounded-lg px-3 py-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs font-mono text-her-cream/40">{p.label}</span>
                            <span className="text-xs font-mono text-white/50 tabular-nums">{p.value.toFixed(2)}</span>
                          </div>
                          <span className="text-[9px] text-white/15">{p.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mastery Trajectory */}
                  {trajectoryPoints.length > 1 && (
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 mb-2">Mastery Trajectory ({conceptState.attemptHistory.length} attempts)</p>
                      <svg width="100%" height="60" viewBox="0 0 280 60" className="block" role="img" aria-label="Mastery trajectory chart">
                        {/* Threshold line */}
                        <line x1="0" y1={60 - 0.85 * 55} x2="280" y2={60 - 0.85 * 55} stroke="rgba(242,232,220,0.12)" strokeWidth="0.5" strokeDasharray="3,3" />
                        {/* Trajectory */}
                        <polyline
                          points={trajectoryPoints.map((p, i) => {
                            const x = (i / Math.max(1, trajectoryPoints.length - 1)) * 270 + 5;
                            const y = 55 - p.mastery * 50 + 2;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="rgba(242,232,220,0.4)"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                        {/* Dots for each attempt */}
                        {trajectoryPoints.map((p, i) => {
                          const x = (i / Math.max(1, trajectoryPoints.length - 1)) * 270 + 5;
                          const y = 55 - p.mastery * 50 + 2;
                          return (
                            <circle key={i} cx={x} cy={y} r={i === 0 ? 2 : 2.5}
                              fill={i === trajectoryPoints.length - 1 ? 'rgba(242,232,220,0.6)' : 'rgba(242,232,220,0.25)'}
                            />
                          );
                        })}
                      </svg>
                    </div>
                  )}

                  {/* Forgetting Curve */}
                  {conceptState.attemptHistory.length > 0 && (
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 mb-2">Forgetting Curve</p>
                      <ForgettingCurveChart
                        currentMastery={mastery}
                        daysSinceReview={timeSinceReview ?? 0}
                        tier={concept.tier as Tier}
                      />
                    </div>
                  )}

                  {/* Adaptive Difficulty Rationale */}
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1">Difficulty Recommendation</p>
                    <p className="text-xs text-white/35 font-light">
                      <span className="text-white/50">{diffLabels[recommended - 1]}</span> recommended.
                      {mastery < 0.3 && ' Low mastery suggests starting with easier items to build confidence.'}
                      {mastery >= 0.3 && mastery < 0.7 && ' Moderate mastery is best challenged with medium difficulty.'}
                      {mastery >= 0.7 && ' High mastery benefits from hard items to push toward the 85% threshold.'}
                    </p>
                  </div>

                  {/* Next Review */}
                  {nextReviewDays !== null && (
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1">Next Review</p>
                      <p className="text-xs text-white/35 font-light">
                        {nextReviewDays === 0
                          ? 'Due today. Reviewing now prevents forgetting.'
                          : nextReviewDays < 0
                            ? `Overdue by ${Math.abs(nextReviewDays)} day${Math.abs(nextReviewDays) !== 1 ? 's' : ''}. Review soon to maintain retention.`
                            : `In ${nextReviewDays} day${nextReviewDays !== 1 ? 's' : ''}. Interval grows with mastery (currently ${Math.round(mastery * 100)}%).`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </AccordionSection>

          <AccordionSection title="AI Insight">
            {isLoadingAI ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 w-full rounded-full bg-white/[0.05]" />
                <div className="h-3 w-5/6 rounded-full bg-white/[0.05]" />
                <div className="h-3 w-4/6 rounded-full bg-white/[0.05]" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-2">generating insight</p>
              </div>
            ) : aiInsight ? (
              <div className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
                <p className="text-sm text-white/50 font-light italic leading-relaxed">"{aiInsight}"</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-white/40 mb-2 font-light">
                  Get an AI-generated perspective on this concept.
                </p>
                <button
                  onClick={handleGenerateInsight}
                  className="text-xs rounded-full text-white/50 hover:text-white/70 px-3 py-1.5 transition-colors bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.10]"
                >
                  Generate Insight
                </button>
              </div>
            )}
          </AccordionSection>
        </div>
      </div>
    </div>
  );
};
