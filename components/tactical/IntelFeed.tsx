import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ExternalLink, Activity, FileText, ChevronRight } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Link } from 'react-router';
import { OmniRenderer } from '../content/OmniRenderer';

export default function IntelFeed({ agentId, agentSlug, initialData }: { agentId: string, agentSlug?: string, initialData?: any[] }) {
  const [intelList, setIntelList] = useState<any[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (initialData) return;
    let isMounted = true;
    dataService.getAgentIntel(agentId, agentSlug).then(data => {
      if (isMounted) {
        setIntelList(data);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [agentId, agentSlug, initialData]);

  const toggleExpand = (idx: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedIds(newExpanded);
  };

  if (!loading && intelList.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#050505] border border-white/10 rounded-xl p-6 relative overflow-hidden group mt-8 shadow-2xl">
      {/* Scanline Effect Background */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Activity size={16} className="text-emerald-500 animate-pulse" />
          <h3 className="text-[11px] font-mono text-white tracking-[0.2em] uppercase">
            INTEL_LAYER // LIVE_FEED
          </h3>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/80" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-cyan-500/50 text-[10px] font-mono animate-pulse uppercase tracking-widest">
              [ DECRYPTING_LATEST_SIGNALS... ]
            </motion.div>
          ) : (
            intelList.map((intel, idx) => {
              const isExpanded = expandedIds.has(idx);
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`group/item border-l-2 ${isExpanded ? 'border-cyan-400 bg-white/5' : 'border-cyan-500/30 hover:border-cyan-400 hover:bg-white/[0.02]'} pl-4 py-2 transition-all relative rounded-r-lg`}
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => toggleExpand(idx)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 mb-1">
                        <FileText size={14} className={`${isExpanded ? 'text-cyan-400' : 'text-cyan-500/70'}`} />
                        <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[9px] font-mono text-white/40 uppercase">
                          {intel.intel_type || 'INTEL'}
                        </span>
                        <div className="flex items-center gap-2">
                          {intel.id ? (
                            <Link 
                              to={`/blog/intel-${intel.id}`}
                              className={`text-white font-medium text-sm tracking-wide transition-colors flex items-center gap-2 ${isExpanded ? 'text-cyan-400' : 'group-hover/item:text-cyan-400'}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {intel.title}
                              <ChevronRight size={10} className="opacity-50" />
                            </Link>
                          ) : intel.source_url ? (
                            <a 
                              href={intel.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-white font-medium text-sm tracking-wide transition-colors flex items-center gap-2 ${isExpanded ? 'text-cyan-400' : 'group-hover/item:text-cyan-400'}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {intel.title}
                              <ExternalLink size={10} className="opacity-50" />
                            </a>
                          ) : (
                            <h4 className={`text-white font-medium text-sm tracking-wide transition-colors ${isExpanded ? 'text-cyan-400' : 'group-hover/item:text-cyan-400'}`}>
                              {intel.title}
                            </h4>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest">Live</span>
                      </div>
                    </div>

                    <div className={`text-white/50 text-xs leading-relaxed mt-1 ${isExpanded ? 'hidden' : 'line-clamp-1'}`}>
                      {intel.summary}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 pb-2 space-y-4">
                          <OmniRenderer item={intel} />
                          
                          <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                            {intel.source_url && (
                              <a 
                                href={intel.source_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[10px] text-cyan-500 hover:text-cyan-400 flex items-center gap-1.5 transition-colors uppercase tracking-wider font-mono bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20"
                                onClick={(e) => e.stopPropagation()}
                              >
                                [ ACCESS_SOURCE ] <ExternalLink size={10} />
                              </a>
                            )}
                            {intel.id && (
                              <Link 
                                to={`/blog/intel-${intel.id}`} 
                                className="text-[10px] font-mono text-white/40 hover:text-white flex items-center gap-1.5 transition-colors uppercase tracking-wider bg-white/5 px-2 py-1 rounded border border-white/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                [ FULL_REPORT ] <ChevronRight size={10} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer Link */}
      {!loading && intelList.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/5 flex justify-center relative z-20">
          <Link 
            to="/blog"
            className="text-[10px] font-mono text-white/30 hover:text-cyan-400 transition-all uppercase tracking-[0.3em] flex items-center gap-2 group/footer cursor-pointer"
          >
            VIEW_FULL_INTELLIGENCE_REPORT 
            <span className="group-hover/footer:translate-x-1 transition-transform">{'>>'}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
