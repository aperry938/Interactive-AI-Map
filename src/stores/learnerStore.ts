import React, { useContext, useReducer, useCallback, useEffect, useRef, createContext } from 'react';
import type { LearnerProfile, ConceptState, QuizAttempt, Difficulty, SessionRecord, OnboardingProfile, TelemetryEvent } from '../types';
import { getAllConceptIds, getConcept } from '../data/curriculum';
import { applyForgetting } from '../engine/bkt';

// ============================================================================
// Initial State
// ============================================================================

const createInitialConceptState = (): ConceptState => ({
  masteryProbability: 0.1,
  attemptHistory: [],
  nextReviewTimestamp: 0,
  consecutiveCorrect: 0,
  explored: false,
});

const createInitialProfile = (): LearnerProfile => {
  const conceptStates: Record<string, ConceptState> = {};
  for (const id of getAllConceptIds()) {
    conceptStates[id] = createInitialConceptState();
  }
  return {
    conceptStates,
    sessionHistory: [],
    currentSessionStart: Date.now(),
    totalStudyTimeMinutes: 0,
    telemetryLog: [],
  };
};

const STORAGE_KEY = 'ai-learning-platform-learner';

const loadProfile = (): LearnerProfile => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as LearnerProfile;
      // Ensure any new concepts added to curriculum get initialized
      const allIds = getAllConceptIds();
      for (const id of allIds) {
        if (!parsed.conceptStates[id]) {
          parsed.conceptStates[id] = createInitialConceptState();
        }
      }
      parsed.currentSessionStart = Date.now();
      if (!parsed.telemetryLog) parsed.telemetryLog = [];
      return parsed;
    }
  } catch {
    // Fall through to default
  }
  return createInitialProfile();
};

// ============================================================================
// Actions
// ============================================================================

type LearnerAction =
  | { type: 'RECORD_QUIZ_ATTEMPT'; conceptId: string; attempt: QuizAttempt }
  | { type: 'UPDATE_MASTERY'; conceptId: string; masteryProbability: number }
  | { type: 'SET_NEXT_REVIEW'; conceptId: string; timestamp: number }
  | { type: 'MARK_EXPLORED'; conceptId: string }
  | { type: 'RECORD_SESSION'; session: SessionRecord }
  | { type: 'RESET_PROGRESS' }
  | { type: 'SET_PROFILE'; profile: LearnerProfile }
  | { type: 'SET_ONBOARDING'; profile: OnboardingProfile; masteryUpdates: Record<string, number> }
  | { type: 'LOG_TELEMETRY_EVENT'; event: TelemetryEvent }
  | { type: 'APPLY_FORGETTING' };

// ============================================================================
// Reducer
// ============================================================================

