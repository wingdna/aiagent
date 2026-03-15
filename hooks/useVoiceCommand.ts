import { useState, useEffect, useRef, useCallback } from 'react';

export interface VoiceCommandHook {
    isListening: boolean;
    voiceFeedback: string | null;
    toggleVoiceInput: (e: React.MouseEvent) => void;
    transcript: string;
    resetTranscript: () => void;
}

export const useVoiceCommand = (
    onTranscript?: (text: string) => void,
    onStateChange?: (isListening: boolean) => void
): VoiceCommandHook => {
    const [isListening, setIsListening] = useState(false);
    const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'zh-CN'; 

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setVoiceFeedback("LISTENING...");
                if (onStateChange) onStateChange(true);
            };

            recognitionRef.current.onresult = (event: any) => {
                const currentTranscript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result: any) => result.transcript)
                    .join('');
                
                setTranscript(currentTranscript);
                setVoiceFeedback("CAPTURING_STREAM...");
                
                if (onTranscript) {
                    onTranscript(currentTranscript);
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                setVoiceFeedback(null);
                if (onStateChange) onStateChange(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                if (event.error === 'no-speech') {
                    setVoiceFeedback("NO_SIGNAL_DETECTED");
                    setTimeout(() => setVoiceFeedback(null), 2000);
                }
                setIsListening(false);
                if (onStateChange) onStateChange(false);
            };
        }
    }, [onTranscript, onStateChange]);

    const toggleVoiceInput = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!recognitionRef.current) return;
        
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                setTranscript('');
                recognitionRef.current.start();
            } catch (err) {
                recognitionRef.current.stop();
            }
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        isListening,
        voiceFeedback,
        toggleVoiceInput,
        transcript,
        resetTranscript
    };
};
