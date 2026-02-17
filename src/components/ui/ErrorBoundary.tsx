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
                    className="flex items-center justify-center h-screen text-white/85"
                    role="alert"
                    aria-live="assertive"
                >
                    <div className="text-center p-8 glass rounded-2xl max-w-md">
                        <h1 className="text-2xl font-light text-white/85 mb-3">Something went wrong</h1>
                        <p className="text-sm text-white/40 mb-6">An unexpected error occurred. Please try reloading.</p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2.5 bg-white/[0.10] border border-white/[0.10] text-white/80 rounded-full transition-colors text-sm font-light"
                            >
                                Retry
                            </button>
                            <a
                                href="/"
                                className="px-6 py-2.5 bg-white/[0.05] border border-white/[0.08] text-white/60 rounded-full hover:bg-white/[0.08] transition-colors text-sm font-light"
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
