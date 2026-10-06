'use client';

import type { Locale } from '@taksu/content';
import { useEffect, useState } from 'react';

export interface SpeechServerStatus {
  stt: boolean;
  tts: Record<Locale, boolean>;
}

const OFFLINE: SpeechServerStatus = { stt: false, tts: { id: false, en: false } };

/** Which speech features the kiosk server can provide (Whisper STT, Piper TTS). */
export function useSpeechServer(): SpeechServerStatus {
  const [status, setStatus] = useState<SpeechServerStatus>(OFFLINE);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/speech/health', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : OFFLINE))
      .then((data: SpeechServerStatus) =>
        setStatus({
          stt: Boolean(data.stt),
          tts: { id: Boolean(data.tts?.id), en: Boolean(data.tts?.en) },
        }),
      )
      .catch(() => setStatus(OFFLINE));
    return () => controller.abort();
  }, []);
  return status;
}
