
import React from 'react';
import { motion } from 'framer-motion';
import { Agent } from '../../types';
import { NREProfile } from '../../hooks/useNRE';
import { PersonaLayer } from './PersonaLayer';
import { CircuitSidebar } from './CircuitSidebar';
import { getCategoryColor, optimizeImage } from '../../utils';
import { Shield } from 'lucide-react'; // Added import

// --- ATOMIC MODULES ---
import { IdentityModule } from '../tactical/IdentityModule';
import { HoloFrame } from '../tactical/HoloFrame';
import { DataDeck } from '../tactical/DataDeck';
import { AdFrame } from '../monetization/AdFrame';
import { MedalRack } from '../badges/MedalRack'; // Added import

interface TacticalHUDProps {
    agent: Agent & { syncStrength?: number };
    onConnect: () => void;
    onEnterLounge: () => void;
    onTagClick: (tag: string) => void;
    onLike: () => void;
    onBookmark: () => void;
    onShare: () => void;
    isLiked: boolean;
    isBookmarked: boolean;
    isForging?: boolean;
    isSpeaking: boolean;
    hideBackground?: boolean;
    nreProfile?: NREProfile; 
    setNREProfile?: (p: NREProfile) => void;
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({ 
    agent, onConnect, onEnterLounge, onTagClick, onLike, onBookmark, onShare,
    isLiked, isBookmarked, isForging, isSpeaking, hideBackground = false,
    nreProfile, setNREProfile
}) => {
  
  if (!agent || !agent.id) return null;
  const accentColor = getCategoryColor(agent.category || 'TEXT_GEN');
  
  // V13.1: Duplicate logic for displaying badges in the Center Column
  const displayBadges = agent.tactical_badges && agent.tactical_badges.length > 0 
        ? agent.tactical_badges 
        : ['LOCAL', 'ONE_CLICK'];

  // ⚡ Protocol V20.0: Optimize Huge Background Asset
  // Background needs high res but compressed AVIF
  const heroBgUrl = optimizeImage(agent.video_poster, 1920);

  return (
    <div className="relative w-full h-full flex flex-col font-sans bg-black bg-topology overflow-hidden" id={`agent-${agent.id}`}>
      <div style={{ '--hud-accent': accentColor } as React.CSSProperties} className="contents">
        
        {/* --- DYNAMIC BACKGROUND LAYERS --- */}
        {!hideBackground && (
            <>
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <motion.img 
                        src={heroBgUrl} 
                        initial={{ scale: 1.05, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 0.15 }} 
                        transition={{ duration: 1.5 }} 
                        className="w-full h-full object-cover grayscale mix-blend-luminosity" 
                        // V19.0: LCP OPTIMIZATION - Force Eager Load
                        loading="eager"
                        // @ts-ignore: React 18 prop support
                        fetchpriority="high"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
                </div>
                {/* Protocol V6.1: Data Scanline Effect */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(0,255,65,0)_50%,rgba(0,255,65,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
            </>
        )}

        {/* --- MOBILE AMBIENT VISUAL (Replaces Grid Persona on Mobile) --- */}
        <div className="md:hidden fixed inset-0 z-0 pointer-events-none opacity-20">
             {!isForging && <PersonaLayer agent={agent} accentColor={accentColor} isSpeaking={false} className="w-full h-full object-cover object-top opacity-30" />}
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>

        {/* --- DESKTOP AMBIENT VISUAL (Right Side Watermark - Muted) --- */}
        <div className="hidden md:block fixed right-0 top-0 bottom-0 w-1/2 z-0 pointer-events-none opacity-20 mix-blend-screen">
             {!isForging && <PersonaLayer agent={agent} accentColor={accentColor} isSpeaking={isSpeaking} className="w-full h-full object-contain object-right-bottom opacity-20" />}
             <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-black/90 to-black" />
        </div>

        {/* --- PROTOCOL V9.6: FIXED RIGHT RAIL (ALL DEVICES) --- */}
        <CircuitSidebar 
            accentColor={accentColor} 
            onConnect={onConnect} 
            onSync={onBookmark} 
            onLike={onLike}
            onShare={onShare}
            isLiked={isLiked}
            isBookmarked={isBookmarked}
            onEnterLounge={onEnterLounge} 
        />

        {/* --- MAIN GRID LAYOUT (PROTOCOL V11.0: 3-COLUMN FLAT-SURFACE) --- */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 h-auto lg:h-full w-full max-w-[1920px] mx-auto pointer-events-auto lg:pointer-events-none pt-24 pb-32 lg:pb-0 lg:pt-24 px-6 lg:px-12 gap-6 lg:gap-8 overflow-y-auto lg:overflow-hidden scrollbar-hide">
          
          {/* COLUMN 1: IDENTITY CORE (Col-3) */}
          <div className="col-span-1 lg:col-span-3 flex flex-col justify-start relative z-20 space-y-6 lg:h-full lg:overflow-y-auto scrollbar-hide hover:scrollbar-default pr-4 lg:border-r lg:border-white/5 pointer-events-auto">
             <IdentityModule 
                agent={agent} 
                accentColor={accentColor} 
                onTagClick={onTagClick}
                isSpeaking={isSpeaking}
             />
          </div>

          {/* COLUMN 2: VISUAL DYNAMIC (Col-5) */}
          <div className="col-span-1 lg:col-span-5 relative flex flex-col justify-start z-20 space-y-6 lg:h-full lg:overflow-y-auto scrollbar-hide hover:scrollbar-default lg:border-r lg:border-white/5 px-2 pointer-events-auto">
             <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-6"
             >
                {/* 1. Visual Proof (Now with Holographic Video Frame) */}
                <HoloFrame agent={agent} accentColor={accentColor} />

                {/* V13.1: Tactical Medals (Desktop Only - Moved from Left Column) */}
                <div className="hidden lg:block w-full">
                    <div className="text-[9px] font-mono text-gray-500 mb-2 uppercase tracking-widest flex items-center gap-2 opacity-80">
                        <Shield size={10} /> TACTICAL_MATRIX
                    </div>
                    <MedalRack badges={displayBadges} onClick={onTagClick} />
                </div>

                {/* 2. V13.0: Sponsored Uplink (Tactical Footer) */}
                <AdFrame type="BANNER" />

                {/* 3. Description (High Readability) */}
                <div className="bg-black/20 border-l-2 border-white/10 pl-6 py-4 mb-4 rounded-r-lg">
                    <p className="text-sm lg:text-base text-gray-300 font-sans leading-relaxed tracking-wide text-justify">
                        {agent.description}
                    </p>
                </div>

             </motion.div>
          </div>

          {/* COLUMN 3: INTEL DATA HUB (Col-4) */}
          <div className="col-span-1 lg:col-span-4 relative flex flex-col justify-start z-20 space-y-4 lg:h-full lg:overflow-y-auto scrollbar-hide hover:scrollbar-default pb-24 pr-2 pointer-events-auto">
             <DataDeck agent={agent} accentColor={accentColor} />
          </div>

        </div>
      </div>
    </div>
  );
};
