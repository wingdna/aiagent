import React, { useRef, useEffect, useState } from 'react';
import { AgentRegistryEntity } from '../../app/types/registry';
import { extractYoutubeId } from '../../utils/videoUtils';
import { optimizeImage } from '../../utils';

interface AgentMediaProps {
    agent: AgentRegistryEntity;
    priority?: boolean;
    hasVideo: boolean;
    isYouTube: boolean;
    isHovered: boolean;
    isYouTubeLoaded: boolean;
    setIsYouTubeLoaded: (loaded: boolean) => void;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    setVideoError: (error: boolean) => void;
    videoRef: React.RefObject<HTMLVideoElement>;
}

export const AgentMedia: React.FC<AgentMediaProps> = ({
    agent, priority, hasVideo, isYouTube, isHovered, isYouTubeLoaded, setIsYouTubeLoaded, isPlaying, setIsPlaying, setVideoError, videoRef
}) => {
    const videoUrl = agent.assets?.video_url || (agent as any).video_url;
    const coverUrl = agent.assets?.cover_url || (agent as any).cover_url;
    const videoPoster = agent.assets?.video_poster || (agent as any).video_poster;

    const videoId = extractYoutubeId(videoUrl);
    const getResizedUrl = (url: string, width: number = 600) => {
        if (!url) return '';
        if (url.includes('i.ytimg.com') || url.includes('img.youtube.com')) return url;
        return `/api/v1/img-proxy?url=${encodeURIComponent(url)}&w=${width}&q=80`;
    };
    const initialYoutubeThumb = videoId ? `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp` : null;

    const defaultCover = (coverUrl || videoPoster || initialYoutubeThumb || "").trim();

    const [imgSrc, setImgSrc] = useState<string | null>(defaultCover || null);
    
    useEffect(() => {
        setImgSrc(defaultCover || null);
    }, [defaultCover]);

    const finalSafeCoverUrl = imgSrc ? getResizedUrl(imgSrc) : null;

    // Handle video play/pause based on hover state
    useEffect(() => {
        if (videoRef.current && hasVideo && !isYouTube) {
            if (isHovered) {
                videoRef.current.play().catch(e => {
                    console.warn("Play blocked:", e);
                    setVideoError(true);
                });
            } else {
                videoRef.current.pause();
                // Reset to first frame when not hovered
                if (videoRef.current.currentTime > 0) {
                    videoRef.current.currentTime = 0.1;
                }
            }
        }
    }, [isHovered, hasVideo, isYouTube, setVideoError, videoRef]);

    return (
        <div className="relative w-full aspect-video overflow-hidden cursor-pointer bg-[#050505]">
            {hasVideo && !isYouTube && (
                <video 
                    ref={videoRef} 
                    src={`${videoUrl}#t=0.1`} 
                    muted={true}
                    loop 
                    playsInline 
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-cover" 
                    onError={() => setVideoError(true)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />
            )}
            
            {hasVideo && isYouTube && isHovered && (
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&origin=${typeof window !== 'undefined' ? window.location.origin : 'https://youagent.top'}`}
                    className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500 ${isYouTubeLoaded ? 'opacity-100' : 'opacity-0'}`}
                    allow="autoplay; encrypted-media"
                    frameBorder="0"
                    onLoad={() => setIsYouTubeLoaded(true)}
                />
            )}

            {finalSafeCoverUrl ? (
                <img 
                    src={finalSafeCoverUrl} 
                    alt={agent.name}
                    referrerPolicy="no-referrer"
                    className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-500 ${(isPlaying || (isYouTube && isYouTubeLoaded)) ? 'opacity-0' : 'opacity-100'}`} 
                    style={{ pointerEvents: 'none' }}
                    loading={priority ? "eager" : "lazy"}
                    decoding="async"
                    {...({ fetchpriority: priority ? "high" : "low" } as any)}
                    onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (videoId && !target.src.includes('ytimg.com') && !target.src.includes('youtube.com')) {
                            target.src = getResizedUrl(`https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp`);
                        } else if (target.src.includes('maxresdefault.webp') && videoId) {
                            target.src = getResizedUrl(`https://i.ytimg.com/vi_webp/${videoId}/hqdefault.webp`);
                        } else if (target.src.includes('hqdefault.webp') && videoId) {
                            target.src = getResizedUrl(`https://i.ytimg.com/vi_webp/${videoId}/mqdefault.webp`);
                        } else {
                            target.style.display = 'none';
                        }
                    }}
                />
            ) : !hasVideo ? (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#0a0a0a] to-[#111] flex flex-col items-center justify-center z-10 p-4 text-center border border-white/5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.1),transparent_70%)] pointer-events-none"></div>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 font-display text-2xl md:text-3xl font-black tracking-tighter leading-tight drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] relative z-20">
                        {agent.name.toUpperCase()}
                    </span>
                </div>
            ) : null}

            {hasVideo && (
                <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}>
                    <div className="w-12 h-12 rounded-full bg-cyan-400/20 flex items-center justify-center border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-cyan-400 ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                </div>
            )}
        </div>
    );
};
