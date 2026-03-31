import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Camera as IconCamera, Mic, CornerDownLeft } from 'lucide-react';

interface ActionControlsProps {
    isListening: boolean;
    toggleVoiceInput: (e: React.MouseEvent) => void;
    inputValue: string;
    onEnter: () => void;
    onCameraClick: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
    isListening,
    toggleVoiceInput,
    inputValue,
    onEnter,
    onCameraClick
}) => {
    return (
        <div className="flex items-center gap-2 shrink-0 ml-2">
            <label className="cursor-pointer p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-cyan-400">
                <input type="file" className="hidden" accept="image/*" capture="environment" onChange={onCameraClick} />
                <IconCamera className="w-5 h-5" />
            </label>

            <button 
                onClick={toggleVoiceInput}
                className={`relative p-2 rounded-lg transition-all duration-300 ${
                    isListening 
                    ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-110' 
                    : 'text-gray-400 hover:text-cyan-400 hover:bg-white/10'
                }`}
            >
                <Mic size={20} className={isListening ? 'animate-pulse' : ''} />
            </button>

            <AnimatePresence>
                {inputValue && (
                    <m.button 
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="p-2 bg-cyan-500 text-black rounded-lg shadow-[0_0_10px_cyan] ml-1"
                        onClick={onEnter}
                    >
                        <CornerDownLeft size={16} />
                    </m.button>
                )}
            </AnimatePresence>
        </div>
    );
};
