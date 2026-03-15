
import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FileText, Rss, ArrowUpRight, Zap, RefreshCw } from 'lucide-react';
import { Agent } from '../../types';

interface IntelPreviewProps {
    agent: Agent;
    accentColor: string;
}

export const IntelPreview: React.FC<IntelPreviewProps> = ({ agent, accentColor }) => {
    const [intelItems, setIntelItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Parallel Data Flow: Fetch Intel independently from Agent Core
    useEffect(() => {
        let mounted = true;
        
        const loadIntel = async () => {
            setLoading(true);
            try {
                // V-GOLDEN-GATE: Use Real Data
                const realFeed = agent.intel_feed;
                const socials = agent.developer_socials;

                if (realFeed && realFeed.length > 0) {
                     if (mounted) setIntelItems(realFeed);
                     return;
                }
                
                // Fallback: Generate Feed from Socials
                if (socials) {
                    const generatedFeed = [];
                    if (socials.github) {
                        generatedFeed.push({
                            type: 'CODE',
                            title: 'Source Repository Active',
                            date: 'Live',
                            url: socials.github
                        });
                    }
                    if (socials.twitter) {
                        generatedFeed.push({
                            type: 'SOCIAL',
                            title: 'Developer Updates',
                            date: 'Live',
                            url: socials.twitter
                        });
                    }
                    if (socials.website) {
                         generatedFeed.push({
                            type: 'WEB',
                            title: 'Official Documentation',
                            date: 'Live',
                            url: socials.website
                        });
                    }
                    
                    if (generatedFeed.length > 0) {
                        if (mounted) setIntelItems(generatedFeed);
                        return;
                    }
                }

                // Final Fallback: Empty State
                if (mounted) setIntelItems([]);

            } catch (e) {
                if (mounted) setIntelItems([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadIntel();
        return () => { mounted = false; };
    }, [agent.id, agent.intel_feed, agent.developer_socials]);

    // [SURGICAL_UI_PURGE] Hide component if no data
    const shouldShow = loading || intelItems.length > 0;

    return (
        <AnimatePresence mode="popLayout">
            {shouldShow && (
                <m.div 
                    key="intel-preview-container"
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95, marginTop: 0, marginBottom: 0, overflow: 'hidden' }}
                    className="w-full max-w-2xl md:bg-black/60 md:border md:border-white/10 md:backdrop-blur-md md:rounded-xl md:shadow-2xl relative group min-h-[160px]"
                >
                    {/* Scanline Effect - Desktop Only */}
                    <div className="hidden md:block absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20"></div>
                    
                    <div className="p-2 md:p-4 border-b border-white/10 flex justify-between items-center bg-white/5 md:bg-white/5 rounded-t-xl">
                        <div className="flex items-center gap-2">
                            <Rss size={14} style={{ color: accentColor }} className={loading ? "animate-spin" : "animate-pulse"} />
                            <span className="text-[10px] font-display font-bold tracking-widest text-white">
                                {loading ? 'SYNCING_FEED...' : 'INTEL_LAYER // LIVE_FEED'}
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse delay-75"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse delay-150"></div>
                        </div>
                    </div>

                    <div className="p-0 md:p-2 space-y-1 relative">
                        {loading ? (
                            <div className="flex flex-col gap-2 p-4">
                                <div className="h-8 bg-white/5 rounded animate-pulse"></div>
                                <div className="h-8 bg-white/5 rounded animate-pulse delay-75"></div>
                                <div className="h-8 bg-white/5 rounded animate-pulse delay-150"></div>
                            </div>
                        ) : intelItems.length === 0 ? (
                            <div className="p-8 text-center">
                                 <span className="text-[10px] font-mono text-gray-600 animate-pulse">[ NO_ACTIVE_FEEDS_DETECTED ]</span>
                            </div>
                        ) : (
                            intelItems.map((item, idx) => {
                                const hasUrl = !!item.url;
                                const Wrapper = hasUrl ? m.a : m.div;
                                const wrapperProps = hasUrl ? {
                                    href: item.url,
                                    target: "_blank",
                                    rel: "noopener noreferrer"
                                } : {};

                                return (
                                    <Wrapper 
                                        key={idx}
                                        {...wrapperProps}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`group/item flex flex-col gap-1 p-2 md:p-3 rounded-lg transition-all border border-transparent relative overflow-hidden ${
                                            hasUrl 
                                            ? 'hover:bg-cyan-500/10 cursor-pointer hover:border-cyan-500/30' 
                                            : 'bg-black/20 border-white/5'
                                        } ${idx > 1 ? 'hidden md:flex' : 'flex'}`}
                                    >
                                        {/* Hover Sweep Effect (Only if clickable) */}
                                        {hasUrl && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent translate-x-[-100%] group-hover/item:translate-x-[100%] transition-transform duration-700 ease-in-out pointer-events-none"></div>
                                        )}

                                        <div className="flex items-center gap-2 w-full">
                                            {/* Icon */}
                                            <div className={`opacity-60 transition-opacity relative z-10 shrink-0 ${hasUrl ? 'group-hover/item:opacity-100' : ''}`}>
                                                {item.type === 'NEWS' ? <Zap size={14} className="text-yellow-400" /> : <FileText size={14} className="text-blue-400" />}
                                            </div>

                                            {/* Type Label (Desktop) */}
                                            <span className="text-[9px] font-mono text-gray-500 tracking-wider shrink-0 uppercase hidden md:block w-16 text-center bg-white/5 rounded py-0.5">
                                                {item.type}
                                            </span>

                                            {/* Content Container (Flex Row) */}
                                            <div className="flex-1 min-w-0 relative z-10 flex items-center gap-2">
                                                {/* Title - Terminal Style */}
                                                <h4 className={`flex-1 min-w-0 text-xs md:text-sm font-mono leading-tight truncate ${
                                                    hasUrl 
                                                    ? 'font-bold text-gray-200 group-hover/item:text-white group-hover/item:underline decoration-cyan-500/50 decoration-2 underline-offset-2 transition-colors' 
                                                    : 'font-medium text-slate-300'
                                                }`}>
                                                    <span className="md:hidden text-gray-500 font-mono mr-1 text-[9px] uppercase tracking-wider">[{item.type}]</span>
                                                    {item.title}
                                                </h4>
                                            </div>

                                            {/* Date & Arrow - Right Aligned */}
                                            <div className="flex items-center gap-2 shrink-0 relative z-10">
                                                <span className="text-[9px] font-mono text-gray-600 whitespace-nowrap">
                                                    <span className="md:hidden">({item.date?.replace(' ago', '')})</span>
                                                    <span className="hidden md:inline">{item.date}</span>
                                                </span>
                                                {hasUrl && (
                                                    <ArrowUpRight size={14} className="text-gray-600 group-hover/item:text-cyan-400 transition-colors opacity-0 group-hover/item:opacity-100 hidden md:block" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Optional Summary (Terminal Subtext) */}
                                        {item.summary && (
                                            <div className="pl-8 pr-2 relative z-10">
                                                <p className="text-[10px] font-mono text-gray-500 leading-relaxed line-clamp-2 border-l border-white/10 pl-2">
                                                    {item.summary}
                                                </p>
                                            </div>
                                        )}
                                    </Wrapper>
                                );
                            })
                        )}
                    </div>
                    
                    <div className="p-2 bg-black/80 border-t border-white/5 text-center hidden md:block rounded-b-xl">
                        <span className="text-[9px] font-mono text-gray-500 hover:text-cyan-400 cursor-pointer transition-colors">VIEW_FULL_INTELLIGENCE_REPORT {">>"}</span>
                    </div>
                </m.div>
            )}
        </AnimatePresence>
    );
};
