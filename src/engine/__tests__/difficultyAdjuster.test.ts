import { describe, it, expect } from 'vitest';
import { selectDifficulty } from '../difficultyAdjuster';
import type { QuizAttempt } from '../../types';

describe('Difficulty Adjuster', () => {
  it('low mastery returns difficulty 1', () => {
    expect(selectDifficulty(0.1, [])).toBe(1);
    expect(selectDifficulty(0.2, [])).toBe(1);
  });

  it('medium mastery returns difficulty 2', () => {
    expect(selectDifficulty(0.5, [])).toBe(2);
  });

  it('high mastery returns difficulty 3', () => {
    expect(selectDifficulty(0.8, [])).toBe(3);
    expect(selectDifficulty(0.9, [])).toBe(3);
  });

  it('3 consecutive correct bumps up difficulty', () => {
    const attempts: QuizAttempt[] = [
      { timestamp: 1, correct: true, difficulty: 1, hintsUsed: 0 },
      { timestamp: 2, correct: true, difficulty: 1, hintsUsed: 0 },
      { timestamp: 3, correct: true, difficulty: 1, hintsUsed: 0 },
    ];
    // mastery 0.1 normally gives difficulty 1, but 3 correct bumps to 2
    expect(selectDifficulty(0.1, attempts)).toBe(2);
  });

  it('3 consecutive incorrect bumps down difficulty', () => {
    const attempts: QuizAttempt[] = [
      { timestamp: 1, correct: false, difficulty: 2, hintsUsed: 0 },
      { timestamp: 2, correct: false, difficulty: 2, hintsUsed: 0 },
      { timestamp: 3, correct: false, difficulty: 2, hintsUsed: 0 },
    ];
    // mastery 0.5 normally gives difficulty 2, but 3 incorrect bumps to 1
    expect(selectDifficulty(0.5, attempts)).toBe(1);
  });

  it('difficulty never exceeds 3', () => {
    const attempts: QuizAttempt[] = [
      { timestamp: 1, correct: true, difficulty: 3, hintsUsed: 0 },
      { timestamp: 2, correct: true, difficulty: 3, hintsUsed: 0 },
      { timestamp: 3, correct: true, difficulty: 3, hintsUsed: 0 },
    ];
    expect(selectDifficulty(0.9, attempts)).toBe(3);
  });

  it('difficulty never goes below 1', () => {
    const attempts: QuizAttempt[] = [
      { timestamp: 1, correct: false, difficulty: 1, hintsUsed: 0 },
      { timestamp: 2, correct: false, difficulty: 1, hintsUsed: 0 },
      { timestamp: 3, correct: false, difficulty: 1, hintsUsed: 0 },
    ];
    expect(selectDifficulty(0.1, attempts)).toBe(1);
  });
});
