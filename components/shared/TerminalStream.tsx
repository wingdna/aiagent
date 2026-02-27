
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TerminalStreamProps {
    text: string;
    isTyping?: boolean;
    className?: string;
    color?: string; // Hex or tailwind class text-color
}

export const TerminalStream: React.FC<TerminalStreamProps> = ({ text, isTyping, className, color = '#00FF41' }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [text]);

    return (
        <div className={`font-mono text-xs md:text-sm overflow-y-auto ${className}`} style={{ color: color }}>
            <div className="whitespace-pre-wrap leading-relaxed tracking-wide drop-shadow-[0_0_5px_rgba(0,255,65,0.5)]">
                {text}
                {isTyping && (
                    <motion.span 
                        animate={{ opacity: [0, 1, 0] }} 
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block w-2 h-4 bg-current ml-1 align-middle"
                    />
                )}
            </div>
            <div ref={bottomRef} />
            
            {/* Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] opacity-20"></div>
        </div>
    );
};
