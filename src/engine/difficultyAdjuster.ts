import type { Difficulty, QuizAttempt } from '../types/index';

/**
 * Select the appropriate quiz difficulty based on mastery and recent performance.
 *
 * Base mapping:
 *   mastery < 0.3  → difficulty 1
 *   mastery 0.3–0.7 → difficulty 2
 *   mastery > 0.7  → difficulty 3
 *
 * Adjustment: if the last 3 attempts are all correct, bump up one level;
 * if all incorrect, bump down one level.
 */
export function selectDifficulty(
  mastery: number,
  recentAttempts: QuizAttempt[],
): Difficulty {
  // Base difficulty from mastery
  let level: number;
  if (mastery < 0.3) {
    level = 1;
  } else if (mastery <= 0.7) {
    level = 2;
  } else {
    level = 3;
  }

  // Adjust based on last 3 attempts
  if (recentAttempts.length >= 3) {
    const last3 = recentAttempts.slice(-3);
    const allCorrect = last3.every((a) => a.correct);
    const allIncorrect = last3.every((a) => !a.correct);

    if (allCorrect) {
      level = Math.min(3, level + 1);
    } else if (allIncorrect) {
      level = Math.max(1, level - 1);
    }
  }

  return level as Difficulty;
}
