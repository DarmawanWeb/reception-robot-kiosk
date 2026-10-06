import { z } from 'zod';

export type AiProvider = 'offline' | 'anthropic' | 'openai' | 'ollama';

export interface AiConfig {
  provider: AiProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  timeoutMs: number;
  /** How long Ollama keeps the model in memory after a request (e.g. "30m", "24h"). */
  keepAlive: string;
  /** Model calls allowed at once; extra visitors get offline answers instead of waiting. */
  maxConcurrency: number;
}

const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
/** Custom model created by deploy/macmini/ollama/setup.sh. */
const DEFAULT_OLLAMA_MODEL = 'taksu-asisten';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const schema = z.object({
  AI_PROVIDER: z.preprocess(
    emptyToUndefined,
    z.enum(['offline', 'anthropic', 'openai', 'ollama']).default('offline'),
  ),
  AI_MODEL: z.preprocess(emptyToUndefined, z.string().optional()),
  AI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  AI_BASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  AI_TIMEOUT_MS: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(15_000)),
  AI_KEEP_ALIVE: z.preprocess(emptyToUndefined, z.string().default('30m')),
  AI_MAX_CONCURRENCY: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(2)),
});

const OFFLINE: Omit<AiConfig, 'timeoutMs' | 'keepAlive' | 'maxConcurrency'> = {
  provider: 'offline',
};

/** Reads the assistant configuration from server env. Misconfiguration degrades to offline. */
export function readAiConfig(env: Record<string, string | undefined> = process.env): AiConfig {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    console.warn(
      '[assistant] invalid AI_* environment, using offline answers',
      parsed.error.issues,
    );
    return { ...OFFLINE, timeoutMs: 15_000, keepAlive: '30m', maxConcurrency: 2 };
  }
  const {
    AI_PROVIDER,
    AI_MODEL,
    AI_API_KEY,
    AI_BASE_URL,
    AI_TIMEOUT_MS,
    AI_KEEP_ALIVE,
    AI_MAX_CONCURRENCY,
  } = parsed.data;
  const shared = {
    timeoutMs: AI_TIMEOUT_MS,
    keepAlive: AI_KEEP_ALIVE,
    maxConcurrency: AI_MAX_CONCURRENCY,
  };

  if (AI_PROVIDER === 'anthropic' && !AI_API_KEY) {
    console.warn('[assistant] AI_PROVIDER=anthropic needs AI_API_KEY, using offline answers');
    return { ...OFFLINE, ...shared };
  }
  if (AI_PROVIDER === 'openai' && !AI_MODEL) {
    console.warn('[assistant] AI_PROVIDER=openai needs AI_MODEL, using offline answers');
    return { ...OFFLINE, ...shared };
  }

  const defaultModel =
    AI_PROVIDER === 'anthropic'
      ? DEFAULT_ANTHROPIC_MODEL
      : AI_PROVIDER === 'ollama'
        ? DEFAULT_OLLAMA_MODEL
        : undefined;

  return {
    provider: AI_PROVIDER,
    model: AI_MODEL ?? defaultModel,
    apiKey: AI_API_KEY,
    baseUrl: AI_BASE_URL,
    ...shared,
  };
}
