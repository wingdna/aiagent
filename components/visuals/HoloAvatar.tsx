import React from 'react';
import { m } from 'framer-motion';
import { Agent } from '../../types';

export const HoloAvatar: React.FC<{ agent: Agent, className?: string }> = ({ agent, className }) => {
    const src = agent.persona_img || agent.video_poster;
    
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
                    style={{
                        maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 90%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 90%)'
                    }}
                />
            </m.div>
            {/* Digital Noise Overlay */}
            <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif')] opacity-[0.03] mix-blend-overlay"></div>
        </div>
    );
};