import { getSite } from '@taksu/content';
import { describe, expect, it } from 'vitest';
import { formatTicketCode, issueTicket, parseCounters, queueStorageKey } from './queue';

const service = getSite('kantor-layanan')!.services[0]!;
const now = new Date('2026-10-06T02:00:00Z');

describe('queue', () => {
  it('numbers tickets per service with a padded code', () => {
    const first = issueTicket({}, service, now);
    const second = issueTicket(first.counters, service, now);
    expect(first.ticket.code).toBe('A-001');
    expect(second.ticket.code).toBe('A-002');
    expect(formatTicketCode('C', 42)).toBe('C-042');
  });

  it('estimates waiting time from the people ahead', () => {
    const { ticket } = issueTicket({}, service, now);
    expect(ticket.estimatedMinutes).toBe(ticket.peopleAhead * service.averageMinutes);
  });

  it('keys storage by site and Bali calendar day', () => {
    expect(queueStorageKey('resort', new Date('2026-10-06T17:00:00Z'))).toBe(
      'taksu-kiosk:queue:resort:2026-10-07',
    );
  });

  it('ignores corrupt stored counters', () => {
    expect(parseCounters('not json')).toEqual({});
    expect(parseCounters('{"adminduk":3,"x":"y"}')).toEqual({ adminduk: 3 });
  });
});
