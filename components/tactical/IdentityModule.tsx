import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Agent } from '../../types';
import { PrecisionMetric } from '../shared/PrecisionMetric';
import { HoloAvatar } from '../visuals/HoloAvatar';
import { MedalRack } from '../badges/MedalRack';
import { 
    Hash, Terminal, Volume2, VolumeX, Cpu, Zap, Activity, Shield
} from 'lucide-react';
import { UIState, useUIStore } from '../../src/stores/useUIStore';
import { supabase } from '../../lib/supabase';

// --- SUB-COMPONENTS (Locally Scoped) ---

const MicroVolumeCore: React.FC<{
    volume: number;
    unlocked: boolean;
    onToggle: () => void;
    onChange: (val: number) => void;
    accentColor: string;
    isSpeaking: boolean;
}> = ({ volume, unlocked, onToggle, onChange, accentColor, isSpeaking }) => {
    const coreRef = useRef<HTMLDivElement>(null);

    const handleInteraction = (e: React.MouseEvent) => {
        if (!coreRef.current) return;
        const rect = coreRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.max(0, Math.min(1, clickX / width));

        if (percentage < 0.25) {
            onToggle();
        } else {
            onChange(percentage);
            if (!unlocked) onToggle();
        }
    };

    return (
        <div className="flex items-center gap-3 pointer-events-auto shrink-0 group cursor-pointer h-12 p-2 rounded-lg bg-black/40 border border-white/10 hover:border-white/30 transition-all">
            <div 
                ref={coreRef}
                onClick={handleInteraction}
                className={`relative w-12 h-full rounded flex items-center justify-center transition-all duration-300 ${
                    unlocked && volume > 0 ? 'bg-black/60' : 'bg-black/20'
                }`}
            >
                {unlocked && volume > 0 ? (
                    <Volume2 size={16} style={{ color: accentColor }} className="drop-shadow-[0_0_8px_currentColor] z-10" />
                ) : (
                    <VolumeX size={16} className="text-gray-600 z-10" />
                )}

                <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                        initial={false}
                        animate={{ width: unlocked ? `${volume * 100}%` : '0%' }}
                        className="h-full"
                        style={{ backgroundColor: accentColor }}
                    />
                </div>
            </div>
        </div>
    );
};

const TechTagCloud: React.FC<{ tags: string[], onClick: (tag: string) => void, color: string }> = ({ tags, onClick, color }) => {
    return (
        <div className="flex flex-wrap gap-2 pointer-events-auto relative z-10">
            {tags.map((tag, idx) => (
                <button 
                    key={idx} 
                    onClick={(e) => { e.stopPropagation(); onClick(tag); }} 
                    className="group px-2 py-1 rounded bg-white/5 border border-white/10 hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                    style={{ '--accent': color } as React.CSSProperties}
                >
                    <span className="text-[9px] text-[var(--accent)] opacity-50">#</span>
                    <span className="text-[10px] font-mono text-gray-400 group-hover:text-white uppercase tracking-tighter">
                        {tag.replace(/_/g, ' ')}
                    </span>
                </button>
            ))}
        </div>
    );
};

// --- MAIN MODULE ---

interface IdentityModuleProps {
    agent: Agent;
    accentColor: string;
    onTagClick: (tag: string) => void;
    isSpeaking: boolean;
}

