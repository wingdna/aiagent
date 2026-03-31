/**
 * components/shared/LoadingScreens.tsx
 * Lightweight loading/transit UI components extracted from App.tsx.
 * No external state or hooks — pure presentational.
 */
import React from 'react';

export const LoadingScreen: React.FC = () => (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-4" aria-hidden="true">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 animate-pulse" />
        <div className="flex flex-col items-center gap-6 relative z-10">
            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <span className="text-cyan-500 font-sans font-bold tracking-[0.2em] animate-pulse uppercase">
                Initializing System
            </span>
        </div>
    </div>
);

export const TransitLayer: React.FC = () => (
    <div className="fixed inset-0 z-[999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl md:text-8xl font-sans font-black text-white mix-blend-overlay tracking-tighter opacity-80">
                LOADING
            </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]" />
    </div>
);

/** No-op placeholder — keeps AnimatePresence happy without DOM cost */
export const GlitchTransition: React.FC = () => null;
