import { speechHealth, type SpeechHealth } from '@/server/speech';

let cached: { value: SpeechHealth; expires: number } | null = null;

/** GET /api/speech/health: which speech features the server can provide right now. */
export async function GET() {
  const now = Date.now();
  if (!cached || cached.expires < now) {
    cached = { value: await speechHealth(), expires: now + 30_000 };
  }
  return Response.json(cached.value, { headers: { 'cache-control': 'no-store' } });
}
