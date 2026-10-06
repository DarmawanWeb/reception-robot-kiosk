export type VisitPurpose = 'meet' | 'service' | 'visit' | 'delivery' | 'other';

export interface VisitorPass {
  id: string;
  name: string;
  origin: string;
  purpose: VisitPurpose;
  hostId: string | null;
  issuedAt: number;
}

const witaDay = (now: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(now).replaceAll('-', '');

/** Pass numbers reset daily in Bali time: TM-20261006-007. */
export function passId(now: Date, sequence: number): string {
  return `TM-${witaDay(now)}-${String(sequence).padStart(3, '0')}`;
}

export function counterKey(siteSlug: string, now: Date): string {
  return `taksu-kiosk:guest-seq:${siteSlug}:${witaDay(now)}`;
}

/** Payload encoded in the pass QR. Kept small so it scans reliably on thermal paper. */
export function passQrPayload(pass: VisitorPass, siteSlug: string): string {
  return JSON.stringify({
    t: 'taksu-pass',
    id: pass.id,
    s: siteSlug,
    n: pass.name,
    h: pass.hostId,
    at: pass.issuedAt,
  });
}

export function nextSequence(raw: string | null): number {
  const current = Number.parseInt(raw ?? '0', 10);
  return Number.isFinite(current) && current >= 0 ? current + 1 : 1;
}
