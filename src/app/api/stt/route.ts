import { locales, type Locale } from '@taksu/content';
import { clientKey, createRateLimiter } from '@/server/rate-limit';
import { transcribeAudio } from '@/server/speech';

const limiter = createRateLimiter({
  limit: Number(process.env.STT_RATE_LIMIT) || 20,
  windowMs: 60_000,
});
const MAX_BYTES = 4 * 1024 * 1024;

/** POST /api/stt: multipart `audio` + `locale` → { text }. Proxies the local Whisper service. */
export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = limiter.check(clientKey(request.headers));
  if (!allowed) {
    return Response.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'retry-after': String(retryAfterSeconds) } },
    );
  }
  const form = await request.formData().catch(() => null);
  const audio = form?.get('audio');
  const locale = String(form?.get('locale') ?? '');
  if (
    !(audio instanceof Blob) ||
    audio.size === 0 ||
    audio.size > MAX_BYTES ||
    !locales.includes(locale as Locale)
  ) {
    return Response.json({ error: 'invalid_request' }, { status: 400 });
  }
  try {
    const text = await transcribeAudio(audio, locale as Locale);
    return Response.json({ text }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('[stt] speech service failed', error);
    return Response.json({ error: 'stt_unavailable' }, { status: 503 });
  }
}
