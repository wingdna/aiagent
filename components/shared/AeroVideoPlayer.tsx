
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Maximize, Minimize, AlertCircle, Volume2, VolumeX, Monitor } from 'lucide-react';

interface AeroVideoPlayerProps {
  url: string;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const isExpanded = expansion === 'enlarged' || expansion === 'full';
  const isMobile = isMobileDevice();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Desktop Autoplay via Intersection Observer
  useEffect(() => {
    if (isMobile || !isMounted) return;

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
  }, [isMobile, isMounted, hasInteracted]);

  const handleInteraction = () => {
    setHasInteracted(true);
    setIsPlaying(true);
    if (isMobile) {
       setIsMuted(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const command = isMuted ? 'unMute' : 'mute';
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: [] }), '*');
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const command = isPlaying ? 'pauseVideo' : 'playVideo';
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: [] }), '*');
      setIsPlaying(!isPlaying);
    }
  };

  if (!isMounted) {
    return <div className={`aspect-video rounded-xl bg-[#050505] animate-pulse ${className}`} />;
  }

  let videoId = '';
  try {
    const secureUrl = url.replace('http:', 'https:');
    const parsedUrl = new URL(secureUrl);
    if (parsedUrl.hostname.includes('youtube.com')) {
      videoId = parsedUrl.searchParams.get('v') || '';
    } else if (parsedUrl.hostname.includes('youtu.be')) {
      videoId = parsedUrl.pathname.slice(1);
    } else {
      videoId = secureUrl.split('v=')[1]?.split('&')[0] || '';
    }
  } catch (e) {
    console.error("Invalid video URL", e);
    videoId = url.split('v=')[1]?.split('&')[0] || '';
  }

  if (!hasInteracted) {
    return (
      <div
        className={`relative aspect-video rounded-xl border border-cyan-400/30 bg-[#050505] flex items-center justify-center cursor-pointer group ${className}`}
        onClick={handleInteraction}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40" 
          style={{ backgroundImage: `url('https://img.youtube.com/vi/${videoId || 'default'}/hqdefault.jpg')` }} 
        />
        <div className="w-16 h-16 rounded-full bg-cyan-400/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
          <Play size={32} className="text-cyan-400 fill-cyan-400" />
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
        ) : (
          <iframe
            ref={iframeRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1&controls=0&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : 'https://youagent.top'}&playsinline=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Agent Video Feed"
            onError={() => setIframeError(true)}
          />
        )}
      </IframeErrorBoundary>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {title && (
        <div className="absolute top-4 left-4 right-32 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <h3 className="text-white font-display font-bold text-lg tracking-wide drop-shadow-lg truncate bg-black/50 px-3 py-1 rounded-md backdrop-blur-sm inline-block">
            {title}
          </h3>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         {!isPlaying && (
            <div className="w-16 h-16 rounded-full bg-cyan-400/20 backdrop-blur-md flex items-center justify-center">
              <Play size={32} className="text-cyan-400 fill-cyan-400 ml-1" />
            </div>
         )}
      </div>

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
    </div>
  );
};