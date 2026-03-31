
import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Agent } from '../../types';
import { optimizeImage } from '../../utils';

interface PersonaLayerProps {
    agent: Agent;
    accentColor?: string; // Retained for compatibility
    isSpeaking: boolean;
    className?: string;
}

export const PersonaLayer: React.FC<PersonaLayerProps> = ({ agent, isSpeaking, className }) => {
  const src = optimizeImage(agent.persona_img || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop', 800);
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => { 
      const img = new Image(); 
      img.src = src; 
      img.onload = () => setLoaded(true); 
  }, [src]);

  return (
    <div className={`relative flex items-end justify-center pointer-events-none z-0 ${className || 'fixed bottom-0 right-0 h-[85vh] w-auto'}`}>
       
       {/* STAGE LIGHT: Black Backdrop to isolate the hologram from background noise */}
       <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_70%)] opacity-90 mix-blend-normal"></div>

       <AnimatePresence>
          {loaded && (
             <m.img 
                key={agent.id} 
                src={src} 
                alt={String(agent.name || '')}
                initial={{ opacity: 0, filter: 'blur(10px) brightness(0)' }}
                animate={{ 
                    opacity: 1, 
                    // V28.0: Anime Pop Filter (Vibrant Colors + High Contrast)
                    filter: isSpeaking 
                        ? 'brightness(1.3) contrast(1.2) saturate(1.4) drop-shadow(0 0 10px rgba(0,255,255,0.5))' 
                        : 'contrast(1.1) brightness(1.2) saturate(1.3)',
                    scale: isSpeaking ? 1.02 : 1
                }} 
                exit={{ opacity: 0, filter: 'blur(10px) brightness(0)' }} 
                transition={{ duration: 0.5 }}
                className="relative z-10 h-full w-auto object-contain object-bottom bg-transparent border-none shadow-none"
                style={{ 
                    mixBlendMode: 'screen', 
                    // V28.0: Clear Face Mask (Top opaque, bottom fade)
                    maskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)', 
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)' 
                }} 
             />
          )}
       </AnimatePresence>
    </div>
  );
};
