export interface ExecutionConfig {
  apiKey: string;
  model: string; // Keep for backwards compatibility, but prefer modelName
  modelName?: string;
  apiBaseUrl?: string;
  temperature?: number;
  systemPrompt?: string;
}

export interface ExecutionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ExecutionStrategy {
  providerId: string;
  streamResponse(
    messages: ExecutionMessage[],
    config: ExecutionConfig,
    onChunk: (chunk: string) => void
  ): Promise<void>;
}
