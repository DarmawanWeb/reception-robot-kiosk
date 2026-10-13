'use client';

import { useTranslations } from 'next-intl';
import type { MenuView } from './types';

/** Where the visitor is: the same title and line as the menu button they pressed. */
export function ViewTitle({ view, robotName }: { view: MenuView; robotName: string }) {
  const t = useTranslations('Kiosk.menu');
  return (
    <div className="mb-6 portrait:mb-5">
      <h2 className="font-display text-[2rem] leading-tight font-bold [font-stretch:90%]">
        {t(`${view}.title`, { robot: robotName })}
      </h2>
      <p className="text-muted-foreground mt-1 text-[1.1rem]">{t(`${view}.body`)}</p>
    </div>
  );
}
