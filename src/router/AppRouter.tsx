import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

// Lazy-load heavy components
const LandingPage = lazy(() => import('../pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LearnView = lazy(() => import('../pages/LearnView').then(m => ({ default: m.LearnView })));
const AboutPage = lazy(() => import('../components/features/AboutPage').then(m => ({ default: m.AboutPage })));
const AIPioneers = lazy(() => import('../components/features/AIPioneers').then(m => ({ default: m.AIPioneers })));
const ProgressDashboard = lazy(() => import('../components/features/ProgressDashboard').then(m => ({ default: m.ProgressDashboard })));
const ReviewQueue = lazy(() => import('../components/features/ReviewQueue').then(m => ({ default: m.ReviewQueue })));

// Explorations (named exports → wrapped for lazy)
const GradientDescent = lazy(() => import('../components/explorations/GradientDescent').then(m => ({ default: m.GradientDescent })));
const NeuralNetworkBuilder = lazy(() => import('../components/explorations/NeuralNetworkBuilder').then(m => ({ default: m.NeuralNetworkBuilder })));
const AttentionVisualizer = lazy(() => import('../components/explorations/AttentionVisualizer').then(m => ({ default: m.AttentionVisualizer })));
const RLGridworld = lazy(() => import('../components/explorations/RLGridworld').then(m => ({ default: m.RLGridworld })));
const DecisionBoundary = lazy(() => import('../components/explorations/DecisionBoundary').then(m => ({ default: m.DecisionBoundary })));
const DataPreprocessing = lazy(() => import('../components/explorations/DataPreprocessing').then(m => ({ default: m.DataPreprocessing })));

export type Route =
  | { page: 'landing' }
  | { page: 'learn'; conceptId?: string }
  | { page: 'explore'; explorationId: string }
  | { page: 'dashboard' }
  | { page: 'review' }
  | { page: 'about' }
  | { page: 'pioneers' };

function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  if (!h || h === '/') return { page: 'landing' };
  if (h === 'learn') return { page: 'learn' };
  if (h.startsWith('learn/')) return { page: 'learn', conceptId: h.split('/')[1] };
  if (h.startsWith('explore/')) return { page: 'explore', explorationId: h.split('/')[1] };
  if (h === 'dashboard') return { page: 'dashboard' };
  if (h === 'review') return { page: 'review' };
  if (h === 'about') return { page: 'about' };
  if (h === 'pioneers') return { page: 'pioneers' };
  return { page: 'landing' };
}

export function navigate(path: string) {
  window.location.hash = path;
}

const routeChangeListeners: Array<(route: Route) => void> = [];

export function onRouteChange(listener: (route: Route) => void) {
  routeChangeListeners.push(listener);
  return () => {
    const idx = routeChangeListeners.indexOf(listener);
    if (idx >= 0) routeChangeListeners.splice(idx, 1);
  };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      const newRoute = parseHash(window.location.hash);
      setRoute(newRoute);
      routeChangeListeners.forEach(l => l(newRoute));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return route;
}

const EXPLORATION_MAP: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  'gradient-descent': GradientDescent,
  'neural-network': NeuralNetworkBuilder,
  'attention': AttentionVisualizer,
  'rl-gridworld': RLGridworld,
  'decision-boundary': DecisionBoundary,
  'data-preprocessing': DataPreprocessing,
};

const LoadingFallback = () => (
  <div className="flex flex-col gap-4 p-8 max-w-2xl mx-auto animate-pulse">
    <div className="h-8 w-48 rounded-full bg-white/[0.05]" />
    <div className="h-4 w-full rounded-full bg-white/[0.05]" />
    <div className="h-4 w-3/4 rounded-full bg-white/[0.05]" />
    <div className="grid grid-cols-3 gap-3 mt-4">
      <div className="h-24 rounded-2xl bg-white/[0.05]" />
      <div className="h-24 rounded-2xl bg-white/[0.05]" />
      <div className="h-24 rounded-2xl bg-white/[0.05]" />
    </div>
  </div>
);

export const AppRouter: React.FC = () => {
  const route = useRoute();

  const handleExplorationClose = useCallback(() => {
    navigate('/learn');
  }, []);

  return (
    <ErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      {route.page === 'landing' && <LandingPage />}
      {route.page === 'learn' && <LearnView initialConceptId={route.conceptId} />}
      {route.page === 'explore' && (() => {
        const ExplorationComponent = EXPLORATION_MAP[route.explorationId];
        if (!ExplorationComponent) {
          return (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-sm text-white/40 font-light tracking-wide mb-4">Exploration not found: {route.explorationId}</p>
                <button onClick={() => navigate('/learn')} className="bg-white/[0.10] border border-white/[0.10] text-white/80 rounded-full px-6 py-2.5 text-sm font-light">
                  Back to Learning
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between glass rounded-full mx-4 mt-4 px-4 py-2">
              <button
                onClick={handleExplorationClose}
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Graph
              </button>
              <span className="text-sm text-white/40 font-light capitalize">
                {route.explorationId.replace(/-/g, ' ')}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              <ExplorationComponent onComplete={() => {}} />
            </div>
          </div>
        );
      })()}
      {route.page === 'dashboard' && (
          <Suspense fallback={<LoadingFallback />}>
            <div className="h-full overflow-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-light tracking-[0.05em] text-white/85">Progress Dashboard</h1>
                <button onClick={() => navigate('/learn')} className="text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors">
                  Back to Learning
                </button>
              </div>
              <ProgressDashboard fullPage />
            </div>
          </Suspense>
      )}
      {route.page === 'review' && (
          <Suspense fallback={<LoadingFallback />}>
            <div className="h-full overflow-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-light tracking-[0.05em] text-white/85">Review Queue</h1>
                <button onClick={() => navigate('/learn')} className="text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors">
                  Back to Learning
                </button>
              </div>
              <ReviewQueue onSelectConcept={(id) => navigate(`/learn/${id}`)} />
            </div>
          </Suspense>
      )}
      {route.page === 'about' && <AboutPage />}
      {route.page === 'pioneers' && <AIPioneers />}
    </Suspense>
    </ErrorBoundary>
  );
};
