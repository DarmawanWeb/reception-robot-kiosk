import { z } from 'zod';

export type AiProvider = 'offline' | 'anthropic' | 'openai';

export interface AiConfig {
  provider: AiProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  timeoutMs: number;
}

const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const schema = z.object({
  AI_PROVIDER: z.preprocess(
    emptyToUndefined,
    z.enum(['offline', 'anthropic', 'openai']).default('offline'),
  ),
  AI_MODEL: z.preprocess(emptyToUndefined, z.string().optional()),
  AI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  AI_BASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  AI_TIMEOUT_MS: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(15_000)),
});

/** Reads the assistant configuration from server env. Misconfiguration degrades to offline. */
export function readAiConfig(env: Record<string, string | undefined> = process.env): AiConfig {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    console.warn(
      '[assistant] invalid AI_* environment, using offline answers',
      parsed.error.issues,
    );
    return { provider: 'offline', timeoutMs: 15_000 };
  }
  const { AI_PROVIDER, AI_MODEL, AI_API_KEY, AI_BASE_URL, AI_TIMEOUT_MS } = parsed.data;

  if (AI_PROVIDER === 'anthropic' && !AI_API_KEY) {
    console.warn('[assistant] AI_PROVIDER=anthropic needs AI_API_KEY, using offline answers');
    return { provider: 'offline', timeoutMs: AI_TIMEOUT_MS };
  }
  if (AI_PROVIDER === 'openai' && !AI_MODEL) {
    console.warn('[assistant] AI_PROVIDER=openai needs AI_MODEL, using offline answers');
    return { provider: 'offline', timeoutMs: AI_TIMEOUT_MS };
  }

  return {
    provider: AI_PROVIDER,
    model: AI_MODEL ?? (AI_PROVIDER === 'anthropic' ? DEFAULT_ANTHROPIC_MODEL : undefined),
    apiKey: AI_API_KEY,
    baseUrl: AI_BASE_URL,
    timeoutMs: AI_TIMEOUT_MS,
  };
}
