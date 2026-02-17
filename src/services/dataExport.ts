import type { LearnerProfile } from '../types';

export function exportLearnerData(profile: LearnerProfile): string {
  return JSON.stringify({
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    onboardingProfile: profile.onboardingProfile ?? null,
    conceptStates: profile.conceptStates,
    sessionHistory: profile.sessionHistory,
    totalStudyTimeMinutes: profile.totalStudyTimeMinutes,
    telemetryEventCount: profile.telemetryLog.length,
    telemetryEvents: profile.telemetryLog,
  }, null, 2);
}

export function downloadLearnerData(profile: LearnerProfile): void {
  const data = exportLearnerData(profile);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-learning-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
