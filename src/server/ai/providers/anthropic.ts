import type { AiConfig } from '@/lib/ai-config';
import type { ChatTurn } from '../types';

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
}

/** Claude Messages API via fetch, so the app needs no SDK dependency. */
export async function anthropicComplete(
  config: AiConfig,
  system: string,
  turns: ChatTurn[],
): Promise<string> {
  const response = await fetch(`${config.baseUrl ?? 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.apiKey ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: config.model, max_tokens: 400, system, messages: turns }),
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  if (!response.ok) throw new Error(`Anthropic API responded ${response.status}`);
  const data = (await response.json()) as AnthropicResponse;
  const text = (data.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
    .trim();
  if (!text) throw new Error('Anthropic API returned no text');
  return text;
}
