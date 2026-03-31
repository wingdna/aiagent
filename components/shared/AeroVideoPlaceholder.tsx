import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, X } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';

interface AeroVideoPlaceholderProps {
  videoId: string;
  title?: string;
  posterUrl?: string;
}

const isMobileDevice = () => {
  return (
    typeof navigator !== 'undefined' &&
    (navigator.maxTouchPoints > 0 || /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent))
  );
};

export const AeroVideoPlaceholder: React.FC<AeroVideoPlaceholderProps> = ({ videoId, title = 'Video', posterUrl }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const thumbnailUrl = posterUrl || `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp`;

  return (
    <>
      {/* Zero-Cost Placeholder */}
      <div 
        className="relative w-full aspect-video bg-[#050505] border border-cyan-400/30 rounded-xl overflow-hidden cursor-pointer group backdrop-blur-xl"
        onClick={() => setIsModalOpen(true)}
      >
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)] group-hover:scale-110 group-hover:bg-cyan-500/30 transition-all duration-300">
            <Play className="text-cyan-400 fill-cyan-400 ml-1" size={32} />
          </div>
        </div>
        
        {/* Holographic Scanline Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(6,182,212,0.1)_50%)] bg-[size:100%_4px] pointer-events-none" />
      </div>

      {/* Holographic Modal */}
      <AnimatePresence>
        {isModalOpen && createPortal(
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
            onClick={() => setIsModalOpen(false)}
          >
            <div 
              className="relative w-full max-w-5xl aspect-video bg-[#050505] border border-cyan-400/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.2)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-cyan-400 hover:text-cyan-300 rounded-full backdrop-blur transition-colors z-50 border border-cyan-500/30 hover:bg-cyan-900/50"
              >
                <X size={20} />
              </button>
              
              {/* IFrame loaded only when modal is open */}
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=${isMobile ? 0 : 1}&modestbranding=1&rel=0&fs=0&playsinline=1${!isMobile ? '&mute=1' : ''}&origin=${typeof window !== 'undefined' ? window.location.origin : 'https://youagent.top'}&widget_referrer=${typeof window !== 'undefined' ? window.location.href : 'https://youagent.top'}`}
                title={title}
                frameBorder="0"
                referrerPolicy="no-referrer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </m.div>,
          document.body
        )}
      </AnimatePresence>
    </>
  );
};
