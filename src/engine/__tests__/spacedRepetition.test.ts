import { describe, it, expect } from 'vitest';
import { computeNextReview, getDueForReview } from '../spacedRepetition';
import type { ConceptState } from '../../types';

describe('Spaced Repetition', () => {
  it('review intervals increase with consecutive correct answers', () => {
    const mastery = 0.5;
    const now = Date.now();

    const interval0 = computeNextReview(mastery, 0, now) - now;
    const interval1 = computeNextReview(mastery, 1, now) - now;
    const interval2 = computeNextReview(mastery, 2, now) - now;

    expect(interval1).toBeGreaterThan(interval0);
    expect(interval2).toBeGreaterThan(interval1);
  });

  it('higher mastery extends intervals', () => {
    const now = Date.now();
    const consecutive = 1;

    const lowMastery = computeNextReview(0.2, consecutive, now) - now;
    const highMastery = computeNextReview(0.9, consecutive, now) - now;

    expect(highMastery).toBeGreaterThan(lowMastery);
  });

  it('getDueForReview returns only overdue concepts', () => {
    const now = Date.now();
    const states: Record<string, ConceptState> = {
      'concept-a': {
        masteryProbability: 0.5,
        attemptHistory: [{ timestamp: now - 100000, correct: true, difficulty: 1, hintsUsed: 0 }],
        nextReviewTimestamp: now - 1000, // overdue
        consecutiveCorrect: 1,
        explored: true,
      },
      'concept-b': {
        masteryProbability: 0.5,
        attemptHistory: [{ timestamp: now - 100000, correct: true, difficulty: 1, hintsUsed: 0 }],
        nextReviewTimestamp: now + 1000000, // not due yet
        consecutiveCorrect: 1,
        explored: true,
      },
      'concept-c': {
        masteryProbability: 0.1,
        attemptHistory: [], // never attempted
        nextReviewTimestamp: 0,
        consecutiveCorrect: 0,
        explored: false,
      },
    };

    const due = getDueForReview(states);
    expect(due).toContain('concept-a');
    expect(due).not.toContain('concept-b');
    expect(due).not.toContain('concept-c');
  });
});
