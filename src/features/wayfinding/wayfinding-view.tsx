'use client';

import { pick, type KioskSite, type Locale, type RoomCategory } from '@taksu/content';
import { Button } from '@taksu/ui/components/button';
import { cn } from '@taksu/ui/lib/utils';
import { Footprints, Volume2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { KioskActions } from '../kiosk/types';
import { FloorPlan } from './floor-plan';
import { describeRoute, findRoute, type RouteStep } from './route';

const WALKING_SPEED_MS = 1.2;
const categoryOrder: RoomCategory[] = [
  'service',
  'office',
  'facility',
  'dining',
  'wellness',
  'leisure',
];

export function WayfindingView({
  site,
  locale,
  initialRoomId,
  actions,
}: {
  site: KioskSite;
  locale: Locale;
  initialRoomId: string | null;
  actions: Pick<KioskActions, 'say' | 'setMood'>;
}) {
  const t = useTranslations('Wayfinding');
  const [roomId, setRoomId] = useState<string | null>(initialRoomId);
  const [escortRun, setEscortRun] = useState(0);
  const room = site.map.rooms.find((entry) => entry.id === roomId);

  const route = useMemo(
    () => (room ? findRoute(site.map, site.map.startNodeId, room.doorNodeId) : null),
    [room, site.map],
  );
  const directions = useMemo(
    () => (route ? describeRoute(site.map, route) : null),
    [route, site.map],
  );
  const roomName = room ? pick(room.name, locale) : '';

  const stepText = (step: RouteStep) => {
    if (step.kind === 'arrive') return t('steps.arrive', { room: roomName });
    if (step.kind === 'start') return t('steps.start', { meters: step.meters });
    return t(`steps.${step.direction}`, { meters: step.meters });
  };

  const groups = categoryOrder
    .map((category) => ({
      category,
      rooms: site.map.rooms.filter((entry) => entry.category === category),
    }))
    .filter((group) => group.rooms.length > 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[20rem_1fr]">
      <nav aria-label={t('choose')} className="flex flex-col gap-4">
        <h2 className="text-muted-foreground text-lg font-semibold">{t('choose')}</h2>
        {groups.map((group) => (
          <div key={group.category}>
            <h3 className="text-muted-foreground mb-2 text-sm font-semibold">
              {t(`categories.${group.category}`)}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {group.rooms.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    aria-pressed={entry.id === roomId}
                    onClick={() => {
                      setRoomId(entry.id);
                      setEscortRun(0);
                    }}
                    className={cn(
                      'min-h-12 rounded-full border px-4 text-base font-semibold transition-colors',
                      entry.id === roomId
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-surface hover:border-primary',
                    )}
                  >
                    {pick(entry.name, locale)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <section className="flex flex-col gap-5">
        <FloorPlan
          key={roomId ?? 'none'}
          site={site}
          locale={locale}
          route={route}
          destinationRoomId={roomId}
          escortRun={escortRun}
          onEscortDone={() => {
            actions.setMood('happy');
            actions.say(t('arrived', { room: roomName }));
          }}
          label={t('mapLabel', { site: site.name })}
        />
        {directions && room ? (
          <div className="flex flex-col gap-4">
            <p className="text-lg font-semibold">
              {t('distance', {
                meters: directions.meters,
                minutes: Math.floor(directions.meters / WALKING_SPEED_MS / 60),
              })}
            </p>
            <ol className="flex flex-col gap-2">
              {directions.steps.map((step, index) => (
                <li key={`${step.kind}-${index}`} className="flex items-center gap-3 text-lg">
                  <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    {index + 1}
                  </span>
                  {stepText(step)}
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-3">
              <Button
                size="xl"
                onClick={() => {
                  actions.say(t('escorting'));
                  setEscortRun((run) => run + 1);
                }}
              >
                <Footprints aria-hidden />
                {t('escort')}
              </Button>
              <Button
                size="xl"
                variant="outline"
                onClick={() => actions.say(directions.steps.map(stepText).join('. '))}
              >
                <Volume2 aria-hidden />
                {t('readAloud')}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-lg">{t('empty')}</p>
        )}
      </section>
    </div>
  );
}
