import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Image, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { optimizeImage } from '../../utils';

interface MediaGalleryProps {
    media_gallery?: string[];
    gif_url?: string;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ media_gallery, gif_url }) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const hasMedia = (media_gallery && media_gallery.length > 0) || gif_url;

    if (!hasMedia) return null;

    const allMedia = [
        ...(gif_url ? [{ url: gif_url, type: 'gif' }] : []),
        ...(media_gallery ? media_gallery.map(url => ({ url, type: 'image' })) : [])
    ];

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % allMedia.length);
    };

    return (
        <div className="bg-black/20 border border-white/5 rounded-xl p-4 backdrop-blur-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-cyan-400 border-b border-white/5 pb-2">
                <Image size={18} />
                <h3 className="font-mono text-sm uppercase tracking-widest font-bold">Visual Intelligence</h3>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                {allMedia.map((item, idx) => (
                    <div 
                        key={idx} 
                        className="flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-cyan-400/50 transition-all snap-center relative group aspect-video"
                        onClick={() => { setCurrentIndex(idx); setLightboxOpen(true); }}
                    >
                        <img 
                            src={optimizeImage(item.url, 400)} 
                            alt={`Gallery ${idx}`} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-xs font-mono uppercase tracking-widest">Expand</span>
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {lightboxOpen && (
                    <m.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <button 
                            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                            onClick={() => setLightboxOpen(false)}
                        >
                            <X size={32} />
                        </button>

                        <div className="relative w-full max-w-5xl aspect-video flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            <button 
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-cyan-500/20 text-white/50 hover:text-cyan-400 transition-all"
                                onClick={handlePrev}
                            >
                                <ChevronLeft size={32} />
                            </button>

                            <m.img 
                                key={currentIndex}
                                src={allMedia[currentIndex].url}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10"
                            />

                            <button 
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-cyan-500/20 text-white/50 hover:text-cyan-400 transition-all"
                                onClick={handleNext}
                            >
                                <ChevronRight size={32} />
                            </button>
                            
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-xs font-mono text-white/70">
                                {currentIndex + 1} / {allMedia.length}
                            </div>
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
};
