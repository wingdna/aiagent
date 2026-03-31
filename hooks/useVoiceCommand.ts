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
    const onTranscriptRef = useRef(onTranscript);
    const onStateChangeRef = useRef(onStateChange);

    // Keep refs up to date
    useEffect(() => {
        onTranscriptRef.current = onTranscript;
    }, [onTranscript]);

    useEffect(() => {
        onStateChangeRef.current = onStateChange;
    }, [onStateChange]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;
            recognition.continuous = false;
            recognition.interimResults = true;
            
            // Detect language or default to zh-CN/en-US
            recognition.lang = navigator.language.startsWith('zh') ? 'zh-CN' : 'en-US'; 

            recognition.onstart = () => {
                setIsListening(true);
                setVoiceFeedback("LISTENING...");
                if (onStateChangeRef.current) onStateChangeRef.current(true);
            };

            recognition.onresult = (event: any) => {
                const currentTranscript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result: any) => result.transcript)
                    .join('');
                
                setTranscript(currentTranscript);
                setVoiceFeedback("CAPTURING_STREAM...");
                
                if (onTranscriptRef.current) {
                    onTranscriptRef.current(currentTranscript);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
                setVoiceFeedback(null);
                if (onStateChangeRef.current) onStateChangeRef.current(false);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech Recognition Error:', event.error);
                if (event.error === 'no-speech') {
                    setVoiceFeedback("NO_SIGNAL_DETECTED");
                } else if (event.error === 'not-allowed') {
                    setVoiceFeedback("PERMISSION_DENIED");
                } else {
                    setVoiceFeedback(`ERROR: ${event.error.toUpperCase()}`);
                }
                setTimeout(() => setVoiceFeedback(null), 2000);
                setIsListening(false);
                if (onStateChangeRef.current) onStateChangeRef.current(false);
            };

            return () => {
                recognition.stop();
            };
        } else {
            console.warn('Speech Recognition not supported in this browser');
        }
    }, []);

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
