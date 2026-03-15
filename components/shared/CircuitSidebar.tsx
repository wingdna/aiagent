import React, { useState } from 'react';
import { Heart, Bookmark, Share2, Home, ExternalLink } from 'lucide-react';
import { TacticalBridge } from './TacticalBridge';

interface CircuitSidebarProps {
  accentColor: string;
  onConnect: () => void;
  onSync: () => void;
  onLike: () => void;
  onShare: () => void;
  onEnterLounge?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
  className?: string;
  // Navigation Props
  onPrev?: () => void;
  onNext?: () => void;
  onNeuralRadar?: () => void;
  isScanning?: boolean;
}

export const CircuitSidebar: React.FC<CircuitSidebarProps> = ({ 
    accentColor, 
    onConnect, 
    onSync, 
    onLike, 
    onShare,
    onEnterLounge,
    isLiked = false,
    isBookmarked = false,
    className,
    onPrev,
    onNext,
    onNeuralRadar,
    isScanning
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const ActionButton = ({ icon: Icon, label, onClick, active, color, primary = false, large = false }: any) => (
      <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`relative flex items-center justify-center group transition-all duration-300 
            ${primary ? 'md:w-12 md:h-12 w-10 h-10' : 'md:w-10 md:h-10 w-9 h-9'}
        `}
      >
          {/* Icon Container */}
          <div className={`
            relative z-10 flex items-center justify-center rounded-lg transition-all duration-300 border backdrop-blur-sm
            ${primary 
                ? 'w-full h-full bg-white text-black border-white hover:bg-cyan-400 hover:border-cyan-400 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                : `w-full h-full ${active ? `bg-${color}-500/20 text-${color}-500 border-${color}-500` : 'bg-black/60 border-white/10 text-gray-400 hover:text-white hover:bg-white/20 hover:border-white/40'}`
            }
          `}
          style={!primary && active && color !== 'red' && color !== 'blue' ? { borderColor: accentColor, color: accentColor, backgroundColor: `${accentColor}20` } : {}}
          >
            <Icon size={primary ? 20 : 16} strokeWidth={2} fill={!primary && active ? "currentColor" : "none"} className={`transition-transform ${primary ? 'md:scale-110' : ''}`} />
          </div>

          {/* Label Expansion (Hidden on mobile to save space, visible on Desktop Hover) */}
          <div className={`hidden md:flex absolute right-full mr-3 top-1/2 -translate-y-1/2 items-center justify-end overflow-hidden transition-all duration-300 pointer-events-none ${isHovered ? 'w-40 opacity-100' : 'w-0 opacity-0'}`}>
              <div className="bg-black/90 border border-white/10 px-3 py-1.5 rounded text-right backdrop-blur-md shadow-xl whitespace-nowrap">
                  <div className={`text-[10px] font-bold font-display tracking-widest ${primary ? 'text-cyan-400' : 'text-white'}`}>{label}</div>
              </div>
          </div>
      </button>
  );

  return (
    <>
        {/* UNIFIED RAIL: Fixed Right for BOTH Mobile and Desktop */}
        <div 
            className={`fixed right-0 top-1/2 -translate-y-1/2 z-[100] flex flex-col items-end gap-3 md:gap-4 p-2 md:p-4 transition-all duration-300 ${className || ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Backdrop Area for Hover Detection (Desktop only visual) */}
            <div className={`hidden md:block absolute inset-y-0 right-0 bg-gradient-to-l from-black/90 to-transparent transition-all duration-500 -z-10 rounded-l-2xl ${isHovered ? 'w-48 border-l border-white/5 backdrop-blur-md' : 'w-full delay-500'}`} />

            <div className="flex flex-col gap-2 md:gap-4 items-end relative z-20">
                {onEnterLounge && (
                    <ActionButton icon={Home} label="ENTER_LOUNGE" onClick={onEnterLounge} color="white" active={false} />
                )}
                
                {/* Primary Action: Initialize */}
                <ActionButton icon={ExternalLink} label="INITIALIZE_LINK" onClick={onConnect} color="cyan-400" active={true} primary />
                
                <div className="h-px w-6 md:w-8 bg-white/10 my-1 mr-1" />
                
                <ActionButton icon={Heart} label="ENDORSE_AGENT" onClick={onLike} active={isLiked} color="red" />
                <ActionButton icon={Bookmark} label="SYNC_DATABASE" onClick={onSync} active={isBookmarked} color="blue" />
                <ActionButton icon={Share2} label="BROADCAST_SIGNAL" onClick={onShare} active={false} color="white" />
            </div>

            {/* V2: TACTICAL BRIDGE (Navigation Cluster) */}
            {onPrev && onNext && onNeuralRadar && onEnterLounge && (
                <div className="mt-16 hidden md:block">
                    <TacticalBridge 
                        onPrev={onPrev}
                        onNext={onNext}
                        onNeuralRadar={onNeuralRadar}
                        onTerminalUplink={onEnterLounge}
                        isScanning={isScanning}
                    />
                </div>
            )}
        </div>
    </>
  );
};