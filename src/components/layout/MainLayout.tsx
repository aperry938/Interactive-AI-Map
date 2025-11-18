import React from 'react';
import { ProgressBar } from '../ui/ProgressBar';

interface MainLayoutProps {
    children: React.ReactNode;
    progress: number;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, progress }) => {
    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
            <header className="p-4 border-b border-gray-700/50 shadow-lg bg-gray-900/50 backdrop-blur-sm z-30">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-xl md:text-2xl font-bold text-cyan-400 tracking-wider text-center glow-text">
                        Your AI Learning Journey
                    </h1>
                    <ProgressBar progress={progress} />
                </div>
            </header>
            <main className="flex-grow relative">
                {children}
            </main>
        </div>
    );
};
