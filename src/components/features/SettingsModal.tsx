import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLearner } from '../../stores/learnerStore';
import { exportTelemetry } from '../../services/telemetry';
import { downloadLearnerData } from '../../services/dataExport';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [saved, setSaved] = useState(false);
    const { profile, clearOnboarding } = useLearner();
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
        }
    }, [isOpen]);

    // Focus trap and management
    useEffect(() => {
        if (!isOpen) return;

        // Store previously focused element
        previousFocusRef.current = document.activeElement as HTMLElement;

        // Focus first focusable element
        const timer = setTimeout(() => {
            const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
                'button, input, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable && focusable.length > 0) {
                focusable[0].focus();
            }
        }, 50);

        return () => {
            clearTimeout(timer);
            // Return focus on unmount
            previousFocusRef.current?.focus();
        };
    }, [isOpen]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
            return;
        }
        if (e.key === 'Tab') {
            const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
                'button, input, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusable || focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }, [onClose]);

    const handleSave = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            onClose();
        }, 1000);
    };

    const handleClear = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
    };

    const handleRetakeOnboarding = () => {
        clearOnboarding();
        onClose();
    };

    const handleExportData = () => {
        const telemetryJson = exportTelemetry(profile);
        const blob = new Blob([telemetryJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-learning-telemetry-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportLearnerData = () => {
        downloadLearnerData(profile);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
        >
            <div
                ref={modalRef}
                className="glass-strong rounded-2xl shadow-lg p-6 w-full max-w-md m-4 animate-slide-up"
                onClick={e => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 id="settings-title" className="text-sm uppercase tracking-[0.2em] font-medium text-her-dark dark:text-her-cream">Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-her-dark/40 dark:text-her-cream/40 hover:text-her-dark dark:hover:text-her-cream transition-colors"
                        aria-label="Close settings"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* API Key Section */}
                <div className="mb-6">
                    <label htmlFor="api-key-input" className="block text-sm font-medium text-her-dark/60 dark:text-her-cream/60 mb-2">
                        Gemini API Key
                    </label>
                    <p className="text-xs text-her-dark/40 dark:text-her-cream/40 mb-3">
                        Your API key is stored locally and never sent to external servers.
                        Get a key from{' '}
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-her-red hover:underline">
                            Google AI Studio
                        </a>.
                    </p>
                    <input
                        id="api-key-input"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your Gemini API Key"
                        className="w-full rounded-full bg-white/5 border border-her-dark/10 dark:border-white/10 focus:border-her-red/30 px-4 py-2.5 text-her-dark dark:text-her-cream text-sm focus:outline-none transition-colors placeholder-her-dark/30 dark:placeholder-her-cream/30"
                    />
                </div>

                <div className="flex gap-3 mb-6">
                    <button
                        onClick={handleSave}
                        className={`flex-1 py-2.5 px-4 rounded-full font-medium text-sm transition-all ${
                            saved
                                ? 'bg-white dark:bg-white/15 text-her-dark dark:text-her-cream'
                                : 'bg-white dark:bg-white/15 text-her-dark dark:text-her-cream hover:shadow-sm'
                        }`}
                    >
                        {saved ? 'Saved' : 'Save Key'}
                    </button>
                    {apiKey && (
                        <button
                            onClick={handleClear}
                            className="px-4 py-2.5 rounded-full border border-her-red/30 text-her-red text-sm hover:bg-her-red/5 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Divider */}
                <div className="border-t border-her-dark/5 dark:border-white/5 my-4" />

                {/* Learning Profile Section */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-her-dark/60 dark:text-her-cream/60">Learning Profile</h3>

                    {profile.onboardingProfile && (
                        <div className="text-xs text-her-dark/40 dark:text-her-cream/40 space-y-1">
                            <p>Level: <span className="text-her-dark/80 dark:text-her-cream/80 capitalize">{profile.onboardingProfile.experienceLevel}</span></p>
                            <p>Goal: <span className="text-her-dark/80 dark:text-her-cream/80 capitalize">{profile.onboardingProfile.learningGoal}</span></p>
                            <p>Completed: <span className="text-her-dark/80 dark:text-her-cream/80">{new Date(profile.onboardingProfile.completedAt).toLocaleDateString()}</span></p>
                        </div>
                    )}

                    <button
                        onClick={handleRetakeOnboarding}
                        className="w-full py-2 px-4 rounded-full border border-her-red/30 text-her-red text-sm hover:bg-her-red/5 transition-colors"
                    >
                        Retake Onboarding
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={handleExportLearnerData}
                            className="flex-1 py-2 px-3 rounded-full border border-her-dark/10 dark:border-white/10 text-her-dark/50 dark:text-her-cream/50 text-xs hover:bg-her-dark/5 dark:hover:bg-white/5 transition-colors"
                        >
                            Export Learner Data
                        </button>
                        <button
                            onClick={handleExportData}
                            className="flex-1 py-2 px-3 rounded-full border border-her-dark/10 dark:border-white/10 text-her-dark/50 dark:text-her-cream/50 text-xs hover:bg-her-dark/5 dark:hover:bg-white/5 transition-colors"
                        >
                            Export Telemetry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
