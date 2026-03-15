import { TacticalRouter } from '../lib/intelligence/TacticalRouter';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface StreamCallbacks {
    onToken: (token: string) => void;
    onThinking?: (content: string) => void;
    onComplete: (fullText: string) => void;
    onError: (err: any) => void;
}

export class IntelligenceService {
    private router = TacticalRouter.getInstance();

    async chatStream(
        messages: ChatMessage[], 
        intent: 'CHAT' | 'SEARCH' | 'COMPLEX',
        callbacks: StreamCallbacks
    ) {
        let model = this.router.getModelForIntent(intent);
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: model.id,
                        messages,
                        stream: true
                    })
                });

                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}`);
                }

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let fullText = '';

                if (!reader) throw new Error('No reader available');

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6);
                            if (dataStr === '[DONE]') continue;

                            try {
                                const data = JSON.parse(dataStr);
                                const delta = data.choices[0]?.delta;
                                
                                // Handle DeepSeek Reasoning
                                if (delta?.reasoning_content && callbacks.onThinking) {
                                    callbacks.onThinking(delta.reasoning_content);
                                }

                                // Handle Content
                                if (delta?.content) {
                                    callbacks.onToken(delta.content);
                                    fullText += delta.content;
                                }
                            } catch (e) {
                                // Ignore parse errors for partial chunks
                            }
                        }
                    }
                }

                this.router.reportSuccess(model.id);
                callbacks.onComplete(fullText);
                return;

            } catch (err) {
                console.error(`[IntelligenceService] Error with ${model.id}:`, err);
                this.router.reportFailure(model.id);
                attempts++;
                
                // Switch model for next attempt
                model = this.router.getModelForIntent(intent); 
            }
        }

        callbacks.onError(new Error('All tactical models exhausted.'));
    }
}

export const intelligenceService = new IntelligenceService();
