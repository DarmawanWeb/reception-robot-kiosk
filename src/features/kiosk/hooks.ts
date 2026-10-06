'use client';

import type { Locale } from '@taksu/content';
import { useEffect, useRef, useSyncExternalStore } from 'react';

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/** Calls `onIdle` after `timeoutMs` without interaction while `active` is true. */
export function useIdleTimer(active: boolean, timeoutMs: number, onIdle: () => void): void {
  const onIdleRef = useRef(onIdle);
  useEffect(() => {
    onIdleRef.current = onIdle;
  });

  useEffect(() => {
    if (!active) return;
    let timer = window.setTimeout(() => onIdleRef.current(), timeoutMs);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => onIdleRef.current(), timeoutMs);
    };
    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, reset, { passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, reset);
    };
  }, [active, timeoutMs]);
}

const clockFormatters: Record<Locale, Intl.DateTimeFormat> = {
  id: new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    hour: '2-digit',
    minute: '2-digit',
  }),
  en: new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Makassar',
    hour: '2-digit',
    minute: '2-digit',
  }),
};

function subscribeClock(onChange: () => void) {
  const timer = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(timer);
}

/** Current time in Bali (WITA), or null during server render. */
export function useWitaClock(locale: Locale): string | null {
  return useSyncExternalStore(
    subscribeClock,
    () => clockFormatters[locale].format(new Date()),
    () => null,
  );
}

export function formatWitaTime(timestamp: number, locale: Locale): string {
  return clockFormatters[locale].format(new Date(timestamp));
}
