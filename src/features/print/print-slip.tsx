'use client';

import { cn } from '@taksu/ui/lib/utils';
import QRCode from 'qrcode';
import { useEffect, useState, type ReactNode } from 'react';

/**
 * 80 mm thermal-receipt layout. Only `.print-slip` is visible when printing, so the
 * kiosk's built-in printer (or a printer station) outputs just the ticket or pass.
 */
export function PrintSlip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <article
      className={cn(
        'print-slip border-border bg-surface w-full max-w-sm rounded-xl border-2 border-dashed p-6 text-center',
        className,
      )}
    >
      {children}
    </article>
  );
}

/** QR code rendered locally (no external service), as a crisp data-URL image. */
export function QrImage({
  value,
  size = 132,
  label,
}: {
  value: string;
  size?: number;
  label: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setSrc(null);
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- data URL generated on the device
    <img
      src={src}
      alt={label}
      width={size}
      height={size}
      className="mx-auto rounded bg-white p-1"
    />
  ) : (
    <div
      aria-hidden
      className="bg-surface-muted mx-auto rounded"
      style={{ width: size, height: size }}
    />
  );
}
