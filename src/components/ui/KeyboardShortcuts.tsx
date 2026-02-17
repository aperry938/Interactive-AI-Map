import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const shortcuts = [
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'Esc', description: 'Close modals and overlays' },
  { key: '\u2190 \u2191 \u2192 \u2193', description: 'Navigate knowledge graph nodes' },
  { key: 'Enter', description: 'Open selected node detail' },
  { key: 'Tab', description: 'Cycle through interactive elements' },
];

export const KeyboardShortcuts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.key === '?') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-[#0A0707]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-xl p-6 w-full max-w-sm m-4"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-white/50">Keyboard Shortcuts</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-white/25 hover:text-white/60 rounded transition-colors"
                aria-label="Close shortcuts"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {shortcuts.map(s => (
                <div key={s.key} className="flex items-center justify-between">
                  <span className="text-sm text-white/50">{s.description}</span>
                  <kbd className="glass rounded px-2 py-1 text-xs font-mono text-white/60 min-w-[2rem] text-center">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/20 mt-4 text-center">Press ? to toggle this overlay</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
