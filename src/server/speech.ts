import type { Locale } from '@taksu/content';

/** Base URL of the speech service (Whisper STT + Piper TTS). Empty disables server speech. */
export function speechBaseUrl(env: Record<string, string | undefined> = process.env): string {
  return (env.SPEECH_URL ?? '').trim().replace(/\/+$/, '');
}

export interface SpeechHealth {
  stt: boolean;
  tts: Record<Locale, boolean>;
}

const NONE: SpeechHealth = { stt: false, tts: { id: false, en: false } };

export async function speechHealth(base = speechBaseUrl()): Promise<SpeechHealth> {
  if (!base) return NONE;
  try {
    const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) return NONE;
    const data = (await response.json()) as {
      stt?: boolean;
      tts?: Partial<Record<Locale, boolean>>;
    };
    return {
      stt: Boolean(data.stt),
      tts: { id: Boolean(data.tts?.id), en: Boolean(data.tts?.en) },
    };
  } catch {
    return NONE;
  }
}

export async function transcribeAudio(
  audio: Blob,
  locale: Locale,
  base = speechBaseUrl(),
): Promise<string> {
  if (!base) throw new Error('SPEECH_URL is not configured');
  const form = new FormData();
  form.append('file', audio, 'speech');
  form.append('language', locale);
  const response = await fetch(`${base}/stt`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`STT responded ${response.status}`);
  const data = (await response.json()) as { text?: string };
  return (data.text ?? '').trim();
}

export async function synthesizeSpeech(
  text: string,
  locale: Locale,
  base = speechBaseUrl(),
): Promise<Response> {
  if (!base) throw new Error('SPEECH_URL is not configured');
  const response = await fetch(`${base}/tts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, language: locale }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok || !response.body) throw new Error(`TTS responded ${response.status}`);
  return response;
}
