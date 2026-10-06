import type { AiConfig } from '@/lib/ai-config';
import type { ChatTurn } from '../types';

interface OllamaChatResponse {
  message?: { content?: string };
}

/** Removes reasoning blocks some local models emit, so the robot never reads them aloud. */
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Native Ollama chat API. Unlike the OpenAI-compatible endpoint it accepts `keep_alive`,
 * which keeps the model warm between visitors on a small home server.
 */
export async function ollamaComplete(
  config: AiConfig,
  system: string,
  turns: ChatTurn[],
): Promise<string> {
  const response = await fetch(`${config.baseUrl ?? 'http://127.0.0.1:11434'}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      stream: false,
      keep_alive: config.keepAlive,
      options: { temperature: 0.4, num_predict: 300 },
      messages: [{ role: 'system', content: system }, ...turns],
    }),
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  if (!response.ok) throw new Error(`Ollama responded ${response.status}`);
  const data = (await response.json()) as OllamaChatResponse;
  const text = stripThinking(data.message?.content ?? '');
  if (!text) throw new Error('Ollama returned no text');
  return text;
}
