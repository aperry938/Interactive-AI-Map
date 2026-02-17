import React, { useEffect } from 'react';
import { LearnerProvider } from './stores/LearnerProvider';
import { MainLayout } from './components/layout/MainLayout';
import { AmbientBackground } from './components/ui/AmbientBackground';
import { AppRouter } from './router/AppRouter';
import { useTheme } from './hooks/useTheme';
import { useLearner } from './stores/learnerStore';
import { OnboardingQuestionnaire } from './components/features/OnboardingQuestionnaire';
import { mapOnboardingToMastery } from './engine/onboarding';
import { curriculum } from './data/curriculum';
import { ToastContext, useToastState } from './hooks/useToast';
import { ToastContainer } from './components/ui/Toast';
import { KeyboardShortcuts } from './components/ui/KeyboardShortcuts';
import { createTelemetryEvent } from './services/telemetry';
import type { OnboardingProfile } from './types';

const AppInner: React.FC = () => {
  const { isDark, toggle: toggleTheme } = useTheme();
  const { profile, setOnboarding, logTelemetryEvent, applyForgettingAll } = useLearner();

  // Log session start
  useEffect(() => {
    logTelemetryEvent(createTelemetryEvent('session_start'));
    const handleUnload = () => {
      // Write session_end event directly to localStorage since reducer may not complete
      try {
        const stored = localStorage.getItem('ai-learning-platform-learner');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.telemetryLog) {
            data.telemetryLog.push({ type: 'session_end', timestamp: Date.now(), data: {} });
            localStorage.setItem('ai-learning-platform-learner', JSON.stringify(data));
          }
        }
      } catch { /* best-effort — ignore storage errors on unload */ }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // Apply forgetting model on mount — decays mastery when learner returns after absence
  useEffect(() => {
    applyForgettingAll();
  }, []);

  const handleOnboardingComplete = (onboardingProfile: OnboardingProfile) => {
    const masteryUpdates = mapOnboardingToMastery(onboardingProfile, curriculum);
    setOnboarding(onboardingProfile, masteryUpdates);
  };

  const handleOnboardingSkip = () => {
    const defaultProfile: OnboardingProfile = {
      experienceLevel: 'beginner',
      mathComfort: 1,
      programmingLevel: 'none',
      mlFamiliarity: [],
      learningGoal: 'explore',
      priorCourses: [],
      completedAt: Date.now(),
    };
    setOnboarding(defaultProfile, {});
  };

  // Show onboarding for first-time users
  if (!profile.onboardingProfile) {
    return (
      <>
        <AmbientBackground />
        <OnboardingQuestionnaire
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      </>
    );
  }

  return (
    <>
      <AmbientBackground />
      <MainLayout isDark={isDark} onToggleTheme={toggleTheme}>
        <AppRouter />
      </MainLayout>
      <KeyboardShortcuts />
    </>
  );
};

const App: React.FC = () => {
  const toastState = useToastState();

  return (
    <ToastContext.Provider value={toastState}>
      <LearnerProvider>
        <AppInner />
        <ToastContainer toasts={toastState.toasts} onRemove={toastState.removeToast} />
      </LearnerProvider>
    </ToastContext.Provider>
  );
};

export default App;
