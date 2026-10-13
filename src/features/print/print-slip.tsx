'use client';

import { AksaraText } from '@taksu/ui/brand/aksara-text';
import { cn } from '@taksu/ui/lib/utils';
import QRCode from 'qrcode';
import { type ReactNode, useEffect, useState } from 'react';
import { signLatin } from '../kiosk/signboard';

/**
 * A ticket as it leaves the printer: 80 mm thermal paper, black on white in either theme,
 * sliding out of the printer mouth once. Only `.print-slip` is visible when printing.
 */
export function PrintSlip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="w-full max-w-[21rem]">
      <div aria-hidden className="printer-mouth" />
      <div className="ticket-drop overflow-hidden drop-shadow-[0_0.6rem_0.8rem_rgb(0_0_0/0.22)]">
        <article
          className={cn(
            'print-slip ticket-paper animate-ticket-out px-6 pt-5 text-center',
            className,
          )}
        >
          {children}
        </article>
      </div>
    </div>
  );
}

/** The venue's name at the top of every slip, Aksara Bali above Latin like its signboard. */
export function SlipHeader({ siteName }: { siteName: string }) {
  return (
    <header>
      <AksaraText latin={siteName} decorative className="block text-[1.05rem] leading-[1.9]" />
      <p className="text-[0.8rem] leading-snug font-bold tracking-[0.06em] uppercase">
        {signLatin(siteName)}
      </p>
    </header>
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
    // biome-ignore lint/performance/noImgElement: the QR is a data URL generated on the device
    <img src={src} alt={label} width={size} height={size} className="mx-auto bg-white" />
  ) : (
    <div aria-hidden className="mx-auto bg-neutral-100" style={{ width: size, height: size }} />
  );
}
