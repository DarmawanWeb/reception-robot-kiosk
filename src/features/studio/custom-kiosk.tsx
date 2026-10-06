'use client';

import type { RobotSlug } from '@taksu/content';
import { Button } from '@taksu/ui/components/button';
import { useTranslations } from 'next-intl';
import { useMemo, useSyncExternalStore } from 'react';
import { Link } from '@/i18n/navigation';
import { KioskApp } from '../kiosk/kiosk-app';
import { buildCustomSite, parseStudioConfig, STUDIO_KEY } from './studio-config';

const SERVER = '__server__';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STUDIO_KEY);
  } catch {
    return null;
  }
}

/** Kiosk built from the visitor's Studio settings stored in this browser. */
export function CustomKiosk({ robotSlug }: { robotSlug: RobotSlug }) {
  const t = useTranslations('Studio');
  const raw = useSyncExternalStore(subscribe, readRaw, () => SERVER);
  const config = useMemo(() => (raw === SERVER ? undefined : parseStudioConfig(raw)), [raw]);
  const site = useMemo(() => (config ? buildCustomSite(config) : null), [config]);

  if (config === undefined) return <div className="bg-background h-dvh" />;
  if (!config || !site) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-4 px-6">
        <p className="text-xl">{t('missing')}</p>
        <Button asChild size="lg">
          <Link href="/studio">{t('toStudio')}</Link>
        </Button>
      </main>
    );
  }
  return <KioskApp robotSlug={robotSlug} site={site} isCustom views={config.views} />;
}
