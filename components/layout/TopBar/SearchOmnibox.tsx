import React, { useEffect } from 'react';
import { m } from 'framer-motion';
import { MultimodalTray } from './MultimodalTray';
import { ActionControls } from './ActionControls';
import { Agent } from '../../../types';

interface SearchOmniboxProps {
    inputValue: string;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    isFocused: boolean;
    setIsFocused: (val: boolean) => void;
    isDrawerOpen: boolean;
    setIsDrawerOpen: (val: boolean) => void;
    isSearchActive: boolean;
    setIsSearchActive: (val: boolean) => void;
    isDragging: boolean;
    dropzoneProps: any;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    triggerIngestion: () => void;
    isMobile: boolean;
    inputRef: React.RefObject<HTMLInputElement>;
    isListening: boolean;
    toggleVoiceInput: (e: React.MouseEvent) => void;
    voiceFeedback: string | null;
    onEnter: () => void;
    popularAgents: Agent[];
}

export const SearchOmnibox: React.FC<SearchOmniboxProps> = ({
    inputValue,
    setInputValue,
    handleKeyDown,
    isFocused,
    setIsFocused,
    isDrawerOpen,
    setIsDrawerOpen,
    isSearchActive,
    setIsSearchActive,
    isDragging,
    dropzoneProps,
    fileInputRef,
    handleFileChange,
    triggerIngestion,
    isMobile,
    inputRef,
    isListening,
    toggleVoiceInput,
    voiceFeedback,
    onEnter,
    popularAgents
}) => {
    const isTerminalMode = inputValue.startsWith('/');

    // [UNIFIED_SEARCH_MODAL_V5] Open drawer if input has content
    useEffect(() => {
        if (inputValue.length > 0) {
            setIsDrawerOpen(true);
        } else {
            setIsDrawerOpen(false);
            setIsSearchActive(false);
        }
    }, [inputValue, setIsDrawerOpen, setIsSearchActive]);

    const handleMouseEnter = () => {
        // Preconnect logic removed as we use internal proxy
    };

    return (
        <div className="flex-1 relative flex items-center" onMouseEnter={handleMouseEnter}>
            <m.div 
                className={`w-full relative group border-2 transition-all duration-300 flex items-center px-2 py-1.5 md:px-4 md:py-2 rounded-xl ${
                    isFocused 
                        ? isTerminalMode 
                            ? 'border-cyan-600 shadow-[0_0_25px_rgba(8,145,178,0.4)] bg-cyan-900/10'
                            : 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] bg-black/80' 
                        : isDragging 
                            ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] bg-black/60' 
                            : 'border-cyan-500/30 bg-[#050505e6]'
                }`}
                whileHover={!isFocused ? { borderColor: 'rgba(34, 211, 238, 0.6)' } : {}}
            >
                <div className="flex-1 flex items-center" {...(!isMobile ? dropzoneProps.getRootProps() : {})}>
                    {!isMobile && <input {...dropzoneProps.getInputProps()} />}
                    
                    <div className="flex gap-3 opacity-40 group-hover:opacity-100 transition-opacity mr-3 shrink-0">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileChange} 
                            multiple 
                        />
                        <MultimodalTray onTriggerIngestion={triggerIngestion} isMobile={isMobile} />
                    </div>
 
                    <input 
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        value={inputValue}
                        onChange={(e) => {
                            const val = e.target.value;
                            setInputValue(val);
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        className={`w-full bg-transparent outline-none text-cyan-50 font-mono placeholder-cyan-500/30 transition-all duration-300 ${
                            isTerminalMode ? 'text-cyan-400' : ''
                        }`}
                        placeholder={isDragging ? "> READY FOR INGESTION" : "INGEST DATA OR TYPE COMMAND..."}
                    />
                </div>

                <ActionControls 
                    isListening={isListening}
                    toggleVoiceInput={toggleVoiceInput}
                    inputValue={inputValue}
                    onEnter={onEnter}
                    onCameraClick={(e) => {
                        if (e.target.files?.length) {
                            setInputValue(prev => prev + ` [FILE: ${e.target.files![0].name}] `);
                        }
                    }}
                />
            </m.div>
            
            {/* Voice Feedback */}
            {voiceFeedback && (
                <div className="absolute bottom-[-25px] left-0 text-[10px] font-mono text-cyan-400 tracking-tighter">
                    [ {voiceFeedback} ]
                </div>
            )}
        </div>
    );
};
