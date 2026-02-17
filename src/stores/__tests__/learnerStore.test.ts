import { describe, it, expect } from 'vitest';

// We need to test the reducer directly, but it's not exported.
// Instead, test the key behaviors through the action types.
// Since the reducer is internal, we'll test the pure logic by importing and simulating.

// For now, test the critical integration:
// quiz attempt -> mastery update -> review scheduled -> recommender changes

import { updateMastery, applyForgetting } from '../../engine/bkt';
import { computeNextReview } from '../../engine/spacedRepetition';
import { selectDifficulty } from '../../engine/difficultyAdjuster';
import { getRecommendedNext } from '../../engine/recommender';
import { DEFAULT_BKT_PARAMS, MASTERY_THRESHOLD } from '../../types';
import type { ConceptNode, ConceptState } from '../../types';

const makeConcept = (id: string, tier: number, prereqs: string[] = []): ConceptNode => ({
  id, name: id, description: '', detailedDescription: '',
  tier: tier as any, bloomLevel: 'understand',
  prerequisites: prereqs, connections: [], quizzes: [], resources: [],
});

const makeState = (mastery: number, attempts: number = 0): ConceptState => ({
  masteryProbability: mastery,
  attemptHistory: Array.from({ length: attempts }, (_, i) => ({
    timestamp: Date.now() - (attempts - i) * 60000,
    correct: true, difficulty: 1 as const, hintsUsed: 0,
  })),
  nextReviewTimestamp: 0,
  consecutiveCorrect: attempts,
  explored: false,
});

describe('Adaptive Learning Loop Integration', () => {
  it('correct quiz answers increase mastery and extend review interval', () => {
    const mastery = 0.3;
    const newMastery = updateMastery(mastery, true, DEFAULT_BKT_PARAMS);
    expect(newMastery).toBeGreaterThan(mastery);

    const reviewA = computeNextReview(mastery, 0, Date.now());
    const reviewB = computeNextReview(newMastery, 1, Date.now());
    expect(reviewB - Date.now()).toBeGreaterThan(reviewA - Date.now());
  });

  it('mastery progression unlocks new recommendations', () => {
    const curriculum: Record<string, ConceptNode> = {
      a: makeConcept('a', 1),
      b: makeConcept('b', 2, ['a']),
    };

    // Before mastery: b is locked
    const statesBefore: Record<string, ConceptState> = {
      a: makeState(0.5),
      b: makeState(0.1),
    };
    const recsBefore = getRecommendedNext(curriculum, statesBefore);
    expect(recsBefore).toContain('a');
    expect(recsBefore).not.toContain('b');

    // After mastering a: b is unlocked
    const statesAfter: Record<string, ConceptState> = {
      a: makeState(0.9),
      b: makeState(0.1),
    };
    const recsAfter = getRecommendedNext(curriculum, statesAfter);
    expect(recsAfter).toContain('b');
  });

  it('difficulty adjuster responds to mastery changes', () => {
    const lowDiff = selectDifficulty(0.2, []);
    const highDiff = selectDifficulty(0.8, []);
    expect(highDiff).toBeGreaterThan(lowDiff);
  });

  it('full learning loop converges to mastery', () => {
    let mastery = 0.1;
    let consecutiveCorrect = 0;

    for (let i = 0; i < 15; i++) {
      selectDifficulty(mastery, []);
      mastery = updateMastery(mastery, true, DEFAULT_BKT_PARAMS);
      consecutiveCorrect++;
      const nextReview = computeNextReview(mastery, consecutiveCorrect, Date.now());
      expect(nextReview).toBeGreaterThan(Date.now());
    }

    expect(mastery).toBeGreaterThanOrEqual(MASTERY_THRESHOLD);
  });
});

describe('Forgetting Model Integration', () => {
  it('forgetting model decays mastery after simulated absence', () => {
    // 1. Set mastery to 0.8 for a concept
    const initialMastery = 0.8;

    // 2. Simulate time passing: set the review timestamp 14 days in the past
    const MS_PER_DAY = 86_400_000;
    const fourteenDaysAgo = Date.now() - 14 * MS_PER_DAY;

    const conceptState: ConceptState = {
      masteryProbability: initialMastery,
      attemptHistory: [
        { timestamp: fourteenDaysAgo, correct: true, difficulty: 1, hintsUsed: 0 },
      ],
      nextReviewTimestamp: fourteenDaysAgo,
      consecutiveCorrect: 1,
      explored: true,
    };

    // 3. Apply forgetting — simulate what APPLY_FORGETTING does
    const daysSince = (Date.now() - conceptState.nextReviewTimestamp) / MS_PER_DAY;
    const tier = 1; // Tier 1 has half-life of 14 days
    const decayedMastery = applyForgetting(conceptState.masteryProbability, daysSince, tier);

    // 4. Verify mastery has decayed
    expect(decayedMastery).toBeLessThan(initialMastery);
    // With tier=1, halfLife=14, 14 days passed: retention = 0.5^(14/14) = 0.5
    // result = 0.1 + (0.8 - 0.1) * 0.5 = 0.45
    expect(decayedMastery).toBeCloseTo(0.45, 4);
  });
});
