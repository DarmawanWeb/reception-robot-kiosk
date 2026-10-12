'use client';

import { OM_SWASTIASTU } from '@taksu/bali';
import type { KioskSite, ReceptionRobot } from '@taksu/content';
import { AksaraText } from '@taksu/ui/brand/aksara-text';
import { RobotFace } from '@taksu/ui/brand/robot-face';
import { useTranslations } from 'next-intl';
import { CalendarBadge } from './calendar-badge';
import { LanguageToggle } from './language-toggle';

/** Attract screen: the robot face greets passers-by until someone touches the screen. */
export function IdleScreen({
  robot,
  site,
  onStart,
}: {
  robot: ReceptionRobot;
  site: KioskSite;
  onStart: () => void;
}) {
  const t = useTranslations('Kiosk');
  return (
    <div className="relative h-full">
      <LanguageToggle className="absolute top-4 right-4 z-10" />
      <button
        type="button"
        onClick={onStart}
        className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <RobotFace
          variant={robot.slug}
          label={t('faceLabel', { robot: robot.name, mood: t('moods.idle') })}
          className="w-full max-w-lg"
        />
        <AksaraText
          aksara={OM_SWASTIASTU.aksara}
          decorative
          className="text-primary mt-4 text-4xl md:text-5xl"
        />
        <span className="font-display text-4xl font-bold [font-stretch:85%] md:text-6xl">
          {OM_SWASTIASTU.latin}
        </span>
        <span className="text-muted-foreground text-lg">{site.name}</span>
        <CalendarBadge />
        <span className="bg-primary text-primary-foreground mt-6 animate-pulse rounded-full px-8 py-4 text-xl font-semibold">
          {t('touchToStart')}
        </span>
      </button>
    </div>
  );
}
