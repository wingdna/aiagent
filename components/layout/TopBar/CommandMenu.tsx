import React from 'react';
import { m } from 'framer-motion';

interface CommandMenuProps {
    inputValue: string;
    onSelect: (cmd: string) => void;
    inputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement>;
}

const SYSTEM_COMMANDS = [
    { cmd: '/price free', desc: 'Filter free agents' },
    { cmd: '/price paid', desc: 'Filter paid agents' },
    { cmd: '/tag', desc: 'Search by tag' },
    { cmd: '/clear', desc: 'Clear tactical logs' }
];

export const CommandMenu: React.FC<CommandMenuProps> = ({ inputValue, onSelect, inputRef }) => {
    const filteredCommands = SYSTEM_COMMANDS.filter(c => c.cmd.startsWith(inputValue));
    
    if (filteredCommands.length === 0) return null;

    return (
        <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-72 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50"
        >
            {filteredCommands.map(cmd => (
                <div 
                    key={cmd.cmd}
                    className="px-4 py-3 hover:bg-white/10 cursor-pointer flex justify-between items-center group transition-colors"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(cmd.cmd + ' ');
                        inputRef.current?.focus();
                    }}
                >
                    <span className="font-mono text-cyan-400 text-sm">{cmd.cmd}</span>
                    <span className="text-xs text-gray-500 group-hover:text-gray-400">{cmd.desc}</span>
                </div>
            ))}
        </m.div>
    );
};
