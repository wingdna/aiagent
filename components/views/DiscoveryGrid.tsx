import React, { useMemo } from 'react';
import { AgentRegistryEntity } from '../../app/types/registry';
import { AgentCard } from '../ui/AgentCard';
import { AgentCardSkeleton } from '../skeletons/AgentCardSkeleton';

interface DiscoveryGridProps {
  initialAgents: AgentRegistryEntity[];
  validCategories?: string[];
  isLoading?: boolean;
}

export const DiscoveryGrid: React.FC<DiscoveryGridProps> = ({ initialAgents, validCategories }) => {
  const filteredAgents = useMemo(() => 
    initialAgents.filter(a => a && a.id && a.category !== 'UNKNOWN'), 
    [initialAgents]
  );

  if (filteredAgents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-white/30 font-mono tracking-widest animate-pulse">
        NO AGENTS FOUND FOR THIS CATEGORY
      </div>
    );
  }

  return (
    <div 
      className="p-4"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '800px' } as React.CSSProperties}
    >
      <div className="max-w-[1800px] mx-auto space-y-12">
        {/* Native Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredAgents.map((agent, index) => (
            <div key={agent.id} className="visible">
              <AgentCard agent={agent} priority={index < 5} validCategories={validCategories} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
