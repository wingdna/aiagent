
import React, { useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Trophy, Zap } from 'lucide-react';

interface AchievementToastProps {
    title: string;
    description: string;
    onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ title, description, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <m.div 
            initial={{ y: -100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.8 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
        >
            <div className="relative bg-black/90 border border-yellow-500/50 px-8 py-4 rounded-lg shadow-[0_0_30px_rgba(234,179,8,0.3)] flex items-center gap-4 clip-angle overflow-hidden">
                {/* Glitch Overlay */}
                <div className="absolute inset-0 bg-yellow-500/10 animate-pulse mix-blend-overlay"></div>
                {/* Removed scanline effect */}
                
                <div className="relative z-10 p-2 bg-yellow-500/20 rounded-full border border-yellow-500 text-yellow-500">
                    <Trophy size={24} className="animate-bounce" />
                </div>
                
                <div className="relative z-10 text-left">
                    <div className="flex items-center gap-2">
                        <Zap size={12} className="text-yellow-500" />
                        <span className="text-[10px] font-mono text-yellow-500 tracking-widest uppercase">ACHIEVEMENT_UNLOCKED</span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-white tracking-wider uppercase drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
                        {title}
                    </h3>
                    <p className="text-xs font-mono text-gray-400">{description}</p>
                </div>
            </div>
        </m.div>
    );
};
