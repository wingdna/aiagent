import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ExternalLink, Activity } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Link } from 'react-router';

export default function IntelFeed({ agentId }: { agentId: string }) {
  const [intelList, setIntelList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    dataService.getAgentIntel(agentId).then(data => {
      if (isMounted) {
        setIntelList(data);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [agentId]);

  // If no data and loaded, return null to prevent layout collapse
  if (!loading && intelList.length === 0) return null;

  return (
    <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 rounded-xl p-6 relative overflow-hidden group mt-8">
      {/* Scanline Effect Background */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="flex items-center gap-2 mb-4 text-cyan-400/80 font-mono text-xs tracking-widest uppercase">
        <Activity size={14} className="animate-pulse" />
        <span>Live_Intel_Stream</span>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/30 text-xs font-mono animate-pulse">[DECRYPTING_LATEST_SIGNALS...]
            </motion.div>
          ) : (
            intelList.map((intel, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="border-l-2 border-cyan-500/30 pl-3 hover:border-cyan-400 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-white/90 text-sm font-medium leading-tight mb-1">
                    {intel.title}
                  </h4>
                </div>
                <p className="text-white/50 text-xs line-clamp-2 leading-relaxed">
                  {intel.summary}
                </p>
                <div className="mt-2 flex items-center justify-between">
                    <div className="text-[10px] text-white/30 font-mono flex items-center gap-2">
                      <span className="bg-white/5 px-1.5 py-0.5 rounded">{intel.intel_type}</span>
                      <span>{new Date(intel.published_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {intel.source_url && (
                            <a 
                                href={intel.source_url} 
                                target="_blank" 
                                rel="noopener noreferrer nofollow" 
                                className="text-[10px] text-cyan-500/50 hover:text-cyan-400 flex items-center gap-1 transition-colors uppercase tracking-wider"
                            >
                                [SOURCE] <ExternalLink size={10} />
                            </a>
                        )}
                        <Link to={`/blog/intel-${intel.id}`} className="text-[10px] font-mono text-cyan-500/70 hover:text-cyan-400 flex items-center gap-1 transition-colors">
                            READ_DEEP_REPORT &gt;
                        </Link>
                    </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
