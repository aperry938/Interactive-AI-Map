// ============================================================================
// AI Learning Platform — Core Type System
// ============================================================================

/** Curriculum tier levels (1=foundations → 5=frontiers) */
export type Tier = 1 | 2 | 3 | 4 | 5;

/** Quiz difficulty levels */
export type Difficulty = 1 | 2 | 3;

/** Quiz format types */
export type QuizType = 'multiple-choice' | 'fill-blank' | 'ordering';

/** Bloom's taxonomy levels for learning objectives */
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

/** Resource link types */
export interface Resource {
  title: string;
  url: string;
  type: 'paper' | 'video' | 'tutorial' | 'tool';
}

/** A single quiz item with difficulty, hints, and multiple formats */
export interface QuizItem {
  id: string;
  question: string;
  difficulty: Difficulty;
  type: QuizType;
  /** For multiple-choice */
  options?: string[];
  /** The correct answer (string for MC/fill-blank, string[] for ordering) */
  correctAnswer: string | string[];
  /** Progressive hints (using one reduces BKT credit) */
  hints: string[];
  explanation: string;
}

/** A concept node in the curriculum graph */
export interface ConceptNode {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  mathNotation?: string;
  tier: Tier;
  bloomLevel: BloomLevel;
  /** IDs of prerequisite concepts (must be mastered first) */
  prerequisites: string[];
  /** IDs of related concepts (cross-links, not prerequisites) */
  connections: string[];
  quizzes: QuizItem[];
  codeExample?: string;
  /** ID of the interactive exploration component */
  explorationId?: string;
  resources: Resource[];
}

/** BKT model parameters for a concept */
export interface BKTParams {
  /** Prior probability of knowing the concept */
  pInit: number;
  /** Probability of learning on each opportunity */
  pTransit: number;
  /** Probability of slipping (incorrect despite knowing) */
  pSlip: number;
  /** Probability of guessing (correct despite not knowing) */
  pGuess: number;
}

/** A single quiz attempt record */
export interface QuizAttempt {
  timestamp: number;
  correct: boolean;
  difficulty: Difficulty;
  hintsUsed: number;
}

/** Per-concept learner state */
export interface ConceptState {
  masteryProbability: number;
  attemptHistory: QuizAttempt[];
  nextReviewTimestamp: number;
  consecutiveCorrect: number;
  explored: boolean;
}

/** Session record for activity tracking */
export interface SessionRecord {
  date: string; // YYYY-MM-DD
  conceptsStudied: string[];
  quizzesAttempted: number;
  quizzesCorrect: number;
  durationMinutes: number;
}

/** Onboarding questionnaire profile */
export interface OnboardingProfile {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  mathComfort: 1 | 2 | 3 | 4 | 5;
  programmingLevel: 'none' | 'basic' | 'intermediate' | 'advanced';
  mlFamiliarity: string[];
  learningGoal: 'explore' | 'career' | 'research' | 'academic';
  priorCourses: string[];
  completedAt: number;
}

/** Telemetry payload map — discriminated union for type-safe research instrumentation */
export type TelemetryPayloadMap = {
  quiz_attempt: { conceptId: string; difficulty: number; correct: boolean; hintsUsed: number; masteryBefore: number; masteryAfter: number };
  concept_open: { conceptId: string; tier: number };
  exploration_start: { explorationId: string };
  exploration_complete: { explorationId: string; durationMs: number };
  onboarding_complete: { experienceLevel: string; learningGoal: string };
  session_start: Record<string, never>;
  session_end: Record<string, never>;
  navigation: { from: string; to: string };
};

export type TelemetryEventType = keyof TelemetryPayloadMap;

export type TelemetryEvent = {
  [K in TelemetryEventType]: {
    type: K;
    timestamp: number;
    data: TelemetryPayloadMap[K];
  };
}[TelemetryEventType];

/** Full learner profile stored in context/localStorage */
export interface LearnerProfile {
  conceptStates: Record<string, ConceptState>;
  sessionHistory: SessionRecord[];
  currentSessionStart: number;
  totalStudyTimeMinutes: number;
  onboardingProfile?: OnboardingProfile;
  telemetryLog: TelemetryEvent[];
}

/** Tier color/label mappings */
export const TIER_CONFIG: Record<Tier, { label: string; color: string; bgClass: string; textClass: string }> = {
  1: { label: 'Foundations', color: '#3B82F6', bgClass: 'bg-blue-500', textClass: 'text-blue-400' },
  2: { label: 'Core ML', color: '#8B5CF6', bgClass: 'bg-purple-500', textClass: 'text-purple-400' },
  3: { label: 'Deep Learning', color: '#EC4899', bgClass: 'bg-pink-500', textClass: 'text-pink-400' },
  4: { label: 'Advanced', color: '#F59E0B', bgClass: 'bg-amber-500', textClass: 'text-amber-400' },
  5: { label: 'Frontiers', color: '#10B981', bgClass: 'bg-emerald-500', textClass: 'text-emerald-400' },
};

/** Mastery threshold for BKT */
export const MASTERY_THRESHOLD = 0.85;

/** Default BKT parameters (can be overridden per concept) */
export const DEFAULT_BKT_PARAMS: BKTParams = {
  pInit: 0.1,
  pTransit: 0.2,
  pSlip: 0.1,
  pGuess: 0.25,
};

// ============================================================================
// Backward-compatible re-exports from old types.ts
// ============================================================================

/** @deprecated Use QuizItem instead */
export type Quiz = QuizItem;

/** @deprecated Old tree node type — use ConceptNode for new code */
export interface TreeNode {
  id: string;
  name: string;
  description?: string;
  detailedDescription?: string;
  mathNotation?: string;
  interactiveModule?: string;
  resources?: Resource[];
  isApplication?: boolean;
  link?: string;
  children?: TreeNode[];
  _children?: TreeNode[];
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
  };
}
