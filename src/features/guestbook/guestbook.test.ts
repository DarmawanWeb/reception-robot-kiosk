import { describe, expect, it } from 'vitest';
import { counterKey, nextSequence, passId, passQrPayload } from './guestbook';

describe('guest book', () => {
  it('numbers passes per Bali day', () => {
    const lateUtc = new Date('2026-10-06T17:30:00Z'); // already 7 October in WITA
    expect(passId(lateUtc, 7)).toBe('TM-20261007-007');
    expect(counterKey('kantor-layanan', lateUtc)).toBe(
      'taksu-kiosk:guest-seq:kantor-layanan:20261007',
    );
  });

  it('recovers from missing or corrupt counters', () => {
    expect(nextSequence(null)).toBe(1);
    expect(nextSequence('12')).toBe(13);
    expect(nextSequence('oops')).toBe(1);
  });

  it('encodes a compact QR payload', () => {
    const payload = JSON.parse(
      passQrPayload(
        { id: 'TM-1', name: 'Made', origin: '', purpose: 'meet', hostId: 'kepala', issuedAt: 1 },
        'resort',
      ),
    );
    expect(payload).toEqual({
      t: 'taksu-pass',
      id: 'TM-1',
      s: 'resort',
      n: 'Made',
      h: 'kepala',
      at: 1,
    });
  });
});
