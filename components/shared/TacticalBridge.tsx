import React from 'react';
import { MoveUp, MoveDown, MoveLeft, MoveRight } from 'lucide-react';
import { m } from 'framer-motion';

interface TacticalBridgeProps {
    onPrev: () => void;
    onNext: () => void;
    onNeuralRadar: () => void;
    onTerminalUplink: () => void;
    isScanning?: boolean;
}

export const TacticalBridge: React.FC<TacticalBridgeProps> = ({
    onPrev,
    onNext,
    onNeuralRadar,
    onTerminalUplink,
    isScanning = false
}) => {
    const BridgeButton = ({ icon: Icon, onClick, tooltip, active = false, direction }: any) => (
        <m.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`
                relative group flex items-center justify-center w-10 h-10 md:w-12 md:h-12
                bg-black/40 backdrop-blur-md border border-white/10 rounded-xl
                hover:bg-cyan-950/30 hover:border-cyan-500/50 transition-all duration-300
                ${active ? 'shadow-[0_0_15px_rgba(34,211,238,0.3)] border-cyan-500/50' : ''}
            `}
        >
            <Icon 
                size={20} 
                className={`text-gray-400 group-hover:text-cyan-400 transition-colors ${active ? 'text-cyan-400' : ''}`} 
            />
            
            {/* Tooltip */}
            <div className={`
                absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200
                bg-black/90 border border-cyan-500/20 text-cyan-500 text-[9px] font-mono tracking-widest px-2 py-1 rounded whitespace-nowrap z-50
                ${direction === 'left' ? 'right-full mr-3' : ''}
                ${direction === 'right' ? 'right-full mr-3' : ''}
                ${direction === 'up' ? 'right-full mr-3' : ''}
                ${direction === 'down' ? 'right-full mr-3' : ''}
            `}>
                {tooltip}
            </div>
        </m.button>
    );

    return (
        <div className="flex flex-col items-center gap-2 mt-16 relative z-50">
            {/* Cross Configuration */}
            <div className="grid grid-cols-3 gap-2">
                <div className="col-start-2">
                    <BridgeButton 
                        icon={MoveUp} 
                        onClick={onPrev} 
                        tooltip="[ CMD: PREV_ENTITY ]" 
                        direction="up"
                    />
                </div>
                <div className="col-start-1 row-start-2">
                    <BridgeButton 
                        icon={MoveLeft} 
                        onClick={onNeuralRadar} 
                        tooltip={isScanning ? "[ STATUS: SCANNING... ]" : "[ CMD: NEURAL_RADAR ]"} 
                        active={isScanning}
                        direction="left"
                    />
                </div>
                <div className="col-start-3 row-start-2">
                    <BridgeButton 
                        icon={MoveRight} 
                        onClick={onTerminalUplink} 
                        tooltip="[ CMD: TERMINAL_UPLINK ]" 
                        direction="right"
                    />
                </div>
                <div className="col-start-2 row-start-3">
                    <BridgeButton 
                        icon={MoveDown} 
                        onClick={onNext} 
                        tooltip="[ CMD: NEXT_ENTITY ]" 
                        direction="down"
                    />
                </div>
            </div>
            
            {/* Decorative Connection Lines */}
            <div className="absolute inset-0 pointer-events-none -z-10">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-24 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
            </div>
        </div>
    );
};
