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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { getMastery } = useLearner();

  const allIds = Object.keys(curriculum);
  const masteredCount = allIds.filter(id => getMastery(id) >= MASTERY_THRESHOLD).length;

  // Don't show header on landing page or map (map has its own floating controls)
  if (route.page === 'landing' || route.page === 'map') {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <main role="main" className="flex-grow relative transition-colors duration-300">
          {children}
        </main>
      </div>
    );
  }

  const navItems = [
    { path: '/map', label: 'Map', page: 'map' },
    { path: '/learn', label: 'List', page: 'learn' },
    { path: '/dashboard', label: 'Dashboard', page: 'dashboard' },
    { path: '/review', label: 'Review', page: 'review' },
    { path: '/pioneers', label: 'Encyclopedia', page: 'pioneers' },
    { path: '/methodology', label: 'Methodology', page: 'methodology' },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white/10 focus:text-white focus:rounded-full focus:text-xs focus:tracking-wider"
      >
        Skip to content
      </a>

      <header role="banner" className="fixed top-0 left-0 right-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <button
              onClick={() => navigate('/')}
              className="text-[10px] uppercase tracking-[0.3em] text-white/50 hover:text-white/80 font-medium transition-colors duration-300"
              aria-label="Go to home page"
            >
              A.P.
            </button>

            {/* Center: Nav links */}
            <nav role="navigation" aria-label="Main navigation" className="hidden md:flex items-center gap-4">
              {navItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  aria-current={route.page === item.page ? 'page' : undefined}
                  className={`text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                    route.page === item.page
                      ? 'text-white/70'
                      : 'text-white/25 hover:text-white/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-white/20 tabular-nums tracking-wider hidden sm:inline">
                {masteredCount}/{allIds.length}
              </span>

              <button
                onClick={onToggleTheme}
                className="text-white/20 hover:text-white/50 transition-colors duration-300"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-white/20 hover:text-white/50 transition-colors duration-300"
                aria-label="Open settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="md:hidden text-white/25 hover:text-white/50 transition-colors duration-300"
                aria-label="Toggle navigation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  {mobileNavOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile nav dropdown */}
          {mobileNavOpen && (
            <nav className="md:hidden mt-6 pb-2 border-t border-white/[0.06] pt-4 flex flex-col gap-3">
              {navItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileNavOpen(false); }}
                  className={`text-left text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                    route.page === item.page
                      ? 'text-white/70'
                      : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main id="main-content" role="main" className="flex-grow relative pt-14 transition-colors duration-300 overflow-y-auto">
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
