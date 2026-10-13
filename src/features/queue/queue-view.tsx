'use client';

import { toBalineseDigits } from '@taksu/bali';
import { type KioskSite, type Locale, pick, type QueueService } from '@taksu/content';
import { AksaraText } from '@taksu/ui/brand/aksara-text';
import { Button } from '@taksu/ui/components/button';
import { Check, Printer, Route } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { formatWitaTime } from '../kiosk/hooks';
import type { KioskActions } from '../kiosk/types';
import { PrintSlip, QrImage, SlipHeader } from '../print/print-slip';
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
      <div className="grid items-start gap-8 landscape:grid-cols-[21rem_minmax(0,1fr)] portrait:justify-items-center">
        <PrintSlip>
          <SlipHeader siteName={site.name} />
          <p className="mt-4 text-[0.95rem] font-semibold">{t('ticketTitle')}</p>
          <p className="font-display text-[4.4rem] leading-none font-bold tracking-tight tabular-nums">
            {ticket.code}
          </p>
          <p className="text-paper-muted mt-1 text-[0.85rem]">
            {t('inAksara')}{' '}
            <AksaraText
              aksara={toBalineseDigits(ticket.number)}
              className="text-paper-ink text-[1.4rem] leading-[1.6]"
            />
          </p>
          <div className="ticket-rule my-4" />
          <p className="text-[1.1rem] leading-snug font-bold">{pick(service.name, locale)}</p>
          <p className="text-[0.95rem]">{t('counter', { counter })}</p>
          <p className="mt-3 text-[0.95rem]">{t('ahead', { count: ticket.peopleAhead })}</p>
          {ticket.peopleAhead > 0 ? (
            <p className="text-[0.95rem] font-bold">
              {t('estimate', { minutes: ticket.estimatedMinutes })}
            </p>
          ) : null}
          <div className="mt-4">
            <QrImage value={issued.trackUrl} size={104} label={tPrint('scanQueue')} />
            <p className="text-paper-muted mt-1 text-[0.8rem]">{tPrint('scanQueue')}</p>
          </div>
          <p className="text-paper-muted mt-2 text-[0.8rem]">
            {t('issued', { time: formatWitaTime(ticket.issuedAt, locale) })}
          </p>
        </PrintSlip>

        <div className="flex flex-col gap-6 portrait:items-center portrait:text-center">
          <div>
            <p className="font-display text-[2rem] leading-tight font-bold">
              {t('yourNumber', { code: ticket.code })}
            </p>
            <p className="text-muted-foreground mt-2 max-w-[28rem] text-[1.15rem]">
              {t('waitAt', { counter })}
            </p>
          </div>
          <div className="flex flex-col gap-3 landscape:max-w-[22rem] portrait:w-full portrait:max-w-[24rem]">
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
              <Check aria-hidden />
              {t('done')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex max-w-[50rem] flex-col gap-4">
      {site.services.map((service) => (
        <li key={service.id}>
          <button
            type="button"
            onClick={() => {
              const ticket = issue(service);
              const trackUrl = `${window.location.origin}${window.location.pathname}?view=queue&ticket=${ticket.code}`;
              setIssued({ ticket, service, trackUrl });
              actions.setMood('happy');
              actions.say(t('line', { code: ticket.code, counter: pick(service.counter, locale) }));
            }}
            className="border-border bg-surface hover:border-primary active:bg-surface-muted flex w-full items-center gap-5 rounded-xl border-2 p-5 text-left transition-colors"
          >
            <span
              aria-hidden
              className="bg-primary font-display text-primary-foreground flex size-[4.5rem] shrink-0 items-center justify-center rounded-lg text-[2.4rem] font-bold"
            >
              {service.prefix}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[1.35rem] leading-tight font-bold">
                {pick(service.name, locale)}
              </span>
              <span className="text-muted-foreground mt-1 block text-[1.05rem] leading-snug">
                {pick(service.description, locale)}
              </span>
              <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.95rem] font-semibold">
                <span>{pick(service.counter, locale)}</span>
                <span className="text-muted-foreground">
                  {t('average', { minutes: service.averageMinutes })}
                </span>
              </span>
            </span>
            <span className="bg-primary text-primary-foreground hidden shrink-0 rounded-full px-5 py-3 text-[1rem] font-bold sm:block">
              {t('take')}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
