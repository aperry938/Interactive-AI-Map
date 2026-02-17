import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToastMessage } from '../../hooks/useToast';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

const variantStyles: Record<string, string> = {
  success: 'glass text-emerald-500 border-emerald-500/20',
  info: 'glass text-her-dark/80 dark:text-her-cream/80 border-her-dark/10 dark:border-white/10',
  warning: 'glass text-amber-500 border-amber-500/20',
};

const variantIcons: Record<string, string> = {
  success: '\u2713',
  info: '\u2139',
  warning: '\u26A0',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none" aria-live="polite">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-lg text-sm font-medium ${variantStyles[toast.variant]}`}
            onClick={() => onRemove(toast.id)}
            role="status"
          >
            <span className="text-base">{variantIcons[toast.variant]}</span>
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
