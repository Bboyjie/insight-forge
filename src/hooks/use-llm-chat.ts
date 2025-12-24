import { useState, useCallback } from 'react';
import { getLLMSettings } from '@/lib/storage';
import { supabase } from '@/integrations/supabase/client';

interface UseLLMChatOptions {
  systemPrompt?: string;
  onDelta?: (delta: string) => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function useLLMChat(options: UseLLMChatOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    messages: Message[],
    onDelta?: (delta: string) => void
  ): Promise<string> => {
    const settings = getLLMSettings();
    
    if (!settings?.baseUrl || !settings?.apiKey || !settings?.modelName) {
      throw new Error('请先在设置页面配置 LLM API');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke('chat', {
        body: {
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          baseUrl: settings.baseUrl,
          apiKey: settings.apiKey,
          modelName: settings.modelName,
          systemPrompt: options.systemPrompt,
          stream: true,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Handle streaming response
      const reader = response.data.getReader?.();
      
      if (!reader) {
        // Non-streaming fallback
        const data = response.data;
        if (data.error) {
          throw new Error(data.error);
        }
        const content = data.choices?.[0]?.message?.content || '';
        return content;
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                onDelta?.(delta);
                options.onDelta?.(delta);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      return fullContent;
    } catch (err) {
      const message = err instanceof Error ? err.message : '请求失败';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const isConfigured = useCallback(() => {
    const settings = getLLMSettings();
    return !!(settings?.baseUrl && settings?.apiKey && settings?.modelName);
  }, []);

  return {
    sendMessage,
    isLoading,
    error,
    isConfigured,
  };
}
