import React from 'react';
import { m } from 'framer-motion';
import { MultimodalTray } from './MultimodalTray';
import { ActionControls } from './ActionControls';
import { CommandMenu } from './CommandMenu';
import { AgentMentionMenu } from './AgentMentionMenu';
import { Agent } from '../../../types';

interface SearchOmniboxProps {
    inputValue: string;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    isFocused: boolean;
    setIsFocused: (val: boolean) => void;
    isDragging: boolean;
    dropzoneProps: any;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    triggerIngestion: () => void;
    isMobile: boolean;
    inputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement>;
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
    const showCommandMenu = isFocused && inputValue.startsWith('/');
    const showAgentMenu = isFocused && inputValue.match(/@([^\s]*)$/) !== null;

    const handleMouseEnter = () => {
        // Preconnect logic removed as we use internal proxy
    };

    return (
        <div className="flex-1 relative flex items-center" onMouseEnter={handleMouseEnter}>
            <m.div 
                className={`w-full relative group border-2 transition-all duration-300 flex items-center px-4 py-2 rounded-xl ${
                    isFocused 
                        ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] bg-black/80' 
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

                    <textarea 
                        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        rows={1}
                        className="w-full bg-transparent outline-none text-cyan-50 resize-none font-mono placeholder-cyan-500/30"
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

            {/* Dropdown Menus */}
            {voiceFeedback && (
                <div className="absolute bottom-[-25px] left-0 text-[10px] font-mono text-cyan-400 tracking-tighter">
                    [ {voiceFeedback} ]
                </div>
            )}
            
            {showCommandMenu && (
                <CommandMenu 
                    inputValue={inputValue}
                    onSelect={(cmd) => setInputValue(cmd)}
                    inputRef={inputRef}
                />
            )}
            
            {showAgentMenu && (
                <AgentMentionMenu 
                    inputValue={inputValue}
                    agents={popularAgents}
                    onSelect={(name) => setInputValue(inputValue.replace(/@([^\s]*)$/, `@${name} `))}
                    inputRef={inputRef}
                />
            )}
        </div>
    );
};