function learnerReducer(state: LearnerProfile, action: LearnerAction): LearnerProfile {
  switch (action.type) {
    case 'RECORD_QUIZ_ATTEMPT': {
      const cs = state.conceptStates[action.conceptId] || createInitialConceptState();
      const newHistory = [...cs.attemptHistory, action.attempt];
      const consecutiveCorrect = action.attempt.correct ? cs.consecutiveCorrect + 1 : 0;
      return {
        ...state,
        conceptStates: {
          ...state.conceptStates,
          [action.conceptId]: {
            ...cs,
            attemptHistory: newHistory,
            consecutiveCorrect,
          },
        },
      };
    }

    case 'UPDATE_MASTERY': {
      const cs = state.conceptStates[action.conceptId] || createInitialConceptState();
      return {
        ...state,
        conceptStates: {
          ...state.conceptStates,
          [action.conceptId]: {
            ...cs,
            masteryProbability: action.masteryProbability,
          },
        },
      };
    }

    case 'SET_NEXT_REVIEW': {
      const cs = state.conceptStates[action.conceptId] || createInitialConceptState();
      return {
        ...state,
        conceptStates: {
          ...state.conceptStates,
          [action.conceptId]: {
            ...cs,
            nextReviewTimestamp: action.timestamp,
          },
        },
      };
    }

    case 'MARK_EXPLORED': {
      const cs = state.conceptStates[action.conceptId] || createInitialConceptState();
      return {
        ...state,
        conceptStates: {
          ...state.conceptStates,
          [action.conceptId]: {
            ...cs,
            explored: true,
          },
        },
      };
    }

    case 'RECORD_SESSION':
      return {
        ...state,
        sessionHistory: [...state.sessionHistory, action.session],
        totalStudyTimeMinutes: state.totalStudyTimeMinutes + action.session.durationMinutes,
      };

    case 'RESET_PROGRESS':
      return createInitialProfile();

    case 'SET_PROFILE':
      return action.profile;

    case 'SET_ONBOARDING': {
      const updatedStates = { ...state.conceptStates };
      for (const [conceptId, mastery] of Object.entries(action.masteryUpdates)) {
        const cs = updatedStates[conceptId] || createInitialConceptState();
        updatedStates[conceptId] = { ...cs, masteryProbability: mastery };
      }
      return {
        ...state,
        onboardingProfile: action.profile,
        conceptStates: updatedStates,
        telemetryLog: [
          ...state.telemetryLog,
          { type: 'onboarding_complete' as const, timestamp: Date.now(), data: { experienceLevel: action.profile.experienceLevel, learningGoal: action.profile.learningGoal } },
        ],
      };
    }

    case 'LOG_TELEMETRY_EVENT': {
      const newLog = [...state.telemetryLog, action.event];
      return {
        ...state,
        telemetryLog: newLog.length > 1000 ? newLog.slice(-1000) : newLog,
      };
    }

    case 'APPLY_FORGETTING': {
      const MS_PER_DAY = 86_400_000;
      const updatedStates = { ...state.conceptStates };
      for (const [conceptId, conceptState] of Object.entries(updatedStates)) {
        if (conceptState.attemptHistory.length > 0) {
          const daysSince = (Date.now() - conceptState.nextReviewTimestamp) / MS_PER_DAY;
          const concept = getConcept(conceptId);
          const tier = concept?.tier ?? 1;
          const decayed = applyForgetting(conceptState.masteryProbability, daysSince, tier);
          updatedStates[conceptId] = { ...conceptState, masteryProbability: decayed };
        }
      }
      return { ...state, conceptStates: updatedStates };
    }

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

interface LearnerContextValue {
  profile: LearnerProfile;
  dispatch: React.Dispatch<LearnerAction>;
  // Convenience helpers
  getMastery: (conceptId: string) => number;
  getConceptState: (conceptId: string) => ConceptState;
  isExplored: (conceptId: string) => boolean;
  recordAttempt: (conceptId: string, correct: boolean, difficulty: Difficulty, hintsUsed: number) => void;
  updateMastery: (conceptId: string, probability: number) => void;
  setNextReview: (conceptId: string, timestamp: number) => void;
  markExplored: (conceptId: string) => void;
  resetProgress: () => void;
  setOnboarding: (profile: OnboardingProfile, masteryUpdates: Record<string, number>) => void;
  logTelemetryEvent: (event: TelemetryEvent) => void;
  applyForgettingAll: () => void;
  clearOnboarding: () => void;
}

export const LearnerContext = createContext<LearnerContextValue | null>(null);

// ============================================================================
// Hook
// ============================================================================

export function useLearnerReducer() {
  const [profile, dispatch] = useReducer(learnerReducer, null, loadProfile);

  const profileRef = useRef(profile);
  profileRef.current = profile;

  // Persist to localStorage on every state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // localStorage full or unavailable
    }
  }, [profile]);

  const getMastery = useCallback(
    (conceptId: string) => profileRef.current.conceptStates[conceptId]?.masteryProbability ?? 0.1,
    []
  );

  const getConceptState = useCallback(
    (conceptId: string): ConceptState =>
      profileRef.current.conceptStates[conceptId] || createInitialConceptState(),
    []
  );

  const isExplored = useCallback(
    (conceptId: string) => profileRef.current.conceptStates[conceptId]?.explored ?? false,
    []
  );

  const recordAttempt = useCallback(
    (conceptId: string, correct: boolean, difficulty: Difficulty, hintsUsed: number) => {
      dispatch({
        type: 'RECORD_QUIZ_ATTEMPT',
        conceptId,
        attempt: { timestamp: Date.now(), correct, difficulty, hintsUsed },
      });
    },
    []
  );

  const updateMastery = useCallback(
    (conceptId: string, probability: number) => {
      dispatch({ type: 'UPDATE_MASTERY', conceptId, masteryProbability: probability });
    },
    []
  );

  const setNextReview = useCallback(
    (conceptId: string, timestamp: number) => {
      dispatch({ type: 'SET_NEXT_REVIEW', conceptId, timestamp });
    },
    []
  );

  const markExplored = useCallback(
    (conceptId: string) => {
      dispatch({ type: 'MARK_EXPLORED', conceptId });
    },
    []
  );

  const resetProgress = useCallback(() => {
    dispatch({ type: 'RESET_PROGRESS' });
  }, []);

  const setOnboarding = useCallback(
    (onboardingProfile: OnboardingProfile, masteryUpdates: Record<string, number>) => {
      dispatch({ type: 'SET_ONBOARDING', profile: onboardingProfile, masteryUpdates });
    },
    []
  );

  const logTelemetryEvent = useCallback(
    (event: TelemetryEvent) => {
      dispatch({ type: 'LOG_TELEMETRY_EVENT', event });
    },
    []
  );

  const applyForgettingAll = useCallback(() => {
    dispatch({ type: 'APPLY_FORGETTING' });
  }, []);

  const clearOnboarding = useCallback(() => {
    const newProfile = createInitialProfile();
    newProfile.telemetryLog = profile.telemetryLog;
    dispatch({ type: 'SET_PROFILE', profile: newProfile });
  }, [profile.telemetryLog]);

  return {
    profile,
    dispatch,
    getMastery,
    getConceptState,
    isExplored,
    recordAttempt,
    updateMastery,
    setNextReview,
    markExplored,
    resetProgress,
    setOnboarding,
    logTelemetryEvent,
    applyForgettingAll,
    clearOnboarding,
  };
}

export function useLearner(): LearnerContextValue {
  const ctx = useContext(LearnerContext);
  if (!ctx) throw new Error('useLearner must be used within a LearnerProvider');
  return ctx;
}
