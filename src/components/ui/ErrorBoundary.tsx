import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div
                    className="flex items-center justify-center h-screen text-her-dark dark:text-her-cream transition-colors"
                    role="alert"
                    aria-live="assertive"
                >
                    <div className="text-center p-8 glass rounded-2xl max-w-md">
                        <h1 className="text-2xl font-semibold text-her-red mb-3">Something went wrong</h1>
                        <p className="text-sm text-her-dark/50 dark:text-her-cream/50 mb-6">An unexpected error occurred. Please try reloading.</p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2.5 bg-white dark:bg-white/15 text-her-dark dark:text-her-cream rounded-full transition-colors text-sm font-medium"
                            >
                                Retry
                            </button>
                            <a
                                href="/"
                                className="px-6 py-2.5 bg-her-dark/5 dark:bg-white/5 text-her-dark dark:text-her-cream rounded-full hover:bg-her-dark/10 dark:hover:bg-white/10 transition-colors text-sm font-medium"
                            >
                                Back to Home
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return (this as unknown as { props: Props }).props.children;
    }
}
