import React, { useState, useCallback, useEffect, useMemo } from 'react';
import AITreeDiagram from './components/AITreeDiagram';
import { aiConceptsData } from './data/aiConcepts';
import type { Quiz, TreeNode } from './types';

// --- Helper Hook for localStorage ---
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}


// --- UI Components ---

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="w-full bg-gray-700/50 rounded-full h-2.5 my-2">
    <div
      className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2.5 rounded-full transition-all duration-500"
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

const Controls: React.FC<{
  onSearch: (term: string) => void;
  onReset: () => void;
  searchTerm: string;
}> = ({ onSearch, onReset, searchTerm }) => (
  <div className="absolute top-4 right-4 z-10 flex items-center gap-2 p-2 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700">
    <input
      type="text"
      placeholder="Search concepts..."
      value={searchTerm}
      onChange={(e) => onSearch(e.target.value)}
      className="bg-gray-700 text-white placeholder-gray-400 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-48"
      aria-label="Search AI Concepts"
    />
    <button
      onClick={onReset}
      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200"
      aria-label="Reset View"
      title="Reset View"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
      </svg>
    </button>
  </div>
);

const QuizComponent: React.FC<{ quiz: Quiz, onComplete: (correct: boolean) => void }> = ({ quiz, onComplete }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setIsSubmitted(true);
    onComplete(selectedAnswer === quiz.correctAnswer);
  };

  return (
    <div className="mt-6 border-t border-cyan-400/20 pt-4">
      <h3 className="font-semibold text-lg text-white mb-2">{quiz.question}</h3>
      <div className="space-y-2">
        {quiz.options.map((option) => {
          const isCorrect = option === quiz.correctAnswer;
          const isSelected = option === selectedAnswer;
          let buttonClass = "w-full text-left p-3 rounded-lg border transition-all duration-200 ";
          if (isSubmitted) {
            if (isCorrect) {
              buttonClass += "bg-green-500/30 border-green-400 text-white";
            } else if (isSelected) {
              buttonClass += "bg-red-500/30 border-red-400 text-white";
            } else {
               buttonClass += "bg-gray-700 border-gray-600 text-gray-400";
            }
          } else {
            if (isSelected) {
              buttonClass += "bg-cyan-500/30 border-cyan-400 text-white";
            } else {
              buttonClass += "bg-gray-700/50 border-gray-600 hover:bg-gray-700";
            }
          }
          return (
             <button key={option} onClick={() => !isSubmitted && setSelectedAnswer(option)} disabled={isSubmitted} className={buttonClass}>
                {option}
              </button>
          )
        })}
      </div>
      {!isSubmitted && (
         <button onClick={handleSubmit} disabled={selectedAnswer === null} className="mt-4 w-full font-bold py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-gray-900 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
           Submit Answer
         </button>
      )}
    </div>
  );
};


const NodeDetailModal: React.FC<{
  node: TreeNode;
  isMastered: boolean;
  onClose: () => void;
  onMaster: (nodeId: string) => void;
}> = ({ node, isMastered, onClose, onMaster }) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<boolean | null>(null);

  const handleQuizComplete = (correct: boolean) => {
      setQuizResult(correct);
      if(correct) {
          onMaster(node.id);
      }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-gray-800/80 border border-gray-700 rounded-xl shadow-2xl m-4 transform transition-all duration-300 ease-in-out" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-cyan-400 pr-4 glow-text">{node.name}</h2>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full" aria-label="Close Panel">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-4 text-gray-300">
            <p className="whitespace-pre-wrap">{node.description || "No description available."}</p>
            {node.link && (
              <a href={node.link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-cyan-400 hover:text-cyan-300 hover:underline">
                Learn More &rarr;
              </a>
            )}
             {isMastered ? (
                <div className="mt-6 p-3 rounded-lg bg-green-500/20 text-green-300 border border-green-400/50 text-center font-semibold">
                    ✨ Concept Mastered! ✨
                </div>
            ) : showQuiz ? (
              <QuizComponent quiz={node.quiz!} onComplete={handleQuizComplete} />
            ) : node.quiz ? (
                <button onClick={() => setShowQuiz(true)} className="mt-6 w-full font-bold py-2 px-4 rounded-lg bg-purple-500 hover:bg-purple-400 text-white transition-colors">
                  Test Your Knowledge
                </button>
            ) : null}

            {quizResult !== null && !quizResult && (
                <p className="text-red-400 text-center mt-4">Not quite! Review the material and try again later.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [resetViewToggle, setResetViewToggle] = useState(false);
  const [masteredNodes, setMasteredNodes] = useLocalStorage<Record<string, boolean>>('masteredNodes', {});

  const allNodeIds = useMemo(() => {
    const ids: string[] = [];
    function traverse(node: TreeNode) {
      if (node.quiz) ids.push(node.id);
      if (node.children) node.children.forEach(traverse);
    }
    traverse(aiConceptsData);
    return ids;
  }, []);

  const progress = useMemo(() => {
    if (allNodeIds.length === 0) return 0;
    const masteredCount = Object.keys(masteredNodes).filter(id => masteredNodes[id]).length;
    return (masteredCount / allNodeIds.length) * 100;
  }, [masteredNodes, allNodeIds]);
  
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setSelectedNode(null);
  };

  const handleNodeSelect = useCallback((node: TreeNode | null) => {
    setSelectedNode(node);
  }, []);

  const handleReset = () => {
    setSearchTerm('');
    setSelectedNode(null);
    setResetViewToggle(v => !v);
  };
  
  const handleMasterNode = (nodeId: string) => {
    setMasteredNodes({ ...masteredNodes, [nodeId]: true });
  }

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
        <Controls onSearch={handleSearch} onReset={handleReset} searchTerm={searchTerm} />
        <AITreeDiagram 
          data={aiConceptsData} 
          searchTerm={searchTerm}
          onNodeSelect={handleNodeSelect}
          resetViewToggle={resetViewToggle}
          masteredNodes={Object.keys(masteredNodes).filter(id => masteredNodes[id])}
        />
        {selectedNode && (
          <NodeDetailModal 
            node={selectedNode} 
            onClose={() => setSelectedNode(null)} 
            isMastered={!!masteredNodes[selectedNode.id]}
            onMaster={handleMasterNode}
          />
        )}
      </main>
    </div>
  );
};

export default App;