'use client';

import { OM_SWASTIASTU } from '@taksu/bali';
import {
  type KioskSite,
  type Locale,
  localeLabels,
  locales,
  type ReceptionRobot,
} from '@taksu/content';
import { AksaraText } from '@taksu/ui/brand/aksara-text';
import { RobotFace } from '@taksu/ui/brand/robot-face';
import { cn } from '@taksu/ui/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Gate } from './gate';
import { KioskClock } from './kiosk-controls';
import { SampleTag } from './kiosk-header';
import { Signboard } from './signboard';

/** Each start button speaks its own language, whatever the screen is showing. */
const startIn: Record<Locale, string> = { id: 'Mulai', en: 'Start' };

/**
 * Attract screen: the face waits in a split gate under the venue's signboard. Touching
 * anywhere starts in the current language; the two big buttons start in a chosen one, so a
 * tourist never has to find a small language switch first.
 */
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
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function startWith(target: Locale) {
    if (target === locale) {
      onStart();
      return;
    }
    startTransition(() =>
      router.replace({ pathname, query: { view: 'home', greet: '1' } }, { locale: target }),
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      <Gate />
      <button
        type="button"
        onClick={onStart}
        aria-label={t('touchToStart')}
        className="absolute inset-0 cursor-pointer"
      />
      <KioskClock
        locale={locale}
        className="pointer-events-none absolute top-5 right-6 items-end text-right portrait:hidden"
      />
      <div className="pointer-events-none relative flex h-full flex-col items-center overflow-y-auto px-6 text-center landscape:justify-center landscape:gap-5 landscape:py-6 portrait:justify-between portrait:pt-8 portrait:pb-10">
        <div className="flex w-full max-w-[38rem] flex-col items-center gap-2">
          <Signboard name={site.name} size="lg" className="w-full" />
          {site.isSample ? <SampleTag /> : null}
        </div>

        <div className="flex flex-col items-center">
          <RobotFace
            variant={robot.slug}
            label={t('faceLabel', { robot: robot.name, mood: t('moods.idle') })}
            className="w-[15rem] portrait:w-[min(27rem,60vw)]"
          />
          <AksaraText
            aksara={OM_SWASTIASTU.aksara}
            decorative
            className="text-primary mt-3 block text-[2.3rem] leading-[1.9] portrait:text-[2.8rem]"
          />
          <p className="font-display text-[2.8rem] leading-none font-bold [font-stretch:85%] portrait:text-[3.4rem]">
            {OM_SWASTIASTU.latin}
          </p>
          <p className="text-muted-foreground mt-3 text-[1.1rem] text-balance portrait:max-w-[19rem]">
            {OM_SWASTIASTU.meaning[locale]}
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <ul className="pointer-events-auto flex gap-3 portrait:flex-col">
            {locales.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  lang={option}
                  disabled={pending}
                  onClick={() => startWith(option)}
                  className={cn(
                    'flex min-h-[4.5rem] w-[17rem] flex-col items-start justify-center rounded-lg border-2 px-5 py-2.5 text-left transition-colors disabled:opacity-60',
                    option === locale
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-surface hover:border-primary',
                  )}
                >
                  <span className="text-[0.95rem] font-semibold opacity-80">{startIn[option]}</span>
                  <span className="font-display text-[1.45rem] leading-tight font-bold">
                    {localeLabels[option]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <KioskClock locale={locale} className="items-center landscape:hidden" />
        </div>
      </div>
    </div>
  );
}
