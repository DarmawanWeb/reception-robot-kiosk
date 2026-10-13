'use client';

import { useEffect, useState } from 'react';
import { LEDGES, OUTLINE } from '../kiosk/gate';

const SCREEN = { width: 1080, height: 1920 };
/** The crown is cropped to the top four tiers of the gate drawing. */
const CROWN = { x: 60, y: -24, width: 280, height: 204, share: 0.62 };
/**
 * Height of everything at scale 1, for fitting the window: the screen, the crown above it
 * (it grows with the screen width), and the fixed bezel, printer, base, and page header.
 */
const TOTAL_HEIGHT = SCREEN.height + CROWN.share * SCREEN.width * (CROWN.height / CROWN.width);
const FIXED_HEIGHT = 270;

/** The silhouette without the straight inner edge, so the joined halves show no seam. */
const OUTER_EDGE = OUTLINE.slice(0, OUTLINE.lastIndexOf('v'));

/** The crown: a candi bentar's two halves joined into one tiered top, in timber and prada. */
function Crown() {
  return (
    <svg
      viewBox={`${CROWN.x} ${CROWN.y} ${CROWN.width} ${CROWN.height}`}
      aria-hidden
      className="block h-auto w-full"
    >
      {[false, true].map((mirrored) => (
        <g key={String(mirrored)} transform={mirrored ? 'translate(398 0) scale(-1 1)' : undefined}>
          <path d={OUTLINE} fill="var(--board)" />
          <path d={OUTER_EDGE} fill="none" stroke="var(--board-frame)" strokeWidth="3" />
          <g
            stroke="var(--board-ink)"
            strokeOpacity="0.55"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          >
            {LEDGES.map(([x, top, bottom]) => (
              <g key={top}>
                <path d={`M${x} ${top}H201M${x} ${bottom}H201`} />
                <path d={`M${x} ${top}c-6 -1 -10 -6 -8 -13c1 4 4 6 7 6`} strokeOpacity="1" />
              </g>
            ))}
          </g>
          <path d="M177 8c-7 -6 -6 -15 0 -24c6 9 7 18 0 24z" fill="var(--board-ink)" />
        </g>
      ))}
    </svg>
  );
}

/**
 * The Taksu Kiosk as it stands in a lobby: the kiosk app runs in a 1080×1920 frame (so it
 * lays out exactly as on the 24-inch portrait screen), scaled down to fit this window.
 */
export function TotemFrame({ src, title }: { src: string; title: string }) {
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    // A phone held upright is already a portrait screen: open the kiosk itself, full size.
    if (window.matchMedia('(max-width: 639px) and (orientation: portrait)').matches) {
      window.location.replace(src);
      return;
    }
    const resize = () => {
      const byHeight = (window.innerHeight - FIXED_HEIGHT) / TOTAL_HEIGHT;
      const byWidth = (window.innerWidth - 96) / SCREEN.width;
      setScale(Math.max(0.2, Math.min(byHeight, byWidth, 1)));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [src]);

  const width = Math.round(SCREEN.width * scale);
  const height = Math.round(SCREEN.height * scale);

  return (
    <div className="flex flex-col items-center" style={{ width: width + 48 }}>
      <div style={{ width: `${CROWN.share * 100}%` }}>
        <Crown />
      </div>
      <div className="bg-board border-board-frame w-full rounded-[1.25rem] border-[6px] p-4 shadow-[inset_0_0_0_2px_var(--board-line),0_1.5rem_3rem_rgb(20_24_58/0.25)]">
        <div className="overflow-hidden rounded-md bg-black" style={{ width, height }}>
          <iframe
            src={src}
            title={title}
            width={SCREEN.width}
            height={SCREEN.height}
            className="origin-top-left border-0"
            style={{ transform: `scale(${scale})` }}
          />
        </div>
        <div aria-hidden className="mt-4 flex items-center justify-center gap-6 pb-1">
          <span className="h-2.5 w-2/5 rounded-full bg-black shadow-[inset_0_2px_3px_rgb(0_0_0/0.8),0_1px_0_rgb(255_255_255/0.08)]" />
          <span className="border-board-frame size-7 rounded-md border-2 bg-black" />
        </div>
      </div>
      <div
        aria-hidden
        className="bg-board border-board-frame h-4 w-[86%] rounded-b-lg border-x-[6px] border-b-[6px]"
      />
    </div>
  );
}
