import React, { useState, useRef, useEffect } from 'react';
import { X, Brain, Terminal, Cpu, Maximize2, Minimize2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { extractYoutubeId } from '../../utils/videoUtils';
import { VideoContainer } from '../shared/VideoContainer';

// --- TYPES ---
interface NeuralProps {
    thinking?: string;
    content?: string;
    isThinking?: boolean;
    onClose?: () => void;
}

interface MediaProps {
    mode?: 'video' | 'image' | 'interactive';
    video?: string;
    gif?: string;
    image?: string;
    title?: string;
    gallery?: string[];
    audioSample?: string;
    demoInteraction?: any;
    expansion?: 'normal' | 'enlarged' | 'ultra' | 'full';
    setExpansion?: (state: 'normal' | 'enlarged' | 'ultra' | 'full') => void;
    className?: string;
}

export type HoloProjectorProps = NeuralProps & MediaProps;

export const HoloProjector: React.FC<HoloProjectorProps> = (props) => {
    // DETECT MODE
    const isNeuralMode = !!(props.thinking || props.content || props.isThinking);

    if (isNeuralMode) {
        return <NeuralInterface {...props} />;
    }

    return <MediaInterface {...props} />;
};

// --- NEURAL INTERFACE (For Chat/Reasoning) ---
const NeuralInterface: React.FC<NeuralProps> = ({ thinking, content, isThinking, onClose }) => {
    return (
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row min-h-[400px] pointer-events-auto">
            
            {/* LEFT: THINKING PROCESS (DeepSeek Style) */}
            {(thinking || isThinking) && (
                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 bg-black/40 p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4 text-xs font-mono text-gray-500 uppercase tracking-widest">
                        <Brain size={14} className="text-purple-500 animate-pulse" />
                        NEURAL_REASONING_CHAIN
                    </div>
                    <div className="flex-1 overflow-y-auto font-mono text-xs text-gray-400 space-y-2 pr-2 max-h-[300px] md:max-h-none">
                        {thinking ? (
                            <div className="whitespace-pre-wrap leading-relaxed opacity-80">
                                {thinking}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <div className="h-2 w-3/4 bg-white/5 rounded animate-pulse" />
                                <div className="h-2 w-1/2 bg-white/5 rounded animate-pulse delay-75" />
                                <div className="h-2 w-2/3 bg-white/5 rounded animate-pulse delay-150" />
                            </div>
                        )}
                        {isThinking && (
                            <div className="flex items-center gap-1 mt-2 text-purple-500/50">
                                <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" />
                                <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce delay-100" />
                                <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce delay-200" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* RIGHT: TACTICAL OUTPUT */}
            <div className="flex-1 p-6 flex flex-col bg-gradient-to-br from-black/60 to-cyan-950/10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest">
                        <Terminal size={14} />
                        TACTICAL_RESPONSE_UNIT
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto prose prose-invert prose-sm max-w-none">
                    {content ? (
                        <ReactMarkdown>{content}</ReactMarkdown>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4">
                            <Cpu size={32} className="animate-spin duration-[3000ms]" />
                            <span className="font-mono text-xs tracking-widest">INITIALIZING_NEURAL_LINK...</span>
                        </div>
                    )}
                </div>
                
                {/* Footer Status */}
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-gray-600">
                    <span>MODEL: QWEN_TACTICAL_V3</span>
                    <span>LATENCY: 42ms</span>
                </div>
            </div>
        </div>
    );
};

// --- MEDIA INTERFACE (Reconstructed for HoloFrame) ---
const MediaInterface: React.FC<MediaProps> = ({ 
    video, image, title, expansion, setExpansion, className 
}) => {
    const videoId = extractYoutubeId(video);
    const isYouTube = !!videoId;
    const [hasError, setHasError] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleFullscreen = () => {
        if (containerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                containerRef.current.requestFullscreen();
            }
        }
    };

    // [SURGICAL_UI_PURGE] Video Placeholder Beautification
    if (hasError) {
        return (
            <div className={`relative overflow-hidden group ${className} bg-black border border-cyan-500/30 flex items-center justify-center`}>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/20 to-transparent" />
                
                {/* Scanline */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(6,182,212,0.1)_50%)] bg-[size:100%_4px] pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[scan_3s_linear_infinite]" />

                <div className="flex flex-col items-center gap-3 relative z-10">
                    <div className="w-16 h-16 border-2 border-cyan-500/50 rounded-full flex items-center justify-center relative">
                        <div className="absolute inset-0 border border-cyan-400/30 rounded-full animate-ping opacity-20" />
                        <Terminal size={24} className="text-cyan-400" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-cyan-400 font-display font-bold tracking-widest text-sm mb-1">SYSTEM_READY</h3>
                        <span className="text-[10px] font-mono text-cyan-600/70 uppercase">AWAITING_VISUAL_INPUT</span>
                    </div>
                </div>
            </div>
        );
    }

    const isExpanded = expansion === 'enlarged' || expansion === 'full';

    return (
        <div ref={containerRef} className={`relative overflow-hidden group ${className}`}>
            {/* MEDIA LAYER */}
            {video ? (
                <ErrorBoundary fallback={<div className="w-full h-full bg-black flex items-center justify-center text-red-500 font-mono text-xs">VIDEO_SIGNAL_LOST</div>}>
                    <VideoContainer
                        url={isYouTube ? `https://www.youtube.com/watch?v=${videoId}` : video}
                        title={title}
                        expansion={expansion}
                        setExpansion={setExpansion}
                        onFullscreen={toggleFullscreen}
                        className="w-full h-full absolute inset-0"
                    />
                </ErrorBoundary>
            ) : (
                <img 
                    src={image} 
                    alt={title} 
                    onError={() => setHasError(true)}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                />
            )}

            {/* OVERLAY UI (Only for non-YouTube content and non-video) */}
            {!isYouTube && !video && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                    
                    {/* CONTROLS */}
                    <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFullscreen();
                            }}
                            className="p-2 bg-black/40 hover:bg-white/10 text-white/70 hover:text-white rounded-lg backdrop-blur-sm transition-all"
                        >
                            <Maximize2 size={16} />
                        </button>
                        {setExpansion && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpansion(isExpanded ? 'normal' : 'enlarged');
                                }}
                                className="p-2 bg-black/40 hover:bg-white/10 text-white/70 hover:text-white rounded-lg backdrop-blur-sm transition-all"
                            >
                                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                        )}
                    </div>

                    {/* TITLE LABEL */}
                    {title && (
                        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
                            <h3 className="text-white font-display font-bold text-lg tracking-wide drop-shadow-lg truncate">
                                {title}
                            </h3>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
