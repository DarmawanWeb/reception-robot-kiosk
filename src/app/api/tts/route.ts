import { locales } from '@taksu/content';
import { z } from 'zod';
import { clientKey, createRateLimiter } from '@/server/rate-limit';
import { synthesizeSpeech } from '@/server/speech';

const limiter = createRateLimiter({
  limit: Number(process.env.TTS_RATE_LIMIT) || 120,
  windowMs: 60_000,
});
const bodySchema = z.object({ text: z.string().trim().min(1).max(500), locale: z.enum(locales) });

/** POST /api/tts: { text, locale } → audio/wav from the local Piper service. */
export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = limiter.check(clientKey(request.headers));
  if (!allowed) {
    return Response.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'retry-after': String(retryAfterSeconds) } },
    );
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'invalid_request' }, { status: 400 });
  try {
    const upstream = await synthesizeSpeech(parsed.data.text, parsed.data.locale);
    return new Response(upstream.body, {
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'audio/wav',
        'cache-control': 'private, max-age=86400',
      },
    });
  } catch (error) {
    console.error('[tts] speech service failed', error);
    return Response.json({ error: 'tts_unavailable' }, { status: 503 });
  }
}
