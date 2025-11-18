import React, { useState, useCallback, useMemo } from 'react';
import AITreeDiagram from './components/features/AITreeDiagram';
import { aiConceptsData } from './data/aiConcepts';
import type { TreeNode } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Controls } from './components/features/Controls';
import { NodeDetailModal } from './components/features/NodeDetailModal';
import { MainLayout } from './components/layout/MainLayout';
import { LandingPage } from './pages/LandingPage';
import { CompletionView } from './components/features/CompletionView';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
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

  const isComplete = progress === 100 && allNodeIds.length > 0;

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

  const handleRestart = () => {
    if (window.confirm("Are you sure you want to reset your progress?")) {
      setMasteredNodes({});
      setHasStarted(false);
    }
  }

  if (!hasStarted) {
    return <LandingPage onStart={() => setHasStarted(true)} />;
  }

  return (
    <MainLayout progress={progress}>
      {isComplete && <CompletionView onReset={handleRestart} />}
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
    </MainLayout>
  );
};

export default App;