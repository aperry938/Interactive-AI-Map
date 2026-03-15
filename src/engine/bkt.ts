import type { BKTParams, Tier } from '../types/index';
import { MASTERY_THRESHOLD } from '../types/index';

/**
 * Update mastery probability using difficulty-conditioned Bayesian Knowledge Tracing.
 *
 * @param currentPL  Current P(Learned) for the concept
 * @param correct    Whether the learner answered correctly
 * @param params     BKT parameters (pSlip, pGuess, pTransit)
 * @param hintsUsed  Number of hints the learner used (reduces credit)
 * @param difficulty Quiz item difficulty (1|2|3, default 1). Harder items
 *                   provide stronger evidence of mastery on correct answers.
 */
export function updateMastery(
  currentPL: number,
  correct: boolean,
  params: BKTParams,
  hintsUsed: number = 0,
  difficulty: 1 | 2 | 3 = 1,
): number {
  const { pSlip, pGuess, pTransit } = params;

  // BKT identifiability constraint: P(correct|learned) > P(correct|not_learned)
  // i.e. (1 - pSlip) > pGuess, equivalently 1 - pSlip > pGuess
  if (1 - pSlip <= pGuess) {
    console.warn(
      `BKT identifiability violation: P(correct|learned)=${1 - pSlip} <= P(correct|not_learned)=${pGuess}. ` +
      `Parameters should satisfy (1 - pSlip) > pGuess.`
    );
  }

  // Difficulty-conditioned adjustments:
  // Harder items → less slip (stronger evidence when correct)
  // Harder items → less guessing (stronger evidence when correct)
  const adjustedPSlip = pSlip * (1 - (difficulty - 1) * 0.03);
  const adjustedPGuess = pGuess * (1 - (difficulty - 1) * 0.08);

  // Apply hint penalty: each hint halves the effective correctness credit.
  // We blend toward the "incorrect" / "worse" update by reducing the
  // effective correct probability before choosing the BKT branch.
  let hintPenaltyFactor = 1;
  if (hintsUsed > 0) {
    hintPenaltyFactor = Math.pow(0.5, hintsUsed);
  }

  let posterior: number;

  if (correct) {
    // Standard BKT correct-observation update
    const pCorrectGivenLearned = 1 - adjustedPSlip;
    const pCorrectGivenNotLearned = adjustedPGuess;

    const posteriorRaw =
      (currentPL * pCorrectGivenLearned) /
      (currentPL * pCorrectGivenLearned + (1 - currentPL) * pCorrectGivenNotLearned);

    if (hintsUsed > 0) {
      // Blend posterior toward the incorrect-update posterior based on penalty
      const posteriorIncorrect =
        (currentPL * adjustedPSlip) /
        (currentPL * adjustedPSlip + (1 - currentPL) * (1 - adjustedPGuess));
      posterior = posteriorRaw * hintPenaltyFactor + posteriorIncorrect * (1 - hintPenaltyFactor);
    } else {
      posterior = posteriorRaw;
    }
  } else {
    // Standard BKT incorrect-observation update
    const posteriorRaw =
      (currentPL * adjustedPSlip) /
      (currentPL * adjustedPSlip + (1 - currentPL) * (1 - adjustedPGuess));

    if (hintsUsed > 0) {
      // Hints used + incorrect = even worse evidence.
      // Blend toward a "maximally bad" posterior (as if pSlip→0, pGuess→0)
      // by pushing posterior further down.
      const worstPosterior = 0; // floor: no evidence of learning
      posterior = posteriorRaw * hintPenaltyFactor + worstPosterior * (1 - hintPenaltyFactor);
    } else {
      posterior = posteriorRaw;
    }
  }

  // Apply learning transition
  const updated = posterior + (1 - posterior) * pTransit;

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, updated));
}

/** Returns true when mastery probability meets the threshold (0.85). */
export function isMastered(probability: number): boolean {
  return probability >= MASTERY_THRESHOLD;
}

/** Default BKT parameters scaled by curriculum tier. */
export function getDefaultParams(tier: Tier): BKTParams {
  // Higher tiers: slightly lower pInit, lower pTransit (harder to learn),
  // lower pGuess (less likely to guess correctly on complex material).
  const tierScale = tier - 1; // 0..4

  return {
    pInit: Math.max(0.02, 0.1 - tierScale * 0.02),
    pTransit: Math.max(0.05, 0.2 - tierScale * 0.03),
    pSlip: Math.min(0.2, 0.1 + tierScale * 0.02),
    pGuess: Math.max(0.1, 0.25 - tierScale * 0.03),
  };
}

/**
 * Apply Ebbinghaus-inspired forgetting to a mastery probability.
 *
 * Mastery decays exponentially toward pInit (0.1) over time.
 * Higher tiers (more complex material) forget faster (shorter half-life).
 *
 * @param currentPL          Current P(Learned)
 * @param daysSinceLastReview Days since the concept was last reviewed
 * @param tier               Curriculum tier (1..5)
 * @returns                  Decayed P(Learned), never below pInit
 */
export function applyForgetting(currentPL: number, daysSinceLastReview: number, tier: Tier): number {
  if (daysSinceLastReview <= 0) return currentPL;
  // Ebbinghaus-inspired exponential decay
  // Higher tiers forget faster (more complex material)
  const halfLife = Math.max(3, 14 - (tier - 1) * 2); // Tier 1: 14 days, Tier 5: 6 days
  const retention = Math.pow(0.5, daysSinceLastReview / halfLife);
  // Decay toward pInit (0.1), not toward 0
  const pInit = 0.1;
  return pInit + (currentPL - pInit) * retention;
}

/**
 * Compute knowledge transfer boosts when a concept crosses the mastery threshold.
 *
 * When a learner masters a concept, connected concepts (via `connections[]`)
 * that haven't been attempted yet receive a small mastery boost. This models
 * the transfer of related knowledge — mastering gradient descent, for example,
 * provides some prior knowledge about backpropagation.
 *
 * @param masteredConceptId  The concept that was just mastered
 * @param curriculum         Full curriculum map
 * @param conceptStates      Current learner states
 * @returns                  Map of concept IDs to their boosted mastery values
 */
export function computeTransferBoosts(
  masteredConceptId: string,
  curriculum: Record<string, { connections: string[]; tier: number }>,
  conceptStates: Record<string, { masteryProbability: number; attemptHistory: { timestamp: number }[] }>,
): Record<string, number> {
  const boosts: Record<string, number> = {};
  const mastered = curriculum[masteredConceptId];
  if (!mastered) return boosts;

  const TRANSFER_COEFFICIENT = 0.08; // Small boost: ~8% mastery increase
  const MAX_BOOSTED_MASTERY = 0.4;   // Cap: transfer alone can't push past 40%

  for (const connId of mastered.connections) {
    const connState = conceptStates[connId];
    // Only boost unattempted concepts (no quiz history yet)
    if (connState && connState.attemptHistory.length === 0) {
      const currentMastery = connState.masteryProbability;
      const boosted = Math.min(MAX_BOOSTED_MASTERY, currentMastery + TRANSFER_COEFFICIENT);
      if (boosted > currentMastery) {
        boosts[connId] = boosted;
      }
    }
  }

  return boosts;
}
