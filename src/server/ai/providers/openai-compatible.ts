import type { AiConfig } from '@/lib/ai-config';
import type { ChatTurn } from '../types';

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

/** Any OpenAI-compatible Chat Completions endpoint: OpenAI, OpenRouter, Groq, Ollama, vLLM. */
export async function openAiCompatibleComplete(
  config: AiConfig,
  system: string,
  turns: ChatTurn[],
): Promise<string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (config.apiKey) headers.authorization = `Bearer ${config.apiKey}`;

  const response = await fetch(
    `${config.baseUrl ?? 'https://api.openai.com/v1'}/chat/completions`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        temperature: 0.4,
        max_tokens: 400,
        messages: [{ role: 'system', content: system }, ...turns],
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    },
  );
  if (!response.ok) throw new Error(`Chat Completions API responded ${response.status}`);
  const data = (await response.json()) as ChatCompletionResponse;
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Chat Completions API returned no text');
  return text;
}
