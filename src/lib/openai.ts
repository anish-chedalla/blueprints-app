/**
 * OpenAI API Client Utility
 * 
 * Note: The app primarily uses OpenAI through Supabase Edge Functions for security.
 * This utility is for direct client-side calls if needed (use cautiously - exposes API key).
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Call OpenAI Chat Completion API directly
 * @param messages - Array of chat messages
 * @param options - Optional configuration
 * @returns Promise with the completion response
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<any> {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    max_tokens = 1000,
    stream = false,
  } = options;

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      stream,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Stream OpenAI Chat Completion (for real-time responses)
 * @param messages - Array of chat messages
 * @param onChunk - Callback for each chunk received
 * @param options - Optional configuration
 */
export async function streamChatCompletion(
  messages: ChatMessage[],
  onChunk: (content: string) => void,
  options: ChatCompletionOptions = {}
): Promise<void> {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
  } = options;

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

export default {
  chatCompletion,
  streamChatCompletion,
};
