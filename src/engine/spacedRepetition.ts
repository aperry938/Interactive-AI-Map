import type { ConceptState } from '../types/index';

/** Base review intervals in days, indexed by consecutive-correct count. */
const BASE_INTERVALS_DAYS = [1, 3, 7, 14, 30];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Compute the next review timestamp based on mastery and streak.
 *
 * Higher mastery stretches the interval; lower mastery compresses it.
 *
 * @param mastery              Current mastery probability [0,1]
 * @param consecutiveCorrect   Number of consecutive correct answers
 * @param lastReviewTimestamp   Timestamp (ms) of the last review
 * @returns                    Timestamp (ms) for the next scheduled review
 */
export function computeNextReview(
  mastery: number,
  consecutiveCorrect: number,
  lastReviewTimestamp: number,
): number {
  const index = Math.min(consecutiveCorrect, BASE_INTERVALS_DAYS.length - 1);
  const baseDays = BASE_INTERVALS_DAYS[index];

  // Scale interval: mastery 1.0 → 1.5x, mastery 0.0 → 0.5x
  const masteryScale = 0.5 + mastery;
  const intervalMs = baseDays * masteryScale * MS_PER_DAY;

  return lastReviewTimestamp + Math.round(intervalMs);
}

/**
 * Return concept IDs that are due for spaced-repetition review.
 *
 * A concept is due when:
 *  1. It has been attempted at least once.
 *  2. The current time is past its nextReviewTimestamp.
 */
export function getDueForReview(
  conceptStates: Record<string, ConceptState>,
): string[] {
  const now = Date.now();
  const due: string[] = [];

  for (const [id, state] of Object.entries(conceptStates)) {
    if (state.attemptHistory.length === 0) continue;
    if (now > state.nextReviewTimestamp) {
      due.push(id);
    }
  }

  return due;
}
