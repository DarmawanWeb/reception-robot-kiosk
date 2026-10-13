'use client';

import type { KioskSite, Locale } from '@taksu/content';
import { useTranslations } from 'next-intl';
import { KioskClock, KioskControls } from './kiosk-controls';
import { Signboard } from './signboard';

/** Marks the venue as sample data, so a demo is never mistaken for a real office. */
export function SampleTag() {
  const t = useTranslations('Kiosk');
  return (
    <span className="border-border text-muted-foreground shrink-0 rounded-full border border-dashed px-3 py-1 text-[0.8rem] font-semibold">
      {t('sample')}
    </span>
  );
}

/**
 * The venue's signboard. On the landscape robot screens the clock and controls sit beside
 * it; on the portrait totem they move down to the dock, within reach.
 */
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
  return (
    <header className="flex items-center gap-4 px-5 py-3 portrait:flex-col portrait:gap-2.5 portrait:px-6 portrait:pt-5 portrait:pb-2">
      <Signboard
        as="h1"
        name={site.name}
        className="max-w-[34rem] min-w-0 portrait:w-full portrait:max-w-none"
      />
      {site.isSample ? <SampleTag /> : null}
      <div className="ml-auto flex items-center gap-5 portrait:hidden">
        <KioskClock locale={locale} className="items-end text-right" />
        <KioskControls voiceOn={voiceOn} onToggleVoice={onToggleVoice} />
      </div>
    </header>
  );
}
