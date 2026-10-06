'use client';

import type { KioskSite, Locale } from '@taksu/content';
import { AksaraText } from '@taksu/ui/brand/aksara-text';
import { Badge } from '@taksu/ui/components/badge';
import { Button } from '@taksu/ui/components/button';
import { Maximize, Volume2, VolumeX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CalendarBadge } from './calendar-badge';
import { useWitaClock } from './hooks';
import { LanguageToggle } from './language-toggle';

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.();
}

export function KioskHeader({
  site,
  locale,
  voiceOn,
  onToggleVoice,
}: {
  site: KioskSite;
  locale: Locale;
  voiceOn: boolean;
  onToggleVoice: () => void;
}) {
  const t = useTranslations('Kiosk');
  const time = useWitaClock(locale);

  return (
    <header className="border-border flex items-center gap-4 border-b px-4 py-2 md:px-6">
      <div className="min-w-0">
        <AksaraText
          latin={site.name}
          decorative
          className="text-primary block truncate text-sm leading-[1.7]"
        />
        <p className="font-display truncate text-lg font-semibold md:text-xl">{site.name}</p>
      </div>
      {site.isSample ? (
        <Badge variant="gold" className="hidden shrink-0 sm:inline-flex">
          {t('sample')}
        </Badge>
      ) : null}
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden flex-col items-end leading-tight lg:flex">
          <span className="font-display text-xl font-semibold tabular-nums">{time}</span>
          <CalendarBadge />
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-pressed={voiceOn}
          aria-label={voiceOn ? t('voiceOn') : t('voiceOff')}
          title={voiceOn ? t('voiceOn') : t('voiceOff')}
          onClick={onToggleVoice}
        >
          {voiceOn ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
        </Button>
        <LanguageToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('fullscreen')}
          title={t('fullscreen')}
          onClick={toggleFullscreen}
        >
          <Maximize aria-hidden />
        </Button>
      </div>
    </header>
  );
}
