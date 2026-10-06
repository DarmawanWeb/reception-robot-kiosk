'use client';

import { formatPawukon, pawukonFromCycleDay } from '@taksu/bali';
import { usePawukonCycleDay } from '@taksu/ui/lib/use-pawukon-today';
import { useTranslations } from 'next-intl';

/** Today's Pawukon day, with a holy-day greeting when there is one. */
export function CalendarBadge() {
  const t = useTranslations('Calendar');
  const cycleDay = usePawukonCycleDay();
  if (cycleDay === null) return null;
  const day = pawukonFromCycleDay(cycleDay);
  const holyDay = day.holyDays[0];
  return (
    <span className="text-muted-foreground text-sm">
      {holyDay ? (
        <span className="text-primary font-semibold">{t('holyToday', { name: holyDay.name })}</span>
      ) : (
        formatPawukon(day)
      )}
    </span>
  );
}
