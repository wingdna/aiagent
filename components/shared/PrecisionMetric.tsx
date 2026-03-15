import React, { useId, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';

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
        <m.div 
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
                    <m.div
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
                    </m.div>
                )}
            </AnimatePresence>

            {/* LEFT: FIXED NEURAL ICON */}
            <div className="w-4 md:w-5 flex items-center justify-center shrink-0">
                <Icon 
                    className={`w-3 h-3 md:w-[15px] md:h-[15px] transition-all duration-300 ${isHovered ? 'drop-shadow-[0_0_8px_currentColor] opacity-100' : 'text-gray-500 opacity-60'}`} 
                    style={{ color: isHovered ? accentColor : 'currentColor' }} 
                />
            </div>
            
            {/* CENTER: PIXEL PROGRESS BAR (20 Blocks) */}
            <div className="flex items-center gap-[2px]">
                {Array.from({ length: 20 }).map((_, i) => {
                    const threshold = (i + 1) * 5; // Each block represents 5%
                    const isFilled = safeValue >= threshold;
                    const isPartial = !isFilled && safeValue > (i * 5);
                    
                    return (
                        <div 
                            key={i} 
                            className={`w-1 h-2.5 md:w-1.5 md:h-3 rounded-[1px] transition-all duration-300 ${
                                isFilled ? 'opacity-100 shadow-[0_0_4px_currentColor]' : 'opacity-20 bg-white/10'
                            }`}
                            style={{ 
                                backgroundColor: isFilled ? accentColor : undefined,
                                boxShadow: isFilled ? `0 0 4px ${accentColor}` : 'none'
                            }}
                        />
                    );
                })}
            </div>

            {/* RIGHT: DATA VALUE - COMPACT ALIGNMENT */}
            <div className="ml-3 min-w-[24px] text-right">
                <span 
                    className="text-[9px] md:text-[11px] font-mono font-bold tracking-tighter tabular-nums transition-all duration-300"
                    style={{ color: isHovered ? accentColor : '#666' }}
                >
                    {safeValue}
                </span>
            </div>
        </m.div>
    );
};