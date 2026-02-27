import React, { useEffect, useState } from 'react';
import { Agent } from '../types';
import { X, CheckCircle, ExternalLink, Zap } from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import { cerebroService } from '../services/cerebroService';
import { useSynapticLinks } from '../hooks/useSynapticLinks';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface AgentModalProps {
  agent: Agent;
  onClose: () => void;
}

export const AgentModal: React.FC<AgentModalProps> = ({ agent, onClose }) => {
  const { baseModels, derivedAgents, loading: linksLoading } = useSynapticLinks(agent.id);

  const [linkedEntities, setLinkedEntities] = useState<any[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  useEffect(() => {
    const fetchNeuralLinks = async () => {
      if (!agent?.id || !supabase) return;
      setIsLoadingLinks(true);
      try {
        if (agent.entity_type === 'ai_agent') {
          const { data } = await supabase.rpc('get_base_models_for_agent', { p_agent_id: agent.id });
          setLinkedEntities(data ||[]);
        } else {
          const { data } = await supabase.rpc('get_agents_by_base_model', { p_model_id: agent.id });
          setLinkedEntities(data || []);
        }
      } catch (err) {
        console.error("[YouAgent] Failed to fetch neural links:", err);
      } finally {
        setIsLoadingLinks(false);
      }
    };
    
    fetchNeuralLinks();
  }, [agent]);

  useEffect(() => {
    // NATIVE ANALYTICS: CEREBRO LINK
    cerebroService.trackEvent('view', agent.slug || agent.id);
  }, [agent.id, agent.slug]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div 
        className="relative w-full max-w-5xl bg-cyber-dark border border-cyber-dim rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
        style={{ '--agent-color': agent.theme_color } as React.CSSProperties}
      >
        
        {/* Left Panel: Visuals & Info */}
        <div className="w-full md:w-1/3 bg-cyber-panel p-0 border-r border-cyber-dim flex flex-col overflow-y-auto relative">
          
          {/* Hero Image in Sidebar */}
          <div className="h-48 relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyber-panel z-10"></div>
            <img src={agent.video_poster} alt={agent.name} className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-6 z-20">
              <h2 className="text-2xl font-display font-bold text-white drop-shadow-md">{agent.name}</h2>
              <div className="text-sm font-mono text-[var(--agent-color)]">{agent.category}</div>

              {/* INJECT THIS INTO THE METRICS/HEADER SECTION */}
              <div className="flex flex-wrap gap-4 mt-3 mb-4">
                {/* NRI: Cold Authority */}
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700 rounded-md shadow-sm">
                  <span className="text-cyan-500 font-mono text-xs font-bold tracking-wider">NRI_AUTH</span>
                  <span className="text-slate-200 font-bold">{agent.nri_score || 0}</span>
                </div>
                
                {/* HOT: Kinetic Heat */}
                <motion.div 
                  animate={{ opacity: [0.7, 1, 0.7] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex items-center gap-2 px-3 py-1 bg-red-950/30 border border-red-900/50 rounded-md shadow-[0_0_10px_rgba(220,38,38,0.2)]"
                >
                  <span className="text-red-500 font-mono text-xs font-bold tracking-wider">HOT_KINETIC 🔥</span>
                  <span className="text-red-400 font-bold">{agent.hot_score || 0}</span>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6 flex-1">
            <div className="p-3 rounded bg-[var(--agent-color)]/10 border border-[var(--agent-color)]/20">
               <p className="text-sm text-gray-200 italic">"{agent.slogan}"</p>
            </div>

            <div>
              <h4 className="text-xs font-mono text-gray-500 uppercase mb-2">Capabilities</h4>
              <div className="flex flex-wrap gap-2">
                {(agent.capability_tags || []).map((cap, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs text-gray-300 bg-cyber-black px-2 py-1 rounded border border-cyber-dim">
                    <CheckCircle className="w-3 h-3 text-[var(--agent-color)]" /> {cap}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-cyber-dim">
               <h4 className="text-xs font-mono text-gray-500 uppercase mb-2">Description</h4>
               <p className="text-sm text-gray-400 leading-relaxed">{agent.description}</p>
            </div>

            {/* SYNAPTIC LINKS */}
            {agent.entity_type === 'foundation_model' && derivedAgents.length > 0 && (
              <div className="pt-4 border-t border-cyber-dim">
                <h4 className="text-xs font-mono text-[var(--agent-color)] uppercase mb-2 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Ecosystem / Agents Built on this Model
                </h4>
                <div className="flex flex-wrap gap-2">
                  {derivedAgents.map(a => (
                    <div key={a.id} className="flex items-center gap-2 bg-cyber-black border border-cyber-dim rounded p-2">
                      <img src={a.persona_img || a.video_poster} alt={a.name} className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-xs text-gray-300 font-mono">{a.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {agent.entity_type !== 'foundation_model' && baseModels.length > 0 && (
              <div className="pt-4 border-t border-cyber-dim">
                <h4 className="text-xs font-mono text-[var(--agent-color)] uppercase mb-2 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Powered By / Supported Base Models
                </h4>
                <div className="flex flex-wrap gap-2">
                  {baseModels.map(m => (
                    <div key={m.id} className="flex items-center gap-2 bg-cyber-black border border-cyber-dim rounded p-2">
                      <img src={m.persona_img || m.video_poster} alt={m.name} className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-xs text-gray-300 font-mono">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <a 
              href={agent.connectivity.try_url} 
              target="_blank" 
              rel="noreferrer"
              className="mt-auto w-full bg-[var(--agent-color)] text-cyber-black font-bold py-3 px-4 rounded hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> LAUNCH SYSTEM
            </a>

            {/* INJECT THIS AT THE BOTTOM OF THE DETAIL VIEW */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <h3 className="text-sm font-mono text-slate-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                {agent.entity_type === 'ai_agent' ? '[_POWERED_BY_BASE_MODELS]' : '[_ECOSYSTEM_APPLICATIONS]'}
              </h3>
              
              {isLoadingLinks ? (
                <div className="text-slate-500 font-mono text-xs">SCANNING NEURAL PATHWAYS...</div>
              ) : linkedEntities.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {linkedEntities.map(entity => (
                    <div key={entity.id} className="px-3 py-2 bg-slate-900/50 border border-slate-700 hover:border-cyan-500/50 transition-colors rounded-md flex items-center gap-2 cursor-pointer">
                      <span className="text-cyan-400 font-bold text-sm">{entity.name}</span>
                      <span className="text-slate-500 text-xs">/ {entity.entity_type === 'ai_agent' ? 'AGENT' : 'CORE'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-600 font-mono text-xs italic">
                  [NO DIRECT NEURAL LINKS DETECTED]
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Chat/Preview */}
        <div className="flex-1 bg-cyber-black/50 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-display text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              NEURAL LINK ESTABLISHED
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <ChatInterface agent={agent} />
          
          <div className="mt-6 p-4 rounded bg-cyber-panel border border-cyber-dim flex items-start gap-3">
             <Zap className="w-5 h-5 text-[var(--agent-color)] shrink-0 mt-0.5" />
             <div className="space-y-1">
                <div className="text-xs font-bold text-white font-display">SYSTEM METRICS</div>
                <div className="text-xs text-gray-500 font-mono">
                  POPULARITY SCORE: {agent.hot_score}/100 <br/>
                  LATENCY: 12ms <br/>
                  STATUS: OPERATIONAL
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};