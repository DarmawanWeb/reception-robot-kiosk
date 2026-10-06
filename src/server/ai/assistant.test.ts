import { getRobot, getSite } from '@taksu/content';
import { describe, expect, it } from 'vitest';
import { readAiConfig } from '@/lib/ai-config';
import { generateReply, normalizeTurns } from './index';
import { detectRoom } from './intents';
import { offlineReply } from './providers/offline';
import type { AssistantRequest } from './types';

const site = getSite('kantor-layanan')!;
const robot = getRobot('timo')!;
const ask = (content: string, locale: 'id' | 'en' = 'id'): AssistantRequest => ({
  robot,
  site,
  locale,
  messages: [{ role: 'user', content }],
});

describe('offline assistant', () => {
  it('answers from the FAQ in both languages', () => {
    expect(offlineReply(ask('Jam berapa kantor buka?'))).toContain('08.00');
    expect(offlineReply(ask('What are the opening hours?', 'en'))).toContain('08:00');
  });

  it('greets back and falls back politely', () => {
    expect(offlineReply(ask('Halo'))).toContain('Timo');
    expect(offlineReply(ask('Siapa presiden Prancis?'))).toContain('petugas');
  });
});

describe('room intent', () => {
  it('finds rooms by name and synonym', () => {
    expect(detectRoom(site, 'Di mana toilet?')?.id).toBe('toilet');
    expect(detectRoom(site, 'where is the restroom')?.id).toBe('toilet');
    expect(detectRoom(site, 'saya mau ke wantilan')?.id).toBe('wantilan');
    expect(detectRoom(site, 'terima kasih')).toBeUndefined();
  });

  it('offers a navigation action alongside the reply', async () => {
    const reply = await generateReply(ask('Di mana toilet?'), {
      provider: 'offline',
      timeoutMs: 1000,
      keepAlive: '1m',
      maxConcurrency: 1,
    });
    expect(reply).toMatchObject({
      source: 'offline',
      action: { type: 'navigate', roomId: 'toilet' },
    });
  });
});

describe('normalizeTurns', () => {
  it('drops leading assistant turns and merges repeated roles', () => {
    expect(
      normalizeTurns([
        { role: 'assistant', content: 'Om Swastiastu' },
        { role: 'user', content: 'Halo' },
        { role: 'user', content: 'Jam buka?' },
        { role: 'assistant', content: '08.00' },
      ]),
    ).toEqual([
      { role: 'user', content: 'Halo\nJam buka?' },
      { role: 'assistant', content: '08.00' },
    ]);
  });
});

describe('readAiConfig', () => {
  it('defaults to offline and refuses incomplete provider setups', () => {
    expect(readAiConfig({}).provider).toBe('offline');
    expect(readAiConfig({ AI_PROVIDER: 'anthropic' }).provider).toBe('offline');
    expect(readAiConfig({ AI_PROVIDER: 'anthropic', AI_API_KEY: 'k' })).toMatchObject({
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
    });
    expect(
      readAiConfig({
        AI_PROVIDER: 'openai',
        AI_MODEL: 'qwen2.5',
        AI_BASE_URL: 'http://localhost:11434/v1',
      }),
    ).toMatchObject({
      provider: 'openai',
      baseUrl: 'http://localhost:11434/v1',
    });
  });
});
