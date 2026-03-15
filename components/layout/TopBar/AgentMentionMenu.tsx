import React from 'react';
import { m } from 'framer-motion';
import { Agent } from '../../../types';

interface AgentMentionMenuProps {
    inputValue: string;
    agents: Agent[];
    onSelect: (agentName: string) => void;
    inputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement>;
}

export const AgentMentionMenu: React.FC<AgentMentionMenuProps> = ({ inputValue, agents, onSelect, inputRef }) => {
    const atMatch = inputValue.match(/@([^\s]*)$/);
    if (!atMatch) return null;
    
    const agentSearchText = atMatch[1].toLowerCase();
    const filteredAgents = agents.filter(a => a.name.toLowerCase().includes(agentSearchText));

    if (filteredAgents.length === 0) return null;

    return (
        <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-72 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto no-scrollbar"
        >
            {filteredAgents.map(agent => (
                <div 
                    key={agent.id}
                    className="px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 group transition-colors"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(agent.name);
                        inputRef.current?.focus();
                    }}
                >
                    <div className="w-6 h-6 rounded bg-black/80 flex items-center justify-center text-cyan-400 font-bold text-xs border border-white/5 shrink-0">
                        {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-mono text-white text-sm group-hover:text-cyan-400 transition-colors truncate">{agent.name}</span>
                </div>
            ))}
        </m.div>
    );
};
