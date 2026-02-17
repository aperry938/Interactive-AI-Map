import { describe, it, expect } from 'vitest';
import { getRecommendedNext } from '../recommender';
import type { ConceptNode, ConceptState } from '../../types';

const makeConcept = (id: string, tier: number, prerequisites: string[] = []): ConceptNode => ({
  id,
  name: id,
  description: '',
  detailedDescription: '',
  tier: tier as any,
  bloomLevel: 'understand',
  prerequisites,
  connections: [],
  quizzes: [],
  resources: [],
});

const makeState = (mastery: number, attempted = false): ConceptState => ({
  masteryProbability: mastery,
  attemptHistory: attempted
    ? [{ timestamp: Date.now() - 100000, correct: true, difficulty: 1 as const, hintsUsed: 0 }]
    : [],
  nextReviewTimestamp: attempted ? Date.now() - 1000 : 0,
  consecutiveCorrect: 0,
  explored: false,
});

describe('Recommender', () => {
  it('recommends concepts with satisfied prerequisites', () => {
    const curriculum: Record<string, ConceptNode> = {
      a: makeConcept('a', 1),
      b: makeConcept('b', 2, ['a']),
    };
    const states: Record<string, ConceptState> = {
      a: makeState(0.9), // mastered
      b: makeState(0.1), // not mastered
    };

    const recs = getRecommendedNext(curriculum, states);
    expect(recs).toContain('b');
  });

  it('does not recommend locked concepts', () => {
    const curriculum: Record<string, ConceptNode> = {
      a: makeConcept('a', 1),
      b: makeConcept('b', 2, ['a']),
    };
    const states: Record<string, ConceptState> = {
      a: makeState(0.3), // not mastered — b is locked
      b: makeState(0.1),
    };

    const recs = getRecommendedNext(curriculum, states);
    expect(recs).toContain('a');
    expect(recs).not.toContain('b');
  });

  it('due-for-review concepts appear in recommendations', () => {
    const curriculum: Record<string, ConceptNode> = {
      a: makeConcept('a', 1),
      b: makeConcept('b', 1),
    };
    const states: Record<string, ConceptState> = {
      a: makeState(0.9, true), // mastered but overdue — should appear via priority 2 (review)
      b: makeState(0.3, false), // unmastered, no prereqs — should appear via priority 1
    };

    const recs = getRecommendedNext(curriculum, states);
    // 'b' is unmastered with satisfied prereqs (priority 1)
    expect(recs).toContain('b');
    // 'a' is mastered but overdue for review (priority 2)
    expect(recs).toContain('a');
    expect(recs.length).toBeGreaterThanOrEqual(2);
  });

  it('returns at most 5 results', () => {
    const curriculum: Record<string, ConceptNode> = {};
    const states: Record<string, ConceptState> = {};
    for (let i = 0; i < 10; i++) {
      const id = `concept-${i}`;
      curriculum[id] = makeConcept(id, 1);
      states[id] = makeState(0.1);
    }

    const recs = getRecommendedNext(curriculum, states);
    expect(recs.length).toBeLessThanOrEqual(5);
  });
});
