import React, { useRef, useState, useEffect } from 'react';
import { AgentRegistryEntity } from '../../app/types/registry';
import { HoloAvatar } from '../visuals/HoloAvatar';
import { AeroStarRating } from '../ui/AeroStarRating';
import { 
    Hash, Terminal, Volume2, VolumeX, Shield, Cpu, Zap, Activity, Flame
} from 'lucide-react';
import { UIState, useUIStore } from '../../stores/useUIStore';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link, useOutletContext } from 'react-router';

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
                    <div 
                        className="h-full transition-all duration-300 ease-out"
                        style={{ width: unlocked ? `${volume * 100}%` : '0%', backgroundColor: accentColor }}
                    />
                </div>
            </div>
        </div>
    );
};

const TechTagCloud: React.FC<{ tags: string[], onClick: (tag: string) => void, color: string, validCategories?: string[] }> = ({ tags, onClick, color, validCategories }) => {
    return (
        <ul className="flex flex-wrap gap-2 pointer-events-auto relative z-10" aria-label="Capability Tags">
            {tags
                .filter(tag => {
                    if (!tag || tag === 'NEW_DISCOVERY') return false;
                    if (validCategories && !validCategories.includes(tag)) return false;
                    return true;
                })
                .map((tag, idx) => (
                    <li key={idx}>
                        <Link 
                            to={`/?category=${encodeURIComponent(tag)}`}
                            className="group px-2 py-1 rounded bg-white/5 border border-white/10 hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
                            style={{ '--accent': color } as React.CSSProperties}
                            aria-label={`Filter by tag: ${tag}`}
                        >
                            <span className="text-[9px] text-[var(--accent)] opacity-50" aria-hidden="true">#</span>
                            <span className="text-[10px] font-mono text-gray-400 group-hover:text-white uppercase tracking-tighter">
                                {String(tag || '').replace(/_/g, ' ')}
                            </span>
                        </Link>
                    </li>
                ))}
        </ul>
    );
};

// ... MAIN MODULE ...

// [TACTICAL_BADGE_RENDER_PROTOCOL]
const BADGE_STYLES: Record<string, string> = {
    'SOTA': 'border-orange-500 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]',
    'NEW': 'border-green-500 text-green-500',
    'NEW_BORN': 'border-green-500 text-green-500',
    'BYOK': 'border-white/40 text-white',
    'OPEN_SOURCE': 'border-blue-400 text-blue-400',
    'WEB_READY': 'border-gray-500 text-gray-500',
    'FREE_TIER': 'text-green-400 border-green-400',
    '0_COST': 'text-green-400 border-green-400',
    'LOCAL_OPS': 'text-purple-400 border-purple-400',
    'LOCAL': 'text-purple-400 border-purple-400',
    'NO_CODE': 'text-pink-400 border-pink-400',
    'ONE_CLICK': 'text-pink-400 border-pink-400',
    'PRIVACY': 'text-blue-400 border-blue-400',
    'UNFILTERED': 'text-blue-400 border-blue-400',
    'OS_PILOT': 'border-red-500 text-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]',
    'FULL_AUTO': 'border-yellow-400 text-yellow-400',
    'HIVE_MIND': 'border-purple-500 text-purple-500',
    'AIR_GAPPED': 'border-emerald-400 text-emerald-400',
    'MOBILE_OPS': 'border-pink-500 text-pink-500',
    'NEURAL_TITAN': 'border-cyan-400 text-cyan-400',
    'PROFIT_UP': 'border-emerald-500 text-emerald-500',
};

interface IdentityModuleProps {
    agent: AgentRegistryEntity;
    accentColor: string;
    onTagClick: (tag: string) => void;
    isSpeaking: boolean;
}

