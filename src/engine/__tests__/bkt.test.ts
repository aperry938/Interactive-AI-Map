import { describe, it, expect, vi } from 'vitest';
import { updateMastery, isMastered, getDefaultParams, applyForgetting } from '../bkt';
import { DEFAULT_BKT_PARAMS } from '../../types';

describe('BKT Engine', () => {
  const params = DEFAULT_BKT_PARAMS;

  it('correct answer increases mastery', () => {
    const initial = 0.3;
    const updated = updateMastery(initial, true, params);
    expect(updated).toBeGreaterThan(initial);
  });

  it('incorrect answer decreases effective mastery', () => {
    const initial = 0.5;
    const updated = updateMastery(initial, false, params);
    // After incorrect, mastery should still increase due to pTransit,
    // but posterior before transit should be lower
    const correctUpdated = updateMastery(initial, true, params);
    expect(updated).toBeLessThan(correctUpdated);
  });

  it('hint penalty reduces credit for correct answers', () => {
    const initial = 0.3;
    const noHints = updateMastery(initial, true, params, 0);
    const withHints = updateMastery(initial, true, params, 2);
    expect(withHints).toBeLessThan(noHints);
  });

  it('mastery stays clamped to [0, 1]', () => {
    // Very high mastery + correct
    const high = updateMastery(0.99, true, params);
    expect(high).toBeLessThanOrEqual(1);
    expect(high).toBeGreaterThanOrEqual(0);

    // Very low mastery + incorrect
    const low = updateMastery(0.01, false, params);
    expect(low).toBeLessThanOrEqual(1);
    expect(low).toBeGreaterThanOrEqual(0);
  });

  it('isMastered returns true at threshold', () => {
    expect(isMastered(0.85)).toBe(true);
    expect(isMastered(0.9)).toBe(true);
    expect(isMastered(0.84)).toBe(false);
  });

  it('tier-scaled parameters differ by tier', () => {
    const tier1 = getDefaultParams(1);
    const tier5 = getDefaultParams(5);

    // Higher tiers should have lower pInit
    expect(tier5.pInit).toBeLessThan(tier1.pInit);
    // Higher tiers should have lower pTransit (harder to learn)
    expect(tier5.pTransit).toBeLessThan(tier1.pTransit);
    // Higher tiers should have lower pGuess
    expect(tier5.pGuess).toBeLessThan(tier1.pGuess);
  });

  it('repeated correct answers converge toward mastery', () => {
    let mastery = 0.1;
    for (let i = 0; i < 10; i++) {
      mastery = updateMastery(mastery, true, params);
    }
    expect(mastery).toBeGreaterThan(0.8);
  });

  // --- Exact numerical assertion ---
  it('exact numerical BKT update for mastery=0.3, correct=true, default params, 0 hints', () => {
    // pSlip=0.1, pGuess=0.25, pTransit=0.2
    // P(correct|learned) = 1 - 0.1 = 0.9
    // P(correct|not_learned) = 0.25
    // Posterior = (0.3 * 0.9) / (0.3 * 0.9 + 0.7 * 0.25)
    //          = 0.27 / (0.27 + 0.175)
    //          = 0.27 / 0.445
    //          = 0.60674...
    // After transit: 0.60674 + (1 - 0.60674) * 0.2
    //             = 0.60674 + 0.39326 * 0.2
    //             = 0.60674 + 0.07865
    //             = 0.68539...
    const result = updateMastery(0.3, true, DEFAULT_BKT_PARAMS, 0);
    expect(result).toBeCloseTo(0.6854, 4);
  });

  // --- Difficulty-conditioned test ---
  it('higher difficulty correct answer increases mastery more', () => {
    const initial = 0.3;
    const easyCorrect = updateMastery(initial, true, params, 0, 1);
    const hardCorrect = updateMastery(initial, true, params, 0, 3);
    // A correct answer on a harder question should provide stronger
    // evidence of mastery, resulting in higher updated mastery
    expect(hardCorrect).toBeGreaterThan(easyCorrect);
  });

  // --- Hint penalty on incorrect ---
  it('hints used with incorrect answer produces worse mastery than no hints + incorrect', () => {
    const initial = 0.4;
    const incorrectNoHints = updateMastery(initial, false, params, 0);
    const incorrectWithHints = updateMastery(initial, false, params, 2);
    // Using hints and still getting it wrong is worse evidence
    expect(incorrectWithHints).toBeLessThan(incorrectNoHints);
  });

  // --- Forgetting model tests ---
  it('mastery decays over time via forgetting model', () => {
    const initial = 0.8;
    const after7Days = applyForgetting(initial, 7, 1);
    const after30Days = applyForgetting(initial, 30, 1);

    // Mastery should decay over time
    expect(after7Days).toBeLessThan(initial);
    expect(after30Days).toBeLessThan(after7Days);
  });

  it('higher tiers forget faster', () => {
    const initial = 0.8;
    const tier1After14 = applyForgetting(initial, 14, 1);
    const tier5After14 = applyForgetting(initial, 14, 5);

    // Higher tier = shorter half-life = more decay
    expect(tier5After14).toBeLessThan(tier1After14);
  });

  it('forgetting does not reduce mastery below pInit (0.1)', () => {
    const initial = 0.8;
    // Even after a very long time, mastery stays >= 0.1
    const after1000Days = applyForgetting(initial, 1000, 5);
    expect(after1000Days).toBeGreaterThanOrEqual(0.1);
    expect(after1000Days).toBeCloseTo(0.1, 4);
  });

  it('forgetting with 0 or negative days returns current mastery', () => {
    const initial = 0.7;
    expect(applyForgetting(initial, 0, 1)).toBe(initial);
    expect(applyForgetting(initial, -5, 3)).toBe(initial);
  });

  // --- Exact numerical for incorrect branch ---
  it('exact numerical BKT update for mastery=0.3, correct=false, default params', () => {
    // mastery=0.3, correct=false, default params (pSlip=0.1, pGuess=0.25, pTransit=0.2)
    // P(incorrect|learned) = pSlip = 0.1
    // P(incorrect|not_learned) = 1 - pGuess = 0.75
    // posterior = (0.3 * 0.1) / (0.3 * 0.1 + 0.7 * 0.75) = 0.03 / 0.555 = 0.05405...
    // After transit: 0.05405 + (1 - 0.05405) * 0.2 = 0.05405 + 0.18919 = 0.24324
    const result = updateMastery(0.3, false, DEFAULT_BKT_PARAMS, 0);
    expect(result).toBeCloseTo(0.2432, 4);
  });

  // --- Exact numerical for forgetting ---
  it('exact numerical forgetting for mastery=0.8, days=14, tier=1', () => {
    // mastery=0.8, days=14, tier=1 (halfLife=14)
    // retention = 0.5^(14/14) = 0.5
    // result = 0.1 + (0.8 - 0.1) * 0.5 = 0.1 + 0.35 = 0.45
    const result = applyForgetting(0.8, 14, 1);
    expect(result).toBeCloseTo(0.45, 4);
  });

  // --- BKT parameter validation ---
  it('warns when BKT identifiability constraint is violated', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Violating params: 1 - pSlip = 0.5 <= pGuess = 0.6
    const violatingParams = { pInit: 0.1, pTransit: 0.2, pSlip: 0.5, pGuess: 0.6 };
    updateMastery(0.3, true, violatingParams);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('BKT identifiability violation')
    );

    warnSpy.mockRestore();
  });

  it('does not warn when BKT identifiability constraint is satisfied', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Valid params: 1 - pSlip = 0.9 > pGuess = 0.25
    updateMastery(0.3, true, DEFAULT_BKT_PARAMS);

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
