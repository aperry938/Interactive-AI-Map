import React from 'react';

interface LandingPageProps {
    onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-center px-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="z-10 max-w-3xl glass-panel p-12 rounded-2xl border border-gray-700/50 shadow-2xl transform transition-all hover:scale-[1.01]">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 glow-text">
                    AI Concept Map
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 mb-8 font-light leading-relaxed">
                    Explore the vast universe of Artificial Intelligence. <br />
                    From <span className="text-cyan-400 font-medium">Machine Learning</span> to <span className="text-purple-400 font-medium">Robotics</span>,
                    visualize how everything connects.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={onStart}
                        className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-lg font-bold rounded-full shadow-lg shadow-cyan-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-cyan-500/50"
                    >
                        Start Exploring
                    </button>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 text-lg font-medium rounded-full border border-gray-600 transition-all duration-300"
                    >
                        View on GitHub
                    </a>
                </div>
            </div>

            <footer className="absolute bottom-6 text-gray-500 text-sm z-10">
                Interactive Learning Experience &copy; {new Date().getFullYear()}
            </footer>
        </div>
    );
};
