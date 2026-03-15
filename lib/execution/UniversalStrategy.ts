import { ExecutionStrategy, ExecutionMessage, ExecutionConfig } from './ExecutionStrategy';

export class UniversalStrategy implements ExecutionStrategy {
  providerId = 'universal';

  async streamResponse(
    messages: ExecutionMessage[],
    config: ExecutionConfig,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const baseUrl = config.apiBaseUrl || 'https://api.openai.com/v1';
    const modelName = config.modelName || config.model || 'gpt-3.5-turbo';

    const payload = {
      model: modelName,
      messages: config.systemPrompt 
        ? [{ role: 'system', content: config.systemPrompt }, ...messages]
        : messages,
      temperature: config.temperature ?? 0.7,
      stream: true,
    };

    const response = await fetch('/api/v1/proxy/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Provider': 'universal',
        'X-Api-Base-Url': baseUrl
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as any;
      throw new Error(err.error?.message || `Universal Execution Error: ${response.status}`);
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices[0].delta.content) {
              onChunk(data.choices[0].delta.content);
            }
          } catch (e) {
            // Ignore parse errors on partial chunks
          }
        }
      }
    }
  }
}
