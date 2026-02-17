import React, { useState, useCallback } from 'react';
import { KnowledgeGraph } from '../components/features/KnowledgeGraph';
import { NodeDetailModal } from '../components/features/NodeDetailModal';
import { navigate } from '../router/AppRouter';

interface LearnViewProps {
  initialConceptId?: string;
}

export const LearnView: React.FC<LearnViewProps> = ({ initialConceptId }) => {
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(initialConceptId || null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectNode = useCallback((conceptId: string) => {
    setSelectedConceptId(conceptId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedConceptId(null);
  }, []);

  const handleOpenExploration = useCallback((explorationId: string) => {
    navigate(`/explore/${explorationId}`);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="flex items-center gap-3 glass rounded-full px-4 py-2 mx-4 mt-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-her-dark/40 dark:text-her-cream/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search concepts..."
          className="flex-1 bg-transparent text-sm text-her-dark dark:text-her-cream placeholder-her-dark/30 dark:placeholder-her-cream/30 outline-none"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-xs text-her-dark/40 dark:text-her-cream/40 hover:text-her-red">
            Clear
          </button>
        )}
      </div>

      {/* Graph */}
      <div className="flex-1 relative">
        <KnowledgeGraph
          searchTerm={searchTerm}
          onSelectNode={handleSelectNode}
          selectedNodeId={selectedConceptId}
        />
      </div>

      {/* Detail panel */}
      {selectedConceptId && (
        <NodeDetailModal
          conceptId={selectedConceptId}
          onClose={handleCloseDetail}
          onOpenExploration={handleOpenExploration}
        />
      )}
    </div>
  );
};
