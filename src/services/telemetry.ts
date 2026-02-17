import type { TelemetryEvent, TelemetryEventType, TelemetryPayloadMap, LearnerProfile } from '../types';

export function createTelemetryEvent<K extends TelemetryEventType>(
  type: K,
  data: TelemetryPayloadMap[K] = {} as TelemetryPayloadMap[K],
): TelemetryEvent {
  return {
    type,
    timestamp: Date.now(),
    data,
  } as TelemetryEvent;
}

export function exportTelemetry(profile: LearnerProfile): string {
  return JSON.stringify({
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    onboardingProfile: profile.onboardingProfile ?? null,
    telemetryLog: profile.telemetryLog,
    sessionHistory: profile.sessionHistory,
    totalStudyTimeMinutes: profile.totalStudyTimeMinutes,
    conceptMastery: Object.fromEntries(
      Object.entries(profile.conceptStates).map(([id, state]) => [
        id,
        {
          mastery: state.masteryProbability,
          attempts: state.attemptHistory.length,
          explored: state.explored,
        },
      ]),
    ),
  }, null, 2);
}
