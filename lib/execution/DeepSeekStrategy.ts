import { ExecutionStrategy, ExecutionMessage, ExecutionConfig } from './ExecutionStrategy';

export class DeepSeekStrategy implements ExecutionStrategy {
  providerId = 'deepseek';

  async streamResponse(
    messages: ExecutionMessage[],
    config: ExecutionConfig,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const finalMessages = config.systemPrompt
      ? [{ role: 'system', content: config.systemPrompt } as const, ...messages]
      : messages;

    const response = await fetch('/api/v1/proxy/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Provider': this.providerId,
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: finalMessages,
        temperature: config.temperature ?? 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as any;
      throw new Error(err.error?.message || `DeepSeek Execution Error: ${response.status}`);
    }

    if (!response.body) throw new Error("No readable stream available.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) onChunk(content);
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  }
}
