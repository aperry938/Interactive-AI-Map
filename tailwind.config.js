/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'her-red': '#D94436',
        'her-orange': '#E87C56',
        'her-cream': '#F2E8DC',
        'her-dark': '#2C1A1A',
        'her-soft': '#E6B8A2',
        // Semantic learning colors
        tier: {
          1: '#3B82F6', // blue — foundations
          2: '#8B5CF6', // purple — core ML
          3: '#EC4899', // pink — deep learning
          4: '#F59E0B', // amber — advanced
          5: '#10B981', // emerald — frontiers
        },
        learn: {
          structure: '#3B82F6',
          attention: '#F59E0B',
          error: '#EF4444',
          convergence: '#10B981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        drift: 'drift 20s ease-in-out infinite',
        'drift-slow': 'drift-slow 30s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 15px) scale(0.95)' },
        },
        'drift-slow': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-25px, -15px) scale(1.03)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      boxShadow: {
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.25)',
        'glow-purple': '0 0 15px rgba(139, 92, 246, 0.25)',
        'glow-pink': '0 0 15px rgba(236, 72, 153, 0.25)',
        'glow-amber': '0 0 15px rgba(245, 158, 11, 0.25)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.25)',
        'glow-white': '0 0 20px rgba(255, 255, 255, 0.15)',
      },
    },
  },
  plugins: [],
};
