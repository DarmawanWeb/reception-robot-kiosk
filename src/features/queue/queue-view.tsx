'use client';

import { toBalineseDigits } from '@taksu/bali';
import { type KioskSite, type Locale, pick, type QueueService } from '@taksu/content';
import { AksaraText } from '@taksu/ui/brand/aksara-text';
import { Button } from '@taksu/ui/components/button';
import { Printer, Route } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { formatWitaTime } from '../kiosk/hooks';
import type { KioskActions } from '../kiosk/types';
import { PrintSlip, QrImage } from '../print/print-slip';
import { issueTicket, parseCounters, type QueueTicket, queueStorageKey } from './queue';

function useIssueTicket(siteSlug: string) {
  return useCallback(
    (service: QueueService): QueueTicket => {
      const now = new Date();
      const key = queueStorageKey(siteSlug, now);
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(key);
      } catch {
        stored = null;
      }
      const { counters, ticket } = issueTicket(parseCounters(stored), service, now);
      try {
        window.localStorage.setItem(key, JSON.stringify(counters));
      } catch {
        // Private mode or full storage: the ticket is still valid for this session.
      }
      return ticket;
    },
    [siteSlug],
  );
}

export function QueueView({
  site,
  locale,
  actions,
  onDone,
}: {
  site: KioskSite;
  locale: Locale;
  actions: KioskActions;
  onDone: () => void;
}) {
  const t = useTranslations('Queue');
  const tPrint = useTranslations('Print');
  const issue = useIssueTicket(site.slug);
  const [issued, setIssued] = useState<{
    ticket: QueueTicket;
    service: QueueService;
    trackUrl: string;
  } | null>(null);

  if (issued) {
    const { ticket, service } = issued;
    const counter = pick(service.counter, locale);
    return (
      <div className="flex flex-col items-start gap-6">
        <PrintSlip>
          <AksaraText latin={site.name} decorative className="text-primary block text-sm" />
          <p className="font-semibold">{site.name}</p>
          <p className="text-muted-foreground mt-4">{t('ticketTitle')}</p>
          <p className="font-display text-7xl font-bold tracking-tight tabular-nums">
            {ticket.code}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('inAksara')}:{' '}
            <AksaraText
              aksara={toBalineseDigits(ticket.number)}
              className="text-foreground text-2xl"
            />
          </p>
          <p className="mt-4 text-lg font-semibold">{pick(service.name, locale)}</p>
          <p>{t('counter', { counter })}</p>
          <p className="mt-4">{t('ahead', { count: ticket.peopleAhead })}</p>
          {ticket.peopleAhead > 0 ? (
            <p className="font-semibold">{t('estimate', { minutes: ticket.estimatedMinutes })}</p>
          ) : null}
          <div className="mt-4">
            <QrImage value={issued.trackUrl} size={112} label={tPrint('scanQueue')} />
            <p className="text-muted-foreground mt-1 text-xs">{tPrint('scanQueue')}</p>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            {t('issued', { time: formatWitaTime(ticket.issuedAt, locale) })}
          </p>
        </PrintSlip>
        <div className="flex flex-wrap gap-3">
          <Button size="xl" onClick={() => window.print()}>
            <Printer aria-hidden />
            {t('print')}
          </Button>
          {service.roomId ? (
            <Button
              size="xl"
              variant="outline"
              onClick={() => actions.guideTo(service.roomId as string)}
            >
              <Route aria-hidden />
              {t('guide', { counter })}
            </Button>
          ) : null}
          <Button size="xl" variant="ghost" onClick={onDone}>
            {t('done')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-muted-foreground mb-4 text-lg font-semibold">{t('choose')}</h2>
      <ul className="grid gap-4 lg:grid-cols-2">
        {site.services.map((service) => (
          <li key={service.id}>
            <button
              type="button"
              onClick={() => {
                const ticket = issue(service);
                const trackUrl = `${window.location.origin}${window.location.pathname}?view=queue&ticket=${ticket.code}`;
                setIssued({ ticket, service, trackUrl });
                actions.setMood('happy');
                actions.say(
                  t('line', { code: ticket.code, counter: pick(service.counter, locale) }),
                );
              }}
              className="border-border bg-surface hover:border-primary flex h-full w-full items-center gap-5 rounded-xl border p-5 text-left transition-colors"
            >
              <span className="bg-primary font-display text-primary-foreground flex size-16 shrink-0 items-center justify-center rounded-lg text-3xl font-bold">
                {service.prefix}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xl font-semibold">{pick(service.name, locale)}</span>
                <span className="text-muted-foreground block">
                  {pick(service.description, locale)}
                </span>
                <span className="text-muted-foreground mt-1 block text-sm">
                  {pick(service.counter, locale)}:{' '}
                  {t('average', { minutes: service.averageMinutes })}
                </span>
              </span>
              <span className="bg-surface-muted hidden rounded-full px-4 py-2 text-sm font-semibold sm:block">
                {t('take')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