export const IdentityModule: React.FC<IdentityModuleProps> = ({
    agent, accentColor, onTagClick, isSpeaking
}) => {
    // --- INJECTED BRAIN: NEURAL LINKS ---
    const [linkedEntities, setLinkedEntities] = useState<any[]>([]);
  
    useEffect(() => {
        if (!agent?.id) return;
        console.log('[YouAgent] Scanning Neural Links for:', agent.name); // <--- LOG MUST APPEAR
        
        const fetchLinks = async () => {
        try {
            let rpc = agent.entity_type === 'ai_agent' ? 'get_base_models_for_agent' : 'get_agents_by_base_model';
            let param = agent.entity_type === 'ai_agent' ? 'p_agent_id' : 'p_model_id';
            
            if (!supabase) return;
            const { data, error } = await supabase.rpc(rpc, { [param]: agent.id });
            if (error) throw error;
            if (data) setLinkedEntities(data);
        } catch (e) {
            console.error("Link Error:", e);
        }
        };
        fetchLinks();
    }, [agent]);
    // ------------------------------------

    const volume = useUIStore((s: UIState) => s.volume);
    const setVolume = useUIStore((s: UIState) => s.setVolume);
    const audioUnlocked = useUIStore((s: UIState) => s.audioUnlocked);
    const setAudioUnlocked = useUIStore((s: UIState) => s.setAudioUnlocked);
    const setActiveAgentId = useUIStore((s: UIState) => s.setActiveAgentId);
    const setCurrentView = useUIStore((s: UIState) => s.setCurrentView);

    const onToggleAudio = () => setAudioUnlocked(!audioUnlocked);
    const onVolumeChange = (val: number) => setVolume(val);

    const allTags = Array.from(new Set([...(agent.tags || []), ...(agent.capability_tags || [])])).filter(t => t && t !== 'NEW_DISCOVERY').slice(0, 12);
    
    // Ensure we capture all relevant tactical badges defined in the agent, prioritizing explicit ones
    const displayBadges = agent.tactical_badges && agent.tactical_badges.length > 0 
        ? agent.tactical_badges 
        : ['LOCAL', 'ONE_CLICK']; // Default fallback if none

    return (
        <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.6, ease: "easeOut" }} 
            className="flex flex-col relative"
        >
            {/* V13.0: Holographic Avatar Layer */}
            <HoloAvatar agent={agent} className="top-[-20%] bottom-[-20%]" />

            {/* Header Metadata */}
            <div className="flex items-center gap-3 mb-4 opacity-80 relative z-10">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded border border-white/10 bg-black/40 backdrop-blur-sm">
                    <Terminal size={10} style={{ color: accentColor }} />
                    <span className="text-[9px] font-mono font-black tracking-[0.2em] uppercase" style={{ color: accentColor }}>SYS_NODE_{agent.category}</span>
                </div>
            </div>

            {/* Name Title */}
            <div className="relative mb-2 z-10">
                <h1 
                    className="font-display font-black tracking-tighter uppercase text-white break-words text-4xl lg:text-5xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" 
                    style={{ lineHeight: 0.9 }}
                >
                    {agent.name}
                </h1>
            </div>

            {/* Slogan & Volume */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pl-1 relative z-10">
                <p className="text-sm font-light italic text-gray-300 leading-tight tracking-wide border-l-4 border-white/20 pl-4 py-1 max-w-md">
                    "{agent.slogan}"
                </p>
                <div className="hidden md:block">
                    <MicroVolumeCore volume={volume} unlocked={audioUnlocked} onToggle={onToggleAudio} onChange={onVolumeChange} accentColor={accentColor} isSpeaking={isSpeaking} />
                </div>
            </div>

            {/* Metrics & Medals Dashboard (Unified Side-by-Side Layout) */}
            {/* V13.1 Update: lg:grid-cols-1 to accommodate hiding Medals on Desktop */}
            <div className="grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] lg:grid-cols-1 gap-4 w-full bg-black/20 p-3 rounded-lg border border-white/5 backdrop-blur-sm relative z-10 mb-4">
                {/* Left: Metrics */}
                <div className="space-y-2 min-w-0">
                    <PrecisionMetric icon={Cpu} label="LOGIC" value={agent.metrics?.reasoning || 0} accentColor={accentColor} delay={0.1} />
                    <PrecisionMetric icon={Zap} label="CREATIVE" value={agent.metrics?.creativity || 0} accentColor={accentColor} delay={0.15} />
                    <PrecisionMetric icon={Activity} label="SPEED" value={agent.metrics?.speed || 0} accentColor={accentColor} delay={0.2} />
                </div>
                
                {/* Divider (Desktop Only - Hidden on LG) */}
                <div className="hidden md:block lg:hidden w-px bg-white/10 self-stretch my-1" />
                
                {/* Right: Tactical Medals (Visible on Mobile/Tablet, Hidden on Desktop LG) */}
                <div className="min-w-0 flex flex-col lg:hidden">
                     <div className="text-[9px] font-mono text-gray-500 mb-2 uppercase tracking-widest flex items-center gap-2 opacity-80 border-b border-white/5 pb-1">
                        <Shield size={10} /> TACTICAL_MATRIX
                     </div>
                     <MedalRack badges={displayBadges} onClick={onTagClick} className="mt-auto" />
                </div>
            </div>

            {/* --- FORCE INJECTION: TELEMETRY BADGES --- */}
            <div className="flex flex-wrap gap-4 my-4 pl-1 relative z-10">
              {/* NRI: Cold Authority */}
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700 rounded-md">
                <span className="text-cyan-500 font-mono text-xs font-bold">NRI_AUTH</span>
                <span className="text-slate-200 font-bold">{agent.nri_score || 0}</span>
              </div>
              {/* HOT: Kinetic Heat */}
              <div className="flex items-center gap-2 px-3 py-1 bg-red-950/30 border border-red-900/50 rounded-md">
                <span className="text-red-500 font-mono text-xs font-bold">HOT_KINETIC 🔥</span>
                <span className="text-red-400 font-bold">{agent.hot_score || 0}</span>
              </div>
            </div>
            {/* ----------------------------------------- */}

            {/* Tags Vector */}
            <div className="space-y-2 mt-2 pb-4 relative z-10">
                <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest opacity-70">
                    <Hash size={10} /> CAPABILITIES_VECTOR
                </div>
                <TechTagCloud tags={allTags} onClick={onTagClick} color={accentColor} />
            </div>

            {/* --- INJECTED BODY: ECOSYSTEM SECTION --- */}
            <div className="w-full mt-8 pt-6 border-t border-slate-800">
                <h4 className="text-xs font-mono text-cyan-500 mb-3 animate-pulse">
                [_NEURAL_ECOSYSTEM_LINKS]
                </h4>
                <div className="flex flex-wrap gap-2">
                {linkedEntities.map(link => (
                    <div 
                        key={link.id} 
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveAgentId(link.id);
                            setCurrentView('lounge');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-cyan-300 cursor-pointer hover:bg-slate-800 transition-colors active:scale-95"
                    >
                    {link.name}
                    </div>
                ))}
                {linkedEntities.length === 0 && (
                    <span className="text-slate-600 text-[10px] italic">// NO LINKS DETECTED</span>
                )}
                </div>
            </div>
            {/* -------------------------------------- */}

        </motion.div>
    );
};