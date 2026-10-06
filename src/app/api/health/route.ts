import { readAiConfig } from '@/lib/ai-config';
import { speechBaseUrl } from '@/server/speech';

/** GET /api/health: liveness for Docker, Caddy, and the Grafana probes. */
export function GET() {
  return Response.json(
    { ok: true, ai: readAiConfig().provider, speech: Boolean(speechBaseUrl()) },
    { headers: { 'cache-control': 'no-store' } },
  );
}
