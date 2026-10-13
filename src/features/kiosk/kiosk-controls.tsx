'use client';

import type { Locale } from '@taksu/content';
import { cn } from '@taksu/ui/lib/utils';
import { Maximize, Volume2, VolumeX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CalendarBadge } from './calendar-badge';
import { useWitaClock } from './hooks';
import { LanguageToggle } from './language-toggle';

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.();
}

const iconButton =
  'text-foreground hover:bg-surface-muted grid size-12 place-items-center rounded-md transition-colors [&_svg]:size-6';

/** Sound, language, and full screen. In the header on robots, in the bottom dock on the totem. */
export function KioskControls({
  voiceOn,
  onToggleVoice,
  className,
}: {
  voiceOn: boolean;
  onToggleVoice: () => void;
  className?: string;
}) {
  const t = useTranslations('Kiosk');
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <button
        type="button"
        aria-pressed={voiceOn}
        aria-label={voiceOn ? t('voiceOn') : t('voiceOff')}
        title={voiceOn ? t('voiceOn') : t('voiceOff')}
        onClick={onToggleVoice}
        className={iconButton}
      >
        {voiceOn ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
      </button>
      <LanguageToggle />
      <button
        type="button"
        aria-label={t('fullscreen')}
        title={t('fullscreen')}
        onClick={toggleFullscreen}
        className={iconButton}
      >
        <Maximize aria-hidden />
      </button>
    </div>
  );
}

/** Bali time and today's Pawukon day, the way a Balinese wall calendar reads. */
export function KioskClock({ locale, className }: { locale: Locale; className?: string }) {
  const time = useWitaClock(locale);
  return (
    <div className={cn('flex flex-col leading-tight', className)}>
      <span className="font-display text-[1.5rem] font-semibold tabular-nums">
        {time ?? ' '}
        <span className="text-muted-foreground ml-1.5 font-sans text-[0.8rem] font-semibold">
          WITA
        </span>
      </span>
      <CalendarBadge />
    </div>
  );
}
