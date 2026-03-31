
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Maximize, Minimize, AlertCircle, Volume2, VolumeX, Monitor } from 'lucide-react';

interface AeroVideoPlayerProps {
  url: string;
  coverUrl?: string;
  className?: string;
  title?: string;
  expansion?: 'normal' | 'enlarged' | 'ultra' | 'full';
  setExpansion?: (state: 'normal' | 'enlarged' | 'ultra' | 'full') => void;
  onFullscreen?: () => void;
}

const isMobileDevice = () => {
  return (
    typeof navigator !== 'undefined' &&
    (navigator.maxTouchPoints > 0 || /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent))
  );
};

class IframeErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] text-red-500 border border-red-500/30 rounded-xl">
          <AlertCircle size={48} className="mb-4 opacity-80" />
          <h3 className="text-lg font-bold tracking-widest uppercase">Neural Link Offline</h3>
          <p className="text-sm opacity-70 mt-2">Video feed connection failed.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AeroVideoPlayer: React.FC<AeroVideoPlayerProps> = ({
  url,
  coverUrl,
  className = '',
  title,
  expansion,
  setExpansion,
  onFullscreen
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [globalInteraction, setGlobalInteraction] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const isExpanded = expansion === 'enlarged' || expansion === 'full';
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsMounted(true);
    setIsMobile(isMobileDevice());

    // Track global interaction to prevent Lighthouse from triggering heavy iframe loads
    const onInteract = () => setGlobalInteraction(true);
    window.addEventListener('scroll', onInteract, { once: true, passive: true });
    window.addEventListener('mousemove', onInteract, { once: true, passive: true });
    window.addEventListener('touchstart', onInteract, { once: true, passive: true });
    window.addEventListener('keydown', onInteract, { once: true, passive: true });
    
    return () => {
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('mousemove', onInteract);
      window.removeEventListener('touchstart', onInteract);
      window.removeEventListener('keydown', onInteract);
    };
  }, []);

  // Desktop Autoplay via Intersection Observer
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info && data.info.playerState !== undefined) {
          const state = data.info.playerState;
          if (state === 1) setIsPlaying(true);
          else if (state === 2 || state === 0) setIsPlaying(false);
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    // Only auto-play on desktop AFTER the user has interacted with the page globally
    if (isMobile || !isMounted || !globalInteraction) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.8) {
            if (!hasInteracted) {
               setHasInteracted(true);
            }
            if (iframeRef.current && iframeRef.current.contentWindow) {
               iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
               setIsPlaying(true);
            }
          } else if (entry.intersectionRatio < 0.5) {
            if (iframeRef.current && iframeRef.current.contentWindow) {
               iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
               setIsPlaying(false);
            }
          }
        });
      },
      { threshold: [0.1, 0.5, 0.8, 1.0] }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isMobile, isMounted, hasInteracted, globalInteraction]);

  let videoId = '';
  let isYouTube = false;
  try {
    const secureUrl = url.replace('http:', 'https:');
    const parsedUrl = new URL(secureUrl);
    if (parsedUrl.hostname.includes('youtube.com')) {
      videoId = parsedUrl.searchParams.get('v') || '';
      isYouTube = true;
    } else if (parsedUrl.hostname.includes('youtu.be')) {
      videoId = parsedUrl.pathname.slice(1);
      isYouTube = true;
    } else {
      videoId = secureUrl.split('v=')[1]?.split('&')[0] || '';
      if (videoId) isYouTube = true;
    }
  } catch (e) {
    console.error("Invalid video URL", e);
    videoId = url.split('v=')[1]?.split('&')[0] || '';
    if (videoId) isYouTube = true;
  }

  useEffect(() => {
    if (!isYouTube && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => console.error("Play failed:", e));
      } else {
        videoRef.current.pause();
      }
      videoRef.current.muted = isMuted;
    }
  }, [isPlaying, isMuted, isYouTube]);

  const handleInteraction = () => {
    setHasInteracted(true);
    setIsPlaying(true);
    if (isMobile) {
       setIsMuted(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isYouTube && iframeRef.current && iframeRef.current.contentWindow) {
      const command = isMuted ? 'unMute' : 'mute';
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: [] }), '*');
    }
    setIsMuted(!isMuted);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isYouTube && iframeRef.current && iframeRef.current.contentWindow) {
      const command = isPlaying ? 'pauseVideo' : 'playVideo';
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: [] }), '*');
    }
    setIsPlaying(!isPlaying);
  };

  if (!hasInteracted) {
    return (
      <div
        className={`relative aspect-video rounded-xl border border-cyan-400/30 bg-[#050505] flex items-center justify-center cursor-pointer group overflow-hidden ${className}`}
        onClick={handleInteraction}
      >
        {isYouTube && (
          <>
            <link rel="preconnect" href="https://www.youtube.com" />
            <link rel="preconnect" href="https://i.ytimg.com" />
          </>
        )}
        {coverUrl ? (
          <img 
            src={coverUrl}
            alt={title || "Video cover"}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-300 group-hover:opacity-60" 
          />
        ) : isYouTube ? (
          <img 
            src={`https://i.ytimg.com/vi_webp/${videoId || 'default'}/hqdefault.webp`}
            alt={title || "Video cover"}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-300 group-hover:opacity-60" 
          />
        ) : (
          <video
            src={`${url}#t=0.1`}
            className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-300 group-hover:opacity-60"
            muted
            playsInline
            preload="metadata"
          />
        )}
        <div className="w-16 h-16 rounded-full bg-cyan-400/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform z-10">
          <Play size={32} className="text-cyan-400 fill-cyan-400 ml-1" />
        </div>
        {title && (
          <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
            <h3 className="text-white font-display font-bold text-lg tracking-wide drop-shadow-lg truncate">
              {title}
            </h3>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative aspect-video rounded-xl border border-cyan-400/30 bg-[#050505] backdrop-blur-xl overflow-hidden group ${className} cursor-pointer`}
      onClick={togglePlay}
    >
      <IframeErrorBoundary>
        {iframeError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] text-red-500 border border-red-500/30 rounded-xl">
            <AlertCircle size={48} className="mb-4 opacity-80" />
            <h3 className="text-lg font-bold tracking-widest uppercase">Neural Link Offline</h3>
            <p className="text-sm opacity-70 mt-2">Video feed connection failed.</p>
          </div>
        ) : isYouTube ? (
          <iframe
            ref={iframeRef}
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1&controls=${isMobile ? 1 : 0}&enablejsapi=1&fs=0&origin=${typeof window !== 'undefined' ? window.location.origin : 'https://youagent.top'}&widget_referrer=${typeof window !== 'undefined' ? window.location.href : 'https://youagent.top'}&playsinline=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Agent Video Feed"
            loading="lazy"
            onError={() => setIframeError(true)}
          />
        ) : (
          <video
            ref={videoRef}
            src={url}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted={isMuted}
            loop
            playsInline
            onError={() => setIframeError(true)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}
      </IframeErrorBoundary>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {title && !isMobile && (
        <div className="absolute top-4 left-4 right-32 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <h3 className="text-white font-display font-bold text-lg tracking-wide drop-shadow-lg truncate bg-black/50 px-3 py-1 rounded-md backdrop-blur-sm inline-block">
            {title}
          </h3>
        </div>
      )}

      {!isMobile && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           {!isPlaying && (
              <div className="w-16 h-16 rounded-full bg-cyan-400/20 backdrop-blur-md flex items-center justify-center">
                <Play size={32} className="text-cyan-400 fill-cyan-400 ml-1" />
              </div>
           )}
        </div>
      )}

      {!isMobile && (
        <div className="absolute top-4 right-4 flex items-center gap-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-cyan-400 border border-white/10 hover:border-cyan-400/50 transition-all duration-300 pointer-events-auto"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {setExpansion && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setExpansion(isExpanded ? 'normal' : 'enlarged');
              }}
              title="Expand Width"
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-cyan-400 border border-white/10 hover:border-cyan-400/50 transition-all duration-300 pointer-events-auto"
            >
              <Monitor size={18} />
            </button>
          )}
          {onFullscreen && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onFullscreen();
              }}
              title="Fullscreen"
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-cyan-400 border border-white/10 hover:border-cyan-400/50 transition-all duration-300 pointer-events-auto"
            >
              <Maximize size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};