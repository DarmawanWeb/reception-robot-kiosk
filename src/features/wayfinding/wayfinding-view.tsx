'use client';

import { type KioskSite, type Locale, pick, type RoomCategory } from '@taksu/content';
import { AksaraText } from '@taksu/ui/brand/aksara-text';
import { Button } from '@taksu/ui/components/button';
import { cn } from '@taksu/ui/lib/utils';
import { Footprints, Printer, Volume2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { KioskActions } from '../kiosk/types';
import { PrintSlip, QrImage, SlipHeader } from '../print/print-slip';
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
  roomId,
  onRoomChange,
  canEscort,
  actions,
}: {
  site: KioskSite;
  locale: Locale;
  roomId: string | null;
  onRoomChange: (roomId: string) => void;
  /** Mobile robots walk guests there; the static kiosk prints a route slip instead. */
  canEscort: boolean;
  actions: Pick<KioskActions, 'say' | 'setMood'>;
}) {
  const t = useTranslations('Wayfinding');
  const tPrint = useTranslations('Print');
  const [escortRun, setEscortRun] = useState(0);
  const [slipFor, setSlipFor] = useState<string | null>(null);
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

  function choose(id: string) {
    setEscortRun(0);
    setSlipFor(null);
    onRoomChange(id);
  }

  function printRouteSlip(id: string) {
    setSlipFor(id);
    window.setTimeout(() => window.print(), 1200);
  }

  const slipUrl =
    slipFor && typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?view=wayfinding&room=${slipFor}`
      : null;

  return (
    <div className="grid gap-7 landscape:grid-cols-[17rem_minmax(0,1fr)]">
      <nav aria-label={t('choose')} className="flex flex-col gap-4 portrait:order-last">
        <h3 className="text-[1.15rem] font-bold">{t('choose')}</h3>
        {groups.map((group) => (
          <div key={group.category}>
            <h4 className="text-muted-foreground mb-2 text-[0.95rem] font-semibold">
              {t(`categories.${group.category}`)}
            </h4>
            <ul className="flex flex-wrap gap-2">
              {group.rooms.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    aria-pressed={entry.id === roomId}
                    onClick={() => choose(entry.id)}
                    className={cn(
                      'min-h-12 rounded-full border-2 px-4 text-[1rem] font-semibold transition-colors',
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
            <p className="text-[1.25rem] font-bold">
              {roomName}
              <span className="text-muted-foreground ml-3 text-[1.05rem] font-semibold">
                {t('distance', {
                  meters: directions.meters,
                  minutes: Math.floor(directions.meters / WALKING_SPEED_MS / 60),
                })}
              </span>
            </p>
            <ol className="flex flex-col gap-2.5">
              {directions.steps.map((step, index) => (
                <li
                  // biome-ignore lint/suspicious/noArrayIndexKey: steps are rebuilt from the route and never reorder
                  key={`${step.kind}-${index}`}
                  className="flex items-center gap-3 text-[1.15rem]"
                >
                  <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-[0.95rem] font-bold">
                    {index + 1}
                  </span>
                  {stepText(step)}
                </li>
              ))}
            </ol>
            {!canEscort ? (
              <p className="text-muted-foreground text-[1rem]">{t('noEscort')}</p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              {canEscort ? (
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
              ) : (
                <Button size="xl" onClick={() => printRouteSlip(room.id)}>
                  <Printer aria-hidden />
                  {tPrint('routeSlip')}
                </Button>
              )}
              <Button
                size="xl"
                variant="outline"
                onClick={() => actions.say(directions.steps.map(stepText).join('. '))}
              >
                <Volume2 aria-hidden />
                {t('readAloud')}
              </Button>
            </div>
            {slipUrl ? (
              <PrintSlip>
                <SlipHeader siteName={site.name} />
                <p className="mt-4 text-[0.95rem] font-semibold">{tPrint('routeTitle')}</p>
                <AksaraText latin={roomName} decorative className="block text-[1.5rem]" />
                <p className="font-display text-[1.6rem] leading-tight font-bold">{roomName}</p>
                <div className="ticket-rule my-4" />
                <ol className="list-decimal space-y-1 pl-6 text-left text-[0.95rem]">
                  {directions.steps.map((step, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: steps are rebuilt from the route and never reorder
                    <li key={`slip-${index}`}>{stepText(step)}</li>
                  ))}
                </ol>
                <div className="mt-5">
                  <QrImage value={slipUrl} size={112} label={tPrint('scanMap')} />
                  <p className="text-paper-muted mt-1 text-[0.8rem]">{tPrint('scanMap')}</p>
                </div>
              </PrintSlip>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground text-[1.15rem]">{t('empty')}</p>
        )}
      </section>
    </div>
  );
}
