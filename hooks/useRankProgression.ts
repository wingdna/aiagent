/**
 * hooks/useRankProgression.ts
 * Tracks XP level-ups, triggers ascension overlay + TTS announcement.
 * Extracted from App.tsx to isolate gamification side-effects.
 */
import { useEffect, useRef, useState } from 'react';
import { getRankInfo } from '../services/rankService';
import { Telemetry } from '../services/telemetry';

interface UseRankProgressionOptions {
    xp: number;
    profileLoading: boolean;
    audioUnlocked: boolean;
    volume: number;
}

export function useRankProgression({ xp, profileLoading, audioUnlocked, volume }: UseRankProgressionOptions) {
    const [showAscension, setShowAscension] = useState(false);
    const prevRankLevel = useRef(1);

    useEffect(() => {
        const rank = getRankInfo(xp);
        if (rank.level > prevRankLevel.current && !profileLoading) {
            setShowAscension(true);
            Telemetry.track('user_ascended', { newLevel: rank.level, title: rank.title });

            if (audioUnlocked) {
                fetch('https://directorai.vercel.app/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `NEURAL EVOLUTION COMPLETE. ACCESS LEVEL ${rank.title} GRANTED.`,
                        voice: 'en-US-EricNeural',
                    }),
                })
                    .then(r => r.blob())
                    .then(blob => {
                        const audio = new Audio(URL.createObjectURL(blob));
                        audio.volume = volume;
                        audio.play().catch(() => { });
                    })
                    .catch(e => console.error('TTS Fail', e));
            }
        }
        prevRankLevel.current = rank.level;
    }, [xp, profileLoading, audioUnlocked]);

    return { showAscension, setShowAscension };
}
