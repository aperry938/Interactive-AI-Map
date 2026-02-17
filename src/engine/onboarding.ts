import type { OnboardingProfile, ConceptNode } from '../types';

// Math-heavy concept IDs that get boosted by math comfort
const MATH_HEAVY_CONCEPTS = [
  'gradient-descent', 'backpropagation', 'attention-mechanism',
  'loss-functions', 'optimization-algorithms', 'linear-regression',
  'logistic-regression', 'pca', 'svms', 'bayesian-methods',
];

// Code-heavy concept IDs that get boosted by programming level
const CODE_HEAVY_CONCEPTS = [
  'data-preprocessing', 'feature-engineering', 'neural-networks',
  'cnns', 'rnns', 'transformers', 'gans', 'reinforcement-learning',
  'model-deployment',
];

// Prior course → concept cluster mappings
const COURSE_CONCEPT_MAP: Record<string, string[]> = {
  'linear-algebra': ['linear-regression', 'pca', 'svms', 'neural-networks'],
  'probability': ['bayesian-methods', 'logistic-regression', 'evaluation-metrics', 'naive-bayes'],
  'intro-ml': ['linear-regression', 'logistic-regression', 'decision-trees', 'svms', 'evaluation-metrics', 'overfitting', 'cross-validation'],
  'deep-learning': ['neural-networks', 'backpropagation', 'cnns', 'rnns', 'optimization-algorithms', 'dropout-regularization'],
  'nlp': ['rnns', 'transformers', 'attention-mechanism', 'word-embeddings', 'bert-gpt'],
  'computer-vision': ['cnns', 'data-augmentation', 'transfer-learning', 'object-detection'],
  'reinforcement-learning': ['reinforcement-learning', 'q-learning', 'policy-gradient'],
};

export function mapOnboardingToMastery(
  profile: OnboardingProfile,
  curriculum: Record<string, ConceptNode>,
): Record<string, number> {
  const mastery: Record<string, number> = {};

  for (const [id, concept] of Object.entries(curriculum)) {
    let value = 0.1; // pInit default

    // Experience level base values by tier
    if (profile.experienceLevel === 'intermediate') {
      if (concept.tier === 1) value = 0.5;
      else if (concept.tier === 2) value = 0.3;
    } else if (profile.experienceLevel === 'advanced') {
      if (concept.tier === 1) value = 0.85;
      else if (concept.tier === 2) value = 0.6;
      else if (concept.tier === 3) value = 0.4;
      else if (concept.tier === 4) value = 0.2;
    }
    // beginner: stays at 0.1

    // Math comfort modifier
    if (profile.mathComfort >= 4 && MATH_HEAVY_CONCEPTS.includes(id)) {
      value += 0.15;
    }

    // Programming level modifier
    if (profile.programmingLevel === 'advanced' && CODE_HEAVY_CONCEPTS.includes(id)) {
      value += 0.1;
    }

    // mlFamiliarity: boost specific concepts to at least 0.5
    if (profile.mlFamiliarity.includes(id)) {
      value = Math.max(value, 0.5);
    }

    // Prior courses: boost related concepts by +0.15
    for (const course of profile.priorCourses) {
      const relatedConcepts = COURSE_CONCEPT_MAP[course];
      if (relatedConcepts?.includes(id)) {
        value += 0.15;
        break; // Only apply course boost once per concept
      }
    }

    // Clamp to [0, 1]
    mastery[id] = Math.max(0, Math.min(1, value));
  }

  return mastery;
}