export const IdentityModule: React.FC<IdentityModuleProps> = ({
    agent, accentColor, onTagClick, isSpeaking
}) => {
    // --- INJECTED BRAIN: NEURAL LINKS ---
    const [linkedEntities, setLinkedEntities] = useState<any[]>([]);
    const navigate = useNavigate();
  
    useEffect(() => {
        if (!agent?.id) return;
        
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

    // 🛡️ Protocol V12: Category Integrity Check
    let validCategories: string[] = [];
    try {
        const context = useOutletContext<any>();
        if (context && context.validCategories) {
            validCategories = context.validCategories;
        }
    } catch (e) {
        // Ignore if not inside an outlet
    }

    const onToggleAudio = () => setAudioUnlocked(!audioUnlocked);
    const onVolumeChange = (val: number) => setVolume(val);

    const allTags = Array.from(new Set([...(agent.tags || []), ...(agent.capabilities || [])])).filter(t => t && t !== 'NEW_DISCOVERY').slice(0, 12);
    
    // Use NRI Score as the primary rating metric
    const rating = agent.metrics?.nri_score ?? 85;

    // [TACTICAL_VISUAL_FIX]
    // console.log('Agent Badges:', agent.tactical_badges);
    let badges = agent.tactical_badges && agent.tactical_badges.length > 0 
       ? [...agent.tactical_badges] 
       : ['WEB_READY']; // Frontend fallback

    // [UI_FALLBACK_REFINEMENT] Auto-inject SOTA for high NRI
    if (rating > 90 && !badges.includes('SOTA')) {
        badges.unshift('SOTA');
    }

    return (
        <div className="flex flex-col relative h-full">
            {/* V13.0: Holographic Avatar Layer */}
            <HoloAvatar agent={agent} className="top-[-20%] bottom-[-20%]" />

            {/* Header Metadata */}
            <header className="flex flex-wrap items-center gap-2 mb-4 relative z-10">
                <Link to={`/?category=${encodeURIComponent(agent.category || 'ALL')}`} className="flex items-center gap-1.5 px-3 py-1 rounded border border-white/10 bg-black/40 backdrop-blur-sm hover:bg-white/5 transition-colors cursor-pointer">
                    <Terminal size={10} style={{ color: accentColor }} />
                    <span className="text-[9px] font-mono font-black tracking-[0.2em] uppercase" style={{ color: accentColor }}>
                        SYS_NODE_{String(agent.category || '')}
                    </span>
                </Link>
                
                {agent.entity_type && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-white/10 bg-black/40 backdrop-blur-sm">
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                            TYPE: <span className="text-white font-bold">{agent.entity_type.replace(/_/g, ' ')}</span>
                        </span>
                    </div>
                )}
                
                {agent.version && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-white/10 bg-black/40 backdrop-blur-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                            {agent.version}
                        </span>
                    </div>
                )}
                
                {agent.vendor_slug && (
                    <Link 
                        to={`/vendor/${agent.vendor_slug}`}
                        className="flex items-center gap-1.5 px-2 py-1 rounded border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-sm hover:bg-cyan-900/40 transition-colors"
                    >
                        <span className="text-[9px] font-mono text-cyan-300 uppercase tracking-widest font-bold">
                            View Vendor Hub
                        </span>
                    </Link>
                )}
            </header>

            {/* Name Title */}
            <header className="relative mb-2 z-10 w-full">
                <h1 
                    className="font-display font-black tracking-tighter uppercase text-white break-words text-4xl sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" 
                    style={{ lineHeight: 0.85, textShadow: '0 0 30px rgba(0,0,0,0.5)', textWrap: 'balance' }}
                    itemProp="name"
                >
                    {String(agent.name || '')}
                </h1>
            </header>

            {/* Slogan & Volume */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pl-1 relative z-10">
                <p className="text-sm font-light italic text-gray-300 leading-tight tracking-wide border-l-4 border-white/20 pl-4 py-1 max-w-md" itemProp="description">
                    "{String(agent.slogan || '')}"
                </p>
                <div>
                    <MicroVolumeCore volume={volume} unlocked={audioUnlocked} onToggle={onToggleAudio} onChange={onVolumeChange} accentColor={accentColor} isSpeaking={isSpeaking} />
                </div>
            </div>

            {/* [STAR_MATRIX_CALIBRATION] Detailed Metrics (Restored) */}
            <div className="mb-6 relative z-10 bg-black/20 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
                <div className="grid grid-cols-[24px_1fr_30px] gap-y-3 items-center">
                    {/* Logic */}
                    <div title="LOGIC" className="cursor-help flex items-center">
                        <Cpu size={16} className="text-cyan-400" />
                    </div>
                    <div className="flex items-center">
                        <AeroStarRating rating={agent.metrics?.logic_unit || 0} />
                    </div>
                    <data value={agent.metrics?.logic_unit || 0} className="text-xs font-mono text-cyan-500 text-right font-bold">
                        {agent.metrics?.logic_unit || 0}
                    </data>

                    {/* Creative */}
                    <div title="CREATIVE" className="cursor-help flex items-center">
                        <Zap size={16} className="text-cyan-400" />
                    </div>
                    <div className="flex items-center">
                        <AeroStarRating rating={agent.metrics?.velocity || 0} />
                    </div>
                    <data value={agent.metrics?.velocity || 0} className="text-xs font-mono text-cyan-500 text-right font-bold">
                        {agent.metrics?.velocity || 0}
                    </data>

                    {/* Speed */}
                    <div title="SPEED" className="cursor-help flex items-center">
                        <Activity size={16} className="text-cyan-400" />
                    </div>
                    <div className="flex items-center">
                        <AeroStarRating rating={agent.metrics?.velocity || 0} />
                    </div>
                    <data value={agent.metrics?.velocity || 0} className="text-xs font-mono text-cyan-500 text-right font-bold">
                        {agent.metrics?.velocity || 0}
                    </data>
                </div>
            </div>

            {/* [TACTICAL_MATRIX] Badges Only (No Progress Bars) */}
            <div className="w-full bg-black/20 p-3 rounded-lg border border-white/5 backdrop-blur-sm relative z-10 mb-4">
                <div className="text-[9px] font-mono text-gray-500 mb-2 uppercase tracking-widest flex items-center gap-2 opacity-80 border-b border-white/5 pb-1">
                    <Shield size={10} /> TACTICAL_MATRIX
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* [TACTICAL_BADGE_RENDER_PROTOCOL] */}
                    {badges.map((badge, idx) => {
                         const style = BADGE_STYLES[badge] || 'border-gray-700 text-gray-400';
                         return (
                             <div key={idx} className={`border bg-black/50 px-2 py-1 text-[10px] font-mono tracking-widest uppercase rounded-md backdrop-blur-sm ${style}`}>
                                 {badge.replace(/_/g, ' ')}
                             </div>
                         );
                    })}
                </div>
            </div>

            {/* --- FORCE INJECTION: TELEMETRY BADGES --- */}
            <div className="flex flex-wrap gap-3 my-4 pl-1 relative z-10">
              {/* NRI: Cold Authority */}
              <div title="NRI_AUTH" aria-label={`NRI Authority Score: ${Math.round(agent.metrics?.nri_score ?? 0)}`} className="cursor-help flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md hover:border-cyan-500/50 transition-colors">
                <Shield size={14} className="text-cyan-500" aria-hidden="true" />
                <data value={Math.round(agent.metrics?.nri_score ?? 0)} className="text-slate-200 font-bold font-mono text-sm">
                    {Math.round(agent.metrics?.nri_score ?? 0)}
                </data>
              </div>
              {/* HOT: Kinetic Heat */}
              <div title="HOT_KINETIC" aria-label={`Kinetic Heat Score: ${Number((agent.metrics.hot_score ?? 0).toFixed(1))}`} className="cursor-help flex items-center gap-2 px-3 py-1.5 bg-red-950/30 border border-red-900/50 rounded-md hover:border-red-500/50 transition-colors">
                <Flame size={14} className="text-red-500" aria-hidden="true" />
                <data value={Number((agent.metrics.hot_score ?? 0).toFixed(1))} className="text-red-400 font-bold font-mono text-sm">
                    {Number((agent.metrics.hot_score ?? 0).toFixed(1))}
                </data>
              </div>
            </div>
            {/* ----------------------------------------- */}

            {/* Tags Vector */}
            {allTags && allTags.length > 0 && (
                <section 
                    className="space-y-2 mt-2 pb-4 relative z-10 animate-in fade-in slide-in-from-bottom-5 duration-300"
                >
                    <h2 className="flex items-center gap-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest opacity-70">
                        <Hash size={10} /> CAPABILITIES_VECTOR
                    </h2>
                    <TechTagCloud tags={allTags} onClick={onTagClick} color={accentColor} validCategories={validCategories} />
                </section>
            )}

            {/* [HOLOGRAPHIC_UI_OVERLAY_2.0] Framework Stack Badges */}
            {agent.framework_stack && agent.framework_stack.length > 0 && (
                <section className="mb-6 relative z-10">
                    <h2 className="flex items-center gap-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest opacity-70 mb-2">
                        <Cpu size={10} /> CORE_FRAMEWORKS
                    </h2>
                    <div className="flex flex-wrap gap-1.5">
                        {agent.framework_stack.map((tech, idx) => (
                            <Link 
                                key={idx} 
                                to={`/directory?q=${encodeURIComponent(tech)}`}
                                className="px-2 py-1 bg-cyan-950/20 border border-cyan-500/20 rounded text-[9px] font-mono text-cyan-300 flex items-center gap-1 hover:bg-cyan-900/30 hover:border-cyan-400 hover:text-cyan-400 transition-colors cursor-pointer"
                            >
                                {tech}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* --- INJECTED BODY: ECOSYSTEM SECTION --- */}
            {linkedEntities && linkedEntities.length > 0 && (
                <div 
                    className="w-full mt-8 pt-6 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-300"
                >
                    <h4 className="text-xs font-mono text-cyan-500 mb-3 animate-pulse">
                    [_NEURAL_ECOSYSTEM_LINKS]
                    </h4>
                    <div className="flex flex-wrap gap-2">
                    {linkedEntities.map(link => (
                        <Link 
                            key={link.id} 
                            to={`/agent/${link.slug || link.id}/lounge`}
                            onClick={(e) => {
                                e.stopPropagation();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-cyan-300 cursor-pointer hover:bg-slate-800 transition-colors active:scale-95 block"
                        >
                        {link.name}
                        </Link>
                    ))}
                    </div>
                </div>
            )}
            {/* -------------------------------------- */}

        </div>
    );
};