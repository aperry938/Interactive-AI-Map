import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AITreeDiagram } from './components/features/AITreeDiagram';
import { aiConceptsData } from './data/aiConcepts';
import type { TreeNode } from './types';
import { Controls } from './components/features/Controls';
import { NodeDetailModal } from './components/features/NodeDetailModal';
import { LandingPage } from './pages/LandingPage';
import { CompletionView } from './components/features/CompletionView';
import { SettingsModal } from './components/features/SettingsModal';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [resetViewToggle, setResetViewToggle] = useState(false);
  const [masteredNodes, setMasteredNodes] = useState<string[]>(() => {
    const saved = localStorage.getItem('masteredNodes');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('masteredNodes', JSON.stringify(masteredNodes));
  }, [masteredNodes]);

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
    const masteredCount = masteredNodes.length;
    return (masteredCount / allNodeIds.length) * 100;
  }, [masteredNodes, allNodeIds]);

  const isComplete = progress === 100 && allNodeIds.length > 0;

  const handleNodeSelect = (node: TreeNode | null) => {
    setSelectedNode(node);
  };

  const handleMasterNode = (nodeId: string) => {
    if (!masteredNodes.includes(nodeId)) {
      setMasteredNodes(prev => [...prev, nodeId]);
    }
  };

  const handleRestart = () => {
    if (window.confirm("Are you sure you want to reset your progress?")) {
      setMasteredNodes([]);
      setHasStarted(false);
    }
  }

  if (!hasStarted) {
    return <LandingPage onStart={() => setHasStarted(true)} />;
  }

  if (isComplete) {
    return <CompletionView onReset={handleRestart} />
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#030712]">
      <div className="absolute top-4 left-4 z-10 flex gap-4">
        <Controls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onResetView={() => setResetViewToggle(!resetViewToggle)}
        />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-cyan-400 rounded-lg border border-gray-700 backdrop-blur-sm transition-all"
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 text-white/50 text-sm font-mono">
        Mastery: {masteredNodes.length} / {allNodeIds.length}
      </div>

      <AITreeDiagram
        data={aiConceptsData}
        searchTerm={searchTerm}
        onNodeSelect={handleNodeSelect}
        resetViewToggle={resetViewToggle}
        masteredNodes={masteredNodes}
      />

      {selectedNode && (
        <NodeDetailModal
          node={selectedNode}
          isMastered={masteredNodes.includes(selectedNode.id)}
          onClose={() => setSelectedNode(null)}
          onMaster={handleMasterNode}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;