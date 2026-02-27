import React from 'react';
import { 
    Flame, Gem, AlertTriangle, Key, Crown, Sparkles, 
    HardDrive, MousePointerClick, TrendingUp, Shield, HelpCircle 
} from 'lucide-react';

const BADGE_STYLES: Record<string, { icon: any, label: string, style: string, iconColor: string }> = {
    'SOTA': { 
        icon: Flame, 
        label: 'SOTA', 
        style: 'border-orange-500/60 bg-orange-900/20 shadow-[0_0_12px_rgba(249,115,22,0.5)] animate-pulse', 
        iconColor: 'text-orange-500' 
    },
    '0_COST': { 
        icon: Gem, 
        label: 'FREE', 
        style: 'border-cyan-400/50 bg-cyan-900/20 shadow-[0_0_10px_rgba(34,211,238,0.4)] backdrop-blur-sm', 
        iconColor: 'text-cyan-400' 
    },
    'UNFILTERED': { 
        icon: AlertTriangle, 
        label: 'RAW', 
        style: 'border-yellow-500/60 bg-yellow-900/10 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(234,179,8,0.1)_5px,rgba(234,179,8,0.1)_10px)]', 
        iconColor: 'text-yellow-500' 
    },
    'BYOK': { 
        icon: Key, 
        label: 'BYOK', 
        style: 'border-slate-300/40 bg-slate-800/60 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]', 
        iconColor: 'text-slate-200' 
    },
    'NEURAL_TITAN': { 
        icon: Crown, 
        label: 'TITAN', 
        style: 'border-purple-500/60 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-pulse', 
        iconColor: 'text-purple-400' 
    },
    'NEW_BORN': { 
        icon: Sparkles, 
        label: 'NEW', 
        style: 'border-matrix-green/50 bg-matrix-green/10 shadow-[0_0_8px_rgba(74,222,128,0.3)]', 
        iconColor: 'text-matrix-green' 
    },
    'LOCAL': { 
        icon: HardDrive, 
        label: 'LOCAL', 
        style: 'border-white/10 bg-white/5 hover:bg-white/10', 
        iconColor: 'text-gray-400' 
    },
    'ONE_CLICK': { 
        icon: MousePointerClick, 
        label: '1-CLK', 
        style: 'border-white/10 bg-white/5 hover:bg-white/10', 
        iconColor: 'text-gray-400' 
    },
    'PROFIT_UP': { 
        icon: TrendingUp, 
        label: 'ROI+', 
        style: 'border-white/10 bg-white/5 hover:bg-white/10', 
        iconColor: 'text-gray-400' 
    },
};

export const MedalRack: React.FC<{ badges: string[], onClick: (badge: string) => void, className?: string }> = ({ badges, onClick, className }) => {
    // Filter out badges that aren't defined or empty, limit to 6 for space
    const validBadges = badges.filter(b => b).slice(0, 6);

    if (validBadges.length === 0) return null;

    return (
        <div className={`grid grid-cols-3 gap-2 w-full relative z-10 ${className || ''}`}>
            {validBadges.map((badge, i) => {
                // Normalize badge key (uppercase)
                const key = badge.toUpperCase();
                const config = BADGE_STYLES[key] || { 
                    icon: Shield, 
                    label: key.substring(0, 4), 
                    style: 'border-white/10 bg-white/5', 
                    iconColor: 'text-gray-500' 
                };
                const Icon = config.icon;
                
                return (
                    <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); onClick(badge); }}
                        className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 px-1 py-2 md:px-2 md:py-2 rounded border transition-all hover:scale-105 active:scale-95 overflow-hidden group ${config.style}`}
                        title={badge}
                    >
                        <Icon size={12} className={`shrink-0 ${config.iconColor} drop-shadow-md`} />
                        <span className={`text-[8px] font-mono font-bold tracking-widest uppercase truncate ${config.iconColor.replace('text-', 'text-opacity-80 ')}`}>
                            {config.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};