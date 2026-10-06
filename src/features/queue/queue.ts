import type { QueueService } from '@taksu/content';

export interface QueueTicket {
  serviceId: string;
  number: number;
  code: string;
  issuedAt: number;
  peopleAhead: number;
  estimatedMinutes: number;
}

export type QueueCounters = Record<string, number>;

export function formatTicketCode(prefix: string, number: number): string {
  return `${prefix}-${String(number).padStart(3, '0')}`;
}

/** Demo-only crowd: 0–4 people ahead, deterministic per ticket number. */
export function simulatedPeopleAhead(number: number): number {
  return (number * 7 + 3) % 5;
}

export function issueTicket(
  counters: QueueCounters,
  service: QueueService,
  now: Date,
): { counters: QueueCounters; ticket: QueueTicket } {
  const number = (counters[service.id] ?? 0) + 1;
  const peopleAhead = simulatedPeopleAhead(number);
  return {
    counters: { ...counters, [service.id]: number },
    ticket: {
      serviceId: service.id,
      number,
      code: formatTicketCode(service.prefix, number),
      issuedAt: now.getTime(),
      peopleAhead,
      estimatedMinutes: peopleAhead * service.averageMinutes,
    },
  };
}

/** Counters reset every day in Bali time. */
export function queueStorageKey(siteSlug: string, now: Date): string {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(now);
  return `taksu-kiosk:queue:${siteSlug}:${day}`;
}

export function parseCounters(raw: string | null): QueueCounters {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return {};
    return Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, number] =>
        Number.isInteger(entry[1]),
      ),
    );
  } catch {
    return {};
  }
}
