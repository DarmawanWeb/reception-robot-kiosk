'use client';

import type { Locale } from '@taksu/content';
import { useSyncExternalStore } from 'react';

interface RecognitionEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type RecognitionConstructor = new () => Recognition;

const speechLang = (locale: Locale) => (locale === 'id' ? 'id-ID' : 'en-US');

function recognitionConstructor(): RecognitionConstructor | undefined {
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

const noSubscription = () => () => {};

/** Browser speech capabilities, false during server render to keep hydration stable. */
export function useSpeechSupport(): { tts: boolean; stt: boolean } {
  const tts = useSyncExternalStore(
    noSubscription,
    () => 'speechSynthesis' in window,
    () => false,
  );
  const stt = useSyncExternalStore(
    noSubscription,
    () => recognitionConstructor() !== undefined,
    () => false,
  );
  return { tts, stt };
}

export function speak(
  text: string,
  locale: Locale,
  voice: { pitch: number; rate: number },
  handlers: { onStart?: () => void; onEnd?: () => void } = {},
): void {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLang(locale);
  utterance.pitch = voice.pitch;
  utterance.rate = voice.rate;
  const match = synth
    .getVoices()
    .find((candidate) => candidate.lang.replace('_', '-').startsWith(locale));
  if (match) utterance.voice = match;
  utterance.onstart = () => handlers.onStart?.();
  utterance.onend = () => handlers.onEnd?.();
  utterance.onerror = () => handlers.onEnd?.();
  synth.speak(utterance);
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

/** Listens for one utterance. Returns a function that cancels listening. */
export function listenOnce(
  locale: Locale,
  handlers: { onResult: (transcript: string) => void; onEnd: () => void },
): () => void {
  const Constructor = recognitionConstructor();
  if (!Constructor) {
    handlers.onEnd();
    return () => {};
  }
  const recognition = new Constructor();
  recognition.lang = speechLang(locale);
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript?.trim();
    if (transcript) handlers.onResult(transcript);
  };
  recognition.onend = handlers.onEnd;
  recognition.onerror = handlers.onEnd;
  recognition.start();
  return () => recognition.abort();
}
