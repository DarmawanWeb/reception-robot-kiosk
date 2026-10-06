'use client';

import type { Locale } from '@taksu/content';

/** Root-mean-square loudness of the analyser's current frame, scaled to 0–1. */
function loudness(analyser: AnalyserNode, buffer: Uint8Array<ArrayBuffer>): number {
  analyser.getByteTimeDomainData(buffer);
  let sum = 0;
  for (const sample of buffer) {
    const centred = (sample - 128) / 128;
    sum += centred * centred;
  }
  return Math.min(1, Math.sqrt(sum / buffer.length) * 4);
}

let sharedContext: AudioContext | null = null;
function audioContext(): AudioContext {
  sharedContext ??= new AudioContext();
  if (sharedContext.state === 'suspended') void sharedContext.resume();
  return sharedContext;
}

export interface Recording {
  /** Resolves with the audio when recording stops, or null when it was cancelled. */
  done: Promise<Blob | null>;
  stop: () => void;
  cancel: () => void;
}

/** Records from the microphone (auto-stops after `maxMs`), reporting input loudness. */
export async function startRecording(
  onLevel: (level: number) => void,
  maxMs = 8000,
): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
  });
  const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((type) =>
    MediaRecorder.isTypeSupported(type),
  );
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  let cancelled = false;
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const context = audioContext();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const buffer = new Uint8Array(new ArrayBuffer(analyser.fftSize));
  let frame = requestAnimationFrame(function tick() {
    onLevel(loudness(analyser, buffer));
    frame = requestAnimationFrame(tick);
  });

  const done = new Promise<Blob | null>((resolve) => {
    recorder.onstop = () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      for (const track of stream.getTracks()) track.stop();
      onLevel(0);
      resolve(cancelled ? null : new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
    };
  });
  recorder.start();
  const limit = window.setTimeout(() => {
    if (recorder.state === 'recording') recorder.stop();
  }, maxMs);

  const stop = () => {
    window.clearTimeout(limit);
    if (recorder.state === 'recording') recorder.stop();
  };
  return {
    done,
    stop,
    cancel: () => {
      cancelled = true;
      stop();
    },
  };
}

/** Sends recorded audio to the kiosk's STT proxy. Returns null when unavailable. */
export async function transcribe(audio: Blob, locale: Locale): Promise<string | null> {
  const body = new FormData();
  body.append('audio', audio, 'speech');
  body.append('locale', locale);
  try {
    const response = await fetch('/api/stt', { method: 'POST', body });
    if (!response.ok) return null;
    const data = (await response.json()) as { text?: string };
    return (data.text ?? '').trim();
  } catch {
    return null;
  }
}

let currentAudio: HTMLAudioElement | null = null;

export function stopServerSpeech(): void {
  currentAudio?.pause();
  currentAudio = null;
}

/**
 * Plays server-side TTS and streams loudness for lip-sync. Resolves false (so the caller
 * can fall back to browser speech) if the server has no voice for this language.
 */
export async function speakWithServer(
  text: string,
  locale: Locale,
  handlers: { onStart: () => void; onLevel: (level: number) => void; onEnd: () => void },
): Promise<boolean> {
  let blob: Blob;
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, locale }),
    });
    if (!response.ok) return false;
    blob = await response.blob();
  } catch {
    return false;
  }

  stopServerSpeech();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;
  const context = audioContext();
  const source = context.createMediaElementSource(audio);
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  analyser.connect(context.destination);
  const buffer = new Uint8Array(new ArrayBuffer(analyser.fftSize));
  let frame = 0;

  const finish = () => {
    cancelAnimationFrame(frame);
    source.disconnect();
    analyser.disconnect();
    URL.revokeObjectURL(url);
    handlers.onLevel(0);
    if (currentAudio === audio) currentAudio = null;
    handlers.onEnd();
  };
  audio.onended = finish;
  audio.onerror = finish;
  audio.onpause = () => {
    if (!audio.ended) finish();
  };

  try {
    await audio.play();
  } catch {
    finish();
    return false;
  }
  handlers.onStart();
  frame = requestAnimationFrame(function tick() {
    handlers.onLevel(loudness(analyser, buffer));
    frame = requestAnimationFrame(tick);
  });
  return true;
}
