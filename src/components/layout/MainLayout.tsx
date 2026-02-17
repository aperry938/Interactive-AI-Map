import React, { useState } from 'react';
import { navigate, useRoute } from '../../router/AppRouter';
import { SettingsModal } from '../features/SettingsModal';
import { useLearner } from '../../stores/learnerStore';
import { curriculum } from '../../data/curriculum';
import { MASTERY_THRESHOLD } from '../../types';

interface MainLayoutProps {
  children: React.ReactNode;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  isDark,
  onToggleTheme,
}) => {
  const route = useRoute();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { getMastery } = useLearner();

  // Calculate overall mastery progress
  const allIds = Object.keys(curriculum);
  const masteredCount = allIds.filter(id => getMastery(id) >= MASTERY_THRESHOLD).length;
  const progress = allIds.length > 0 ? (masteredCount / allIds.length) * 100 : 0;

  // Don't show header on landing page
  if (route.page === 'landing') {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <main role="main" className="flex-grow relative transition-colors duration-300">
          {children}
        </main>
      </div>
    );
  }

  const navItems = [
    { path: '/learn', label: 'Learn', page: 'learn' },
    { path: '/dashboard', label: 'Dashboard', page: 'dashboard' },
    { path: '/review', label: 'Review', page: 'review' },
    { path: '/pioneers', label: 'AI Encyclopedia', page: 'pioneers' },
    { path: '/about', label: 'About', page: 'about' },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-her-red focus:text-white focus:rounded-full focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      <header role="banner" className="glass rounded-full fixed top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-[10px] uppercase tracking-[0.2em] text-her-dark/60 dark:text-her-cream/60 font-medium transition-colors"
              aria-label="Go to home page"
            >
              A.P.
            </button>
            <h1 className="text-[10px] uppercase tracking-[0.2em] text-her-dark/40 dark:text-her-cream/40">
              AI/ML Learning Platform
            </h1>

            {/* Nav links */}
            <nav role="navigation" aria-label="Main navigation" className="hidden sm:flex items-center gap-1 ml-4">
              {navItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  aria-current={route.page === item.page ? 'page' : undefined}
                  className={`px-3 py-1 text-xs rounded-full transition-all ${
                    route.page === item.page
                      ? 'bg-white dark:bg-white/15 text-her-dark dark:text-her-cream shadow-sm'
                      : 'text-her-dark/50 dark:text-her-cream/50 hover:text-her-dark dark:hover:text-her-cream hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 text-her-dark/40 dark:text-her-cream/40 hover:text-her-red rounded-full transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
            {/* Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-her-dark/40 dark:text-her-cream/40 hover:text-her-red rounded-full transition-colors"
              aria-label="Open settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Mastery counter */}
            <span className="text-[10px] text-her-dark/40 dark:text-her-cream/40 ml-2 hidden sm:inline" aria-label={`${masteredCount} of ${allIds.length} concepts mastered`}>
              {masteredCount}/{allIds.length} mastered
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 bg-her-dark/5 dark:bg-white/5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Overall mastery progress">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-her-red via-her-orange to-her-soft"
            style={{ width: `${Math.max(progress, 1)}%` }}
          />
        </div>
      </header>

      <main id="main-content" role="main" className="flex-grow relative pt-20 transition-colors duration-300 overflow-y-auto">
        {children}
      </main>

      {/* Live region for screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="sr-announcements" />

      {isSettingsOpen && (
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
};
