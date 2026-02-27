import React from 'react';
import { Wifi } from 'lucide-react';

export const AdFrame: React.FC<{ type: 'BANNER' | 'CUBE', className?: string }> = ({ type, className }) => {
    return (
        <div className={`relative border border-white/10 bg-black/40 overflow-hidden group ${type === 'BANNER' ? 'h-24 w-full rounded-lg' : 'h-64 w-full rounded-xl'} ${className || ''}`}>
            {/* Header */}
            <div className="absolute top-0 left-0 bg-white/5 px-2 py-1 flex items-center gap-2 border-b border-white/5 border-r rounded-br-lg z-20">
                <Wifi size={10} className="text-gray-500 animate-pulse" />
                <span className="text-[8px] font-mono text-gray-600 tracking-widest">SPONSORED_UPLINK</span>
            </div>

            {/* Glitch Border */}
            <div className="absolute inset-0 border border-transparent group-hover:border-white/20 transition-colors pointer-events-none z-10"></div>
            
            {/* Placeholder Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black opacity-10">
                <div className="w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_linear_infinite]"></div>
            </div>
            
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-2 opacity-50 group-hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 border-2 border-dashed border-gray-600 rounded animate-spin-slow"></div>
                <span className="text-[9px] font-mono text-gray-500 animate-pulse">WAITING_FOR_SIGNAL...</span>
            </div>
        </div>
    );
};