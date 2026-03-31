
import React, { useState, useRef, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AgentRegistryEntity } from '../../app/types/registry';
import { Agent } from '../../types';
import { NREProfile } from '../../hooks/useNRE';
import { PersonaLayer } from './PersonaLayer';
import { getCategoryColor, optimizeImage } from '../../utils';
import { Link } from 'react-router';
import { Zap, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { useInView } from 'react-intersection-observer';

// --- ATOMIC MODULES ---
import { IdentityModule } from '../tactical/IdentityModule';
import { HoloFrame, HoloFrameRef } from '../tactical/HoloFrame';
import { TacticalSidebar } from '../tactical/TacticalSidebar';
import { SocialProof } from '../agent/SocialProof';
import { MediaGallery } from '../agent/MediaGallery';
import { AudioPlayer } from '../agent/AudioPlayer';
import { DemoInteraction } from '../agent/DemoInteraction';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

import { ComplementarySynapses } from '../tactical/ComplementarySynapses';
import IntelFeed from '../tactical/IntelFeed';
import { CompetitiveLandscape } from '../tactical/CompetitiveLandscape';
import { MarketValidation } from '../tactical/MarketValidation';
import { VendorEcosystem } from '../tactical/VendorEcosystem';
import { NeuralLinkage } from '../tactical/NeuralLinkage';
import { ExpertReviewPanel } from '../tactical/ExpertReviewPanel';
import TacticalLinkModal from '../modals/TacticalLinkModal';

const LazySection: React.FC<{ children: React.ReactNode; className?: string; minHeight?: string }> = ({ children, className, minHeight = '100px' }) => {
    const { ref, inView } = useInView({
        triggerOnce: true,
        rootMargin: '200px 0px',
    });
    return (
        <div ref={ref} className={className} style={{ minHeight: inView ? 'auto' : minHeight }}>
            {inView ? children : null}
        </div>
    );
};

interface TacticalHUDProps {
    agent: AgentRegistryEntity & { syncStrength?: number };
    intelFeed?: any[];
    onConnect: () => void;
    onEnterLounge: () => void;
    onTagClick: (tag: string) => void;
    onLike: () => void;
    onBookmark: () => void;
    onShare: () => void;
    isLiked: boolean;
    isBookmarked: boolean;
    isForging?: boolean;
    isSpeaking: boolean;
    hideBackground?: boolean;
    nreProfile?: NREProfile;
    setNREProfile?: (p: NREProfile) => void;
    onPrev?: () => void;
    onNext?: () => void;
    prevAgentId?: string;
    nextAgentId?: string;
    onNeuralRadar?: () => void;
    isScanning?: boolean;
    relatedAgents?: AgentRegistryEntity[];
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({
    agent, intelFeed, onConnect, onEnterLounge, onTagClick, onLike, onBookmark, onShare,
    isLiked, isBookmarked, isForging, isSpeaking, hideBackground = false,
    nreProfile, setNREProfile,
    onPrev, onNext, prevAgentId, nextAgentId, onNeuralRadar, isScanning, relatedAgents = []
}) => {

    if (!agent || !agent.id) return null;
    const accentColor = getCategoryColor(agent.category || 'TEXT_GEN');

    // ⚡ Protocol V20.0: Optimize Huge Background Asset
    const heroBgUrl = optimizeImage(agent.assets.video_poster, 1920);

    const [expansion, setExpansion] = useState<'normal' | 'enlarged' | 'ultra' | 'full'>('normal');
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const holoFrameRef = useRef<HoloFrameRef>(null);

    const { data: modalData, refetch: refetchModalData } = useQuery({
        queryKey: ['agent-intel', agent.id],
        queryFn: () => dataService.getAgentIntel(agent.id),
        enabled: false,
    });

    const openLinkModal = () => {
        setIsLinkModalOpen(true);
        refetchModalData();
    };

    return (
        <div className="relative w-full min-h-screen flex flex-col font-sans bg-[#050505] md:bg-black md:bg-topology" id={`agent-${agent.id}`}>
            <TacticalLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                agent={agent}
                data={modalData}
            />
            <div style={{ '--hud-accent': accentColor } as React.CSSProperties} className="contents">

                {/* --- DYNAMIC BACKGROUND LAYERS (Desktop Only) --- */}
                {!hideBackground && (
                    <div className="hidden md:block">
                        <picture className="absolute inset-0 z-0 pointer-events-none fixed">
                            <source media="(min-width: 768px)" srcSet={heroBgUrl} />
                            <img
                                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                                className="w-full h-full object-cover grayscale mix-blend-luminosity opacity-15"
                                loading="eager"
                                {...({ fetchpriority: "high" } as any)}
                                width="1920"
                                height="1080"
                                alt=""
                            />
                        </picture>
                        <div className="absolute inset-0 z-0 pointer-events-none fixed">
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/40" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
                        </div>
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(0,255,65,0)_50%,rgba(0,255,65,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                    </div>
                )}

                <div className="sr-only">
                    {prevAgentId && <Link to={`/agent/${prevAgentId}`} rel="prev">Previous Agent</Link>}
                    {nextAgentId && <Link to={`/agent/${nextAgentId}`} rel="next">Next Agent</Link>}
                </div>

                <div className="relative z-10 h-auto w-full max-w-[1920px] pointer-events-auto pt-4 md:pt-24 pb-32 md:pb-24 pr-4 md:pr-12 pl-4 md:pl-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="order-1 md:order-1 md:col-span-3 flex flex-col gap-4">
                            <div className="h-full bg-black/20 border border-white/5 rounded-xl p-4 backdrop-blur-sm will-change-transform transform-gpu relative group/nav">
                            <IdentityModule
                                agent={agent}
                                accentColor={accentColor}
                                onTagClick={onTagClick}
                                isSpeaking={isSpeaking}
                            />

                            {onPrev && prevAgentId && (
                                <Link
                                    to={`/agent/${prevAgentId}`}
                                    onClick={(e) => { e.preventDefault(); onPrev(); }}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-black/50 border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-cyan-400 hover:bg-black hover:border-cyan-400 transition-all opacity-0 group-hover/nav:opacity-100 z-50 hidden md:flex"
                                    aria-label="Previous Agent"
                                >
                                    <ChevronLeft size={20} />
                                </Link>
                            )}
                        </div>

                        <SocialProof developer_socials={agent.developer_socials} social_proof={agent.social_proof} />
                    </div>

                    <div className="order-2 md:order-2 md:col-span-6 flex flex-col gap-4 relative group/holo">
                        <HoloFrame
                            ref={holoFrameRef}
                            agent={agent}
                            accentColor={accentColor}
                            expansion={expansion}
                            setExpansion={setExpansion}
                            onTerminalStateChange={setIsTerminalOpen}
                        />

                        {agent.assets.audio_sample_url && (
                            <div className="flex justify-end -mt-4 mb-2 relative z-20">
                                <AudioPlayer audio_sample_url={agent.assets.audio_sample_url} />
                            </div>
                        )}

                        <MediaGallery media_gallery={agent.assets.media_gallery} gif_url={agent.assets.gif_url} />

                        {onNext && nextAgentId && (
                            <Link
                                to={`/agent/${nextAgentId}`}
                                onClick={(e) => { e.preventDefault(); onNext(); }}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-12 h-12 bg-black/50 border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-cyan-400 hover:bg-black hover:border-cyan-400 transition-all opacity-0 group-hover/holo:opacity-100 z-50 hidden md:flex"
                                aria-label="Next Agent"
                            >
                                <ChevronRight size={20} />
                            </Link>
                        )}

                        <div className="bg-black/20 border-l-2 border-white/10 pl-6 py-4 rounded-r-lg backdrop-blur-sm">
                            <p className="text-sm lg:text-base text-gray-300 font-sans leading-relaxed tracking-wide text-justify whitespace-pre-wrap">
                                {String(agent.description || '')}
                            </p>
                        </div>

                        {agent.full_description && agent.full_description.trim() !== (agent.description || '').trim() && (
                            <div className="mt-4 bg-black/20 border border-white/5 rounded-xl p-6 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex items-center gap-2 mb-6 text-[10px] font-mono text-cyan-500 uppercase tracking-widest border-b border-cyan-900/30 pb-2">
                                    <FileText size={12} aria-hidden="true" /> <h3>SYSTEM_OVERVIEW</h3>
                                </div>
                                <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-white prose-p:text-white prose-li:text-white prose-a:text-white prose-a:underline prose-a:decoration-cyan-500/50 hover:prose-a:text-cyan-300 prose-code:text-emerald-400 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-strong:text-white prose-ul:marker:text-cyan-500/50">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm as any]}
                                        rehypePlugins={[rehypeRaw as any]}
                                        components={{
                                            h1: ({node, ...props}) => <h1 className="text-lg font-bold text-white mb-2" {...props} />,
                                            h2: ({node, ...props}) => <h2 className="text-base font-bold text-white mb-2" {...props} />,
                                            h3: ({node, ...props}) => <h3 className="text-sm font-bold text-white mb-1" {...props} />,
                                            a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-white underline decoration-cyan-500/50 hover:text-cyan-300 transition-colors" />,
                                            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />
                                        }}
                                    >
                                        {agent.full_description}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}

                        <LazySection minHeight="100px">
                            <DemoInteraction demo_interaction={agent.demo_interaction} />
                        </LazySection>

                        {!isTerminalOpen && (
                            <div className="flex flex-col md:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={onEnterLounge}
                                    className="flex-1 px-6 py-4 bg-black/60 hover:bg-white/10 border border-white/10 hover:border-white text-white rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-3 group"
                                >
                                    <span className="font-sans text-sm tracking-widest uppercase font-medium">Enter Lounge</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={openLinkModal}
                                    className="flex-1 px-6 py-4 bg-black/60 hover:bg-cyan-950/80 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 rounded-xl backdrop-blur-md transition-all flex items-center justify-center gap-3 group shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]"
                                >
                                    <Zap size={18} className="group-hover:animate-pulse" />
                                    <span className="font-sans text-sm tracking-widest uppercase font-medium">Connect Neural Link</span>
                                </button>
                            </div>
                        )}

                        <ExpertReviewPanel agentId={agent.id} agentSlug={agent.slug} />

                        <IntelFeed agentId={agent.id} agentSlug={agent.slug} initialData={intelFeed} />

                        <LazySection minHeight="200px">
                            <CompetitiveLandscape agent={agent} competitors={relatedAgents} />
                        </LazySection>
                    </div>

                    <div className="order-3 md:order-3 md:col-span-3 flex flex-col gap-4">
                        <TacticalSidebar agent={agent} />

                        <div className="order-3 md:order-3 mt-4">
                            <LazySection minHeight="150px">
                                <MarketValidation agent={agent} />
                            </LazySection>
                        </div>
                    </div>

                    <footer className="order-5 md:order-4 col-span-1 md:col-span-12 mt-4 md:mt-8">
                        <LazySection minHeight="150px">
                            <NeuralLinkage agent={agent} />
                        </LazySection>
                        <LazySection minHeight="200px">
                            <ComplementarySynapses 
                                agents={relatedAgents} 
                                loading={!!isScanning} 
                                agentContext={agent}
                            />
                        </LazySection>
                    </footer>

                    <div className="order-6 md:order-5 col-span-1 md:col-span-12 mt-4 md:mt-8">
                        <LazySection minHeight="150px">
                            <VendorEcosystem vendorSlug={agent.vendor_slug} currentAgentId={agent.id} />
                        </LazySection>
                    </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
