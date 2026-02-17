import { useEffect } from 'react';

export function useTheme() {
  // App is permanently dark — ensure dark class is always applied
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return { isDark: true, toggle: () => {} };
}
