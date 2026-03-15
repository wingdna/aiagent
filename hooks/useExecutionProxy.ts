import { useState, useCallback, useEffect } from 'react';
import { ExecutionMessage, ExecutionStrategy, ExecutionConfig } from '../lib/execution/ExecutionStrategy';
import { cryptoService } from '../services/cryptoService';

export function useExecutionProxy(strategy: ExecutionStrategy, initialConfig: Omit<ExecutionConfig, 'apiKey'>) {
  const [messages, setMessages] = useState<ExecutionMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // apiKey is now stored as ciphertext in memory
  const [encryptedKey, setEncryptedKey] = useState<string>('');

  // We no longer load API key from session storage to prevent XSS vulnerabilities
  // The key must be entered per session and stays in encrypted memory
  useEffect(() => {
    // Initialize crypto service
    cryptoService.init().catch(console.error);
  }, []);

  const connect = useCallback(async (key: string, _providerId?: string) => {
    try {
      const ciphertext = await cryptoService.encrypt(key);
      setEncryptedKey(ciphertext);
    } catch (err) {
      console.error("Failed to encrypt API key", err);
      setError("Failed to secure API key in memory");
    }
  }, []);

  const executePrompt = useCallback(async (
    prompt: string,
    configOverrides: Partial<Omit<ExecutionConfig, 'apiKey'>> = {},
    onExternalChunk?: (chunk: string) => void
  ) => {
    if (!prompt.trim() || !encryptedKey) {
      setError(!encryptedKey ? "Neural Link Offline: API Key Required" : "Empty prompt");
      return;
    }

    setError(null);
    setIsStreaming(true);

    const userMessage: ExecutionMessage = { role: 'user', content: prompt };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    // Placeholder for assistant response
    setMessages((prev: ExecutionMessage[]) => [...prev, { role: 'assistant', content: '' }]);

    try {
      // 1. Decrypt API key in memory
      const rawKey = await cryptoService.decrypt(encryptedKey);

      // 2. Request Ephemeral JWT from Edge Node
      const tokenResponse = await fetch('/api/v1/proxy/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: rawKey, provider: strategy.providerId })
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to acquire Ephemeral Token from Edge Mesh");
      }

      const { token } = await tokenResponse.json() as any;

      // 3. Execute prompt using the Ephemeral JWT instead of the raw key
      await strategy.streamResponse(
        updatedMessages,
        { ...initialConfig, ...configOverrides, apiKey: token },
        (chunk) => {
          if (onExternalChunk) onExternalChunk(chunk);
          setMessages((prev: ExecutionMessage[]) => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              content: newMessages[lastIndex].content + chunk
            };
            return newMessages;
          });
        }
      );
    } catch (err: any) {
      setError(err.message || "Execution failed");
      // Remove the empty assistant message if it failed immediately
      setMessages((prev: ExecutionMessage[]) => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1].content === '') {
          newMessages.pop();
        }
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [messages, encryptedKey, strategy, initialConfig]);

  return {
    messages,
    input,
    setInput,
    isStreaming,
    error,
    apiKey: encryptedKey ? '***ENCRYPTED***' : '', // Masked for UI
    connect,
    executePrompt,
    clearHistory: () => setMessages([])
  };
}
