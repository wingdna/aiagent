import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
    audio_sample_url?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audio_sample_url }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    if (!audio_sample_url) return null;

    return (
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm hover:border-cyan-400/50 transition-all cursor-pointer group" onClick={togglePlay}>
            <audio ref={audioRef} src={audio_sample_url} onEnded={() => setIsPlaying(false)} />
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-400 group-hover:text-black transition-colors">
                {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
            </div>
            <span className="text-xs font-mono text-cyan-300 uppercase tracking-wider group-hover:text-white transition-colors">
                {isPlaying ? 'Playing Sample...' : 'Listen to Voice'}
            </span>
            <Volume2 size={14} className="text-gray-500 group-hover:text-cyan-400 transition-colors ml-auto" />
        </div>
    );
};
