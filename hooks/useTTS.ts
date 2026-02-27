
import { useState, useEffect, useRef, useCallback } from 'react';
import { Agent, VoiceConfig } from '../types';
import { UIState, useUIStore } from '../src/stores/useUIStore';

export const useTTS = (agent: Agent | null) => {
    const audioUnlocked = useUIStore((s: UIState) => s.audioUnlocked);
    const volume = useUIStore((s: UIState) => s.volume);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const volumeRef = useRef<number>(volume);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Map configuration to specific neural voices
    const getVoiceId = (config?: VoiceConfig) => {
        const style = config?.style || 'neutral';
        switch (style) {
            case 'calm': return 'en-US-ChristopherNeural';
            case 'energetic': return 'en-US-EricNeural';
            default: return 'en-US-JennyNeural';
        }
    };

    // Force stop audio (cleanup)
    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        setIsSpeaking(false);
    }, []);

    // Play function (Enforces Singleton Pattern)
    const play = useCallback(async (text: string, voiceId: string) => {
        // 1. Kill any existing audio instance immediately
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        
        if (!audioUnlocked) return;

        try {
            // Using DirectorAI TTS Endpoint (Simulated for this environment)
            const response = await fetch('https://directorai.vercel.app/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice: voiceId })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                
                audio.volume = volumeRef.current; // Apply initial volume
                
                audio.onended = () => setIsSpeaking(false);
                audio.onpause = () => setIsSpeaking(false);
                audio.onplay = () => setIsSpeaking(true);
                
                audioRef.current = audio;
                await audio.play();
            }
        } catch (e) {
            console.error("[TTS] Playback Error:", e);
            setIsSpeaking(false);
        }
    }, [audioUnlocked]);

    // React to Volume Change dynamically
    useEffect(() => {
        volumeRef.current = volume;
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // React to Agent Change
    useEffect(() => {
        if (!agent || !audioUnlocked) {
            stop();
            return;
        }

        // Debounce audio to prevent chaos during rapid scrolling
        const timer = setTimeout(() => {
            const voiceId = getVoiceId(agent.voice_config);
            play(agent.slogan, voiceId);
        }, 600); // 600ms delay allows user to scroll past agents without triggering audio

        return () => {
            clearTimeout(timer);
            stop();
        };
    }, [agent?.id, audioUnlocked, play, stop]);

    return { isSpeaking, stop };
};
