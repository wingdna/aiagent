import React from 'react';

export const AgentCardSkeleton: React.FC = () => (
  <div className="group relative bg-[#050505] rounded-xl border border-white/5 overflow-hidden animate-pulse">
    <div className="aspect-video w-full bg-white/5" />
    <div className="p-4 space-y-3">
      <div className="h-4 w-3/4 bg-white/10 rounded" />
      <div className="h-3 w-full bg-white/5 rounded" />
      <div className="flex gap-2 mt-3">
        <div className="h-5 w-16 bg-white/10 rounded" />
        <div className="h-5 w-16 bg-white/10 rounded" />
      </div>
    </div>
  </div>
);
