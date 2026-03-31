import React from 'react';
import { m } from 'framer-motion';
import { AgentRegistryEntity } from '../../app/types/registry';

export const HoloAvatar: React.FC<{ agent: AgentRegistryEntity, className?: string }> = ({ agent, className }) => {
    const src = agent.persona_img || agent.assets.video_poster;
    
    return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden z-0 ${className || ''}`}>
            <m.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full"
            >
                <img 
                    src={src} 
                    className="w-full h-full object-cover object-top opacity-15 mix-blend-screen grayscale-[20%] contrast-125"
                    loading="lazy"
                    decoding="async"
                    style={{
                        maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 90%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 90%)'
                    }}
                    alt=""
                />
            </m.div>
            {/* Digital Noise Overlay - Optimized with CSS pattern instead of GIF */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
                 style={{
                     backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                 }}
            ></div>
        </div>
    );
};