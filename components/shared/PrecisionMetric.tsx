import React, { useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrecisionMetricProps {
    label: string;
    value: number;
    accentColor: string;
    icon: React.ElementType;
    delay?: number;
}

/**
 * YOUAGENT PRECISION METRIC V8.0
 * Aesthetic: Fixed grid with floating tactical tooltip.
 * Behavior: Stable, non-shifting layout.
 */
export const PrecisionMetric: React.FC<PrecisionMetricProps> = ({ label, value, accentColor, icon: Icon, delay = 0 }) => {
    const uniqueId = useId().replace(/:/g, '');
    const [isHovered, setIsHovered] = useState(false);
    
    // Logic: 0-100 mapped to 0-5 stars
    const safeValue = isNaN(value) ? 0 : value;
    const rating = Math.max(0, Math.min(5, safeValue / 20));

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex items-center gap-2 md:gap-4 group cursor-default select-none h-6 md:h-8 relative"
        >
            {/* TACTICAL TOOLTIP: Floats above the icon on hover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.9 }}
                        animate={{ opacity: 1, y: -24, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.9 }}
                        className="absolute left-0 z-50 pointer-events-none"
                    >
                        <div className="px-2 py-0.5 rounded bg-white text-black text-[9px] font-display font-black tracking-widest uppercase shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                            {label}
                        </div>
                        {/* Triangle pointer */}
                        <div className="w-1.5 h-1.5 bg-white rotate-45 mx-auto -mt-1 shadow-sm" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LEFT: FIXED NEURAL ICON */}
            <div className="w-4 md:w-5 flex items-center justify-center shrink-0">
                <Icon 
                    className={`w-3 h-3 md:w-[15px] md:h-[15px] transition-all duration-300 ${isHovered ? 'drop-shadow-[0_0_8px_currentColor] opacity-100' : 'text-gray-500 opacity-60'}`} 
                    style={{ color: isHovered ? accentColor : 'currentColor' }} 
                />
            </div>
            
            {/* CENTER: MINIMALIST STAR ARRAY */}
            <div className="flex items-center gap-0.5 md:gap-1">
                {[0, 1, 2, 3, 4].map((i) => {
                    const fillPct = Math.max(0, Math.min(100, (rating - i) * 100));
                    const gradientId = `star-v8-${uniqueId}-${i}`;
                    
                    return (
                        <div key={i} className="w-2.5 h-2.5 md:w-3.5 md:h-3.5">
                            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
                                <defs>
                                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset={`${fillPct}%`} stopColor={accentColor} />
                                        <stop offset={`${fillPct}%`} stopColor="rgba(255,255,255,0.08)" />
                                    </linearGradient>
                                </defs>
                                <path 
                                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                                    fill={`url(#${gradientId})`} 
                                    className="transition-all duration-700"
                                    style={{ 
                                        filter: (isHovered && fillPct > 0) ? `drop-shadow(0 0 3px ${accentColor})` : 'none' 
                                    }}
                                />
                            </svg>
                        </div>
                    );
                })}
            </div>

            {/* RIGHT: DATA VALUE - COMPACT ALIGNMENT */}
            <div className="ml-3">
                <span 
                    className="text-[9px] md:text-[11px] font-mono font-bold tracking-tighter tabular-nums transition-all duration-300"
                    style={{ color: isHovered ? accentColor : '#666' }}
                >
                    {safeValue}
                </span>
            </div>
        </motion.div>
    );
};