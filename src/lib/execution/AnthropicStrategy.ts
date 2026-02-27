import { ExecutionStrategy, ExecutionMessage, ExecutionConfig } from './ExecutionStrategy';

export class AnthropicStrategy implements ExecutionStrategy {
  providerId = 'anthropic';

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
        max_tokens: 1024,
        stream: true
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as any;
      throw new Error(err.error?.message || `Anthropic Execution Error: ${response.status}`);
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
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.type === 'content_block_delta') {
              const content = parsed.delta?.text || '';
              if (content) onChunk(content);
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  }
}
