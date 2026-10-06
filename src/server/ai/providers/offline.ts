import { pick, type Locale } from '@taksu/content';
import { detectRoom } from '../intents';
import { overlap, tokenize } from '../text';
import type { AssistantRequest } from '../types';

const phrases: Record<
  Locale,
  {
    thanks: string;
    queue: string;
    room: (room: string) => string;
    fallback: (topics: string) => string;
  }
> = {
  id: {
    thanks: 'Suksma! Senang bisa membantu.',
    queue: 'Untuk nomor antrean, sentuh menu Ambil antrean lalu pilih layanan Anda.',
    room: (room) => `${room} bisa saya tunjukkan. Sentuh tombol di bawah, saya antar ke sana.`,
    fallback: (topics) =>
      `Maaf, saya belum tahu jawabannya. Saya bisa membantu soal ${topics}, atau silakan tanyakan ke petugas.`,
  },
  en: {
    thanks: 'Suksma! Glad I could help.',
    queue: 'For a queue number, touch Take a queue number and choose your service.',
    room: (room) => `I can show you ${room}. Touch the button below and I will walk you there.`,
    fallback: (topics) =>
      `Sorry, I do not know that yet. I can help with ${topics}, or please ask a member of staff.`,
  },
};

const GREETINGS = new Set([
  'halo',
  'hai',
  'hello',
  'hi',
  'om',
  'swastiastu',
  'pagi',
  'siang',
  'sore',
  'malam',
]);
const THANKS = new Set(['terima', 'kasih', 'makasih', 'suksma', 'thanks', 'thank']);
const QUEUE = new Set([
  'antre',
  'antrean',
  'antrian',
  'nomor',
  'queue',
  'ticket',
  'tiket',
  'number',
]);

/**
 * Deterministic answers from the venue data. Used when no model is configured and as a
 * fallback when the model call fails, so the kiosk never goes silent in front of a guest.
 */
export function offlineReply({ robot, site, locale, messages }: AssistantRequest): string {
  const question = [...messages].reverse().find((turn) => turn.role === 'user')?.content ?? '';
  const tokens = tokenize(question);
  const text = phrases[locale];

  let best: { answer: string; score: number } | undefined;
  for (const item of site.faq) {
    const vocabulary = new Set([...item.keywords, ...tokenize(pick(item.question, locale))]);
    const score = overlap(tokens, vocabulary);
    if (score > 0 && (!best || score > best.score))
      best = { answer: pick(item.answer, locale), score };
  }
  if (best) return best.answer;

  const room = detectRoom(site, question);
  if (room) return text.room(pick(room.name, locale));
  if (tokens.some((token) => QUEUE.has(token))) return text.queue;
  if (tokens.some((token) => THANKS.has(token))) return text.thanks;
  if (tokens.length === 0 || tokens.every((token) => GREETINGS.has(token))) {
    return pick(robot.persona.greeting, locale);
  }

  const topics = site.faq
    .slice(0, 3)
    .map((item) => pick(item.question, locale).replace(/\?$/, '').toLowerCase())
    .join(', ');
  return text.fallback(topics);
}
