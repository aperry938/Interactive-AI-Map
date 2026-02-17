import { describe, it, expect } from 'vitest';
import { mapOnboardingToMastery } from '../onboarding';
import type { OnboardingProfile, ConceptNode } from '../../types';

const makeConcept = (id: string, tier: number): ConceptNode => ({
  id,
  name: id,
  description: '',
  detailedDescription: '',
  tier: tier as any,
  bloomLevel: 'understand',
  prerequisites: [],
  connections: [],
  quizzes: [],
  resources: [],
});

const makeProfile = (overrides: Partial<OnboardingProfile> = {}): OnboardingProfile => ({
  experienceLevel: 'beginner',
  mathComfort: 1,
  programmingLevel: 'none',
  mlFamiliarity: [],
  learningGoal: 'explore',
  priorCourses: [],
  completedAt: Date.now(),
  ...overrides,
});

describe('Onboarding Engine', () => {
  const curriculum: Record<string, ConceptNode> = {
    'linear-regression': makeConcept('linear-regression', 1),
    'neural-networks': makeConcept('neural-networks', 2),
    'transformers': makeConcept('transformers', 3),
    'reinforcement-learning': makeConcept('reinforcement-learning', 4),
    'frontier-topic': makeConcept('frontier-topic', 5),
    'gradient-descent': makeConcept('gradient-descent', 1),
    'data-preprocessing': makeConcept('data-preprocessing', 1),
  };

  it('beginner profile gives low mastery across the board', () => {
    const mastery = mapOnboardingToMastery(makeProfile(), curriculum);
    for (const val of Object.values(mastery)) {
      expect(val).toBe(0.1);
    }
  });

  it('advanced profile auto-masters Tier 1', () => {
    const mastery = mapOnboardingToMastery(
      makeProfile({ experienceLevel: 'advanced' }),
      curriculum,
    );
    expect(mastery['linear-regression']).toBe(0.85);
    expect(mastery['neural-networks']).toBe(0.6);
    expect(mastery['transformers']).toBe(0.4);
    expect(mastery['reinforcement-learning']).toBe(0.2);
    expect(mastery['frontier-topic']).toBe(0.1); // Tier 5 stays at default
  });

  it('mlFamiliarity boosts specific concepts to at least 0.5', () => {
    const mastery = mapOnboardingToMastery(
      makeProfile({ mlFamiliarity: ['transformers'] }),
      curriculum,
    );
    expect(mastery['transformers']).toBeGreaterThanOrEqual(0.5);
    expect(mastery['linear-regression']).toBe(0.1); // not boosted
  });

  it('math comfort modifier boosts math-heavy concepts', () => {
    const noMath = mapOnboardingToMastery(
      makeProfile({ mathComfort: 2 }),
      curriculum,
    );
    const highMath = mapOnboardingToMastery(
      makeProfile({ mathComfort: 4 }),
      curriculum,
    );
    expect(highMath['gradient-descent']).toBeGreaterThan(noMath['gradient-descent']);
    // Non-math concepts should be the same
    expect(highMath['data-preprocessing']).toBe(noMath['data-preprocessing']);
  });

  it('programming level modifier boosts code-heavy concepts', () => {
    const noProg = mapOnboardingToMastery(
      makeProfile({ programmingLevel: 'none' }),
      curriculum,
    );
    const advProg = mapOnboardingToMastery(
      makeProfile({ programmingLevel: 'advanced' }),
      curriculum,
    );
    expect(advProg['data-preprocessing']).toBeGreaterThan(noProg['data-preprocessing']);
  });

  it('all values clamped to [0, 1]', () => {
    const mastery = mapOnboardingToMastery(
      makeProfile({
        experienceLevel: 'advanced',
        mathComfort: 5,
        programmingLevel: 'advanced',
        mlFamiliarity: ['linear-regression'],
        priorCourses: ['linear-algebra', 'intro-ml'],
      }),
      curriculum,
    );
    for (const val of Object.values(mastery)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('intermediate profile boosts Tier 1 and 2', () => {
    const mastery = mapOnboardingToMastery(
      makeProfile({ experienceLevel: 'intermediate' }),
      curriculum,
    );
    expect(mastery['linear-regression']).toBe(0.5); // Tier 1
    expect(mastery['neural-networks']).toBe(0.3); // Tier 2
    expect(mastery['transformers']).toBe(0.1); // Tier 3 unchanged
  });
});
