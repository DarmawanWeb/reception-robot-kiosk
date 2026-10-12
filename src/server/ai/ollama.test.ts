import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { getRobot, getSite } from '@taksu/content';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type AiConfig, readAiConfig } from '@/lib/ai-config';
import { generateReply } from './index';
import { stripThinking } from './providers/ollama';
import type { AssistantRequest } from './types';

/** Minimal stand-in for Ollama's /api/chat, recording what the kiosk sends. */
let server: Server;
let baseUrl = '';
const received: Array<Record<string, unknown>> = [];

beforeAll(async () => {
  server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const json = JSON.parse(body) as Record<string, unknown>;
      received.push(json);
      setTimeout(() => {
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            message: {
              role: 'assistant',
              content: '<think>plan</think> Om Swastiastu, toilet ada di lantai satu.',
            },
          }),
        );
      }, 150);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

const request: AssistantRequest = {
  robot: getRobot('timo')!,
  site: getSite('kantor-layanan')!,
  locale: 'id',
  messages: [
    { role: 'assistant', content: 'Om Swastiastu' },
    { role: 'user', content: 'Di mana toilet?' },
  ],
};

const config = (overrides: Partial<AiConfig> = {}): AiConfig => ({
  provider: 'ollama',
  model: 'taksu-asisten',
  baseUrl,
  timeoutMs: 2_000,
  keepAlive: '30m',
  maxConcurrency: 2,
  ...overrides,
});

describe('ollama provider', () => {
  it('defaults to the custom taksu model on localhost', () => {
    expect(readAiConfig({ AI_PROVIDER: 'ollama' })).toMatchObject({
      provider: 'ollama',
      model: 'taksu-asisten',
      keepAlive: '30m',
      maxConcurrency: 2,
    });
  });

  it('sends a grounded, non-streaming chat with keep_alive and strips reasoning', async () => {
    const reply = await generateReply(request, config());
    expect(reply).toMatchObject({ source: 'model', action: { roomId: 'toilet' } });
    expect(reply.reply).toBe('Om Swastiastu, toilet ada di lantai satu.');

    const body = received.at(-1)!;
    expect(body).toMatchObject({ model: 'taksu-asisten', stream: false, keep_alive: '30m' });
    const messages = body.messages as Array<{ role: string; content: string }>;
    expect(messages[0]?.role).toBe('system');
    expect(messages[0]?.content).toContain('Kantor Layanan Terpadu Banjar Sari');
    expect(messages.slice(1)).toEqual([{ role: 'user', content: 'Di mana toilet?' }]);
  });

  it('answers offline instead of queueing when the model is busy', async () => {
    const replies = await Promise.all(
      [1, 2, 3].map(() => generateReply(request, config({ maxConcurrency: 2 }))),
    );
    expect(replies.map((reply) => reply.source).sort()).toEqual(['model', 'model', 'offline']);
  });

  it('falls back offline when Ollama is unreachable', async () => {
    const reply = await generateReply(request, config({ baseUrl: 'http://127.0.0.1:9' }));
    expect(reply.source).toBe('offline');
  });

  it('removes think blocks', () => {
    expect(stripThinking('<think>a\nb</think>\nHalo')).toBe('Halo');
  });
});
