import { cn } from '@taksu/ui/lib/utils';

/** Outer silhouette of the left half: base, body, seven stepped tiers, crown. */
export const OUTLINE =
  'M0 600V560h12v-20h12V330H14v-14h20v-46h-6v-10h24v-38h-6v-9h24v-33h-5v-8h23v-28h-4v-7h22v-24h-4v-6h22v-20h-3v-5h19V30h14V8h46v592z';

/** Each tier ends in a ledge (pelipit): a double line across the gate. */
export const LEDGES: ReadonlyArray<readonly [x: number, top: number, bottom: number]> = [
  [14, 316, 330],
  [28, 260, 270],
  [46, 213, 222],
  [65, 172, 180],
  [84, 137, 144],
  [102, 107, 113],
  [121, 82, 87],
];

/**
 * One half of a candi bentar, the split gate at the entrance of every Balinese temple and
 * compound: a straight inner face, and an outer side that steps up in tiers to a crown, with
 * a small flame-like curl (karang) on each ledge. Drawn as gold-leaf linework, the left half;
 * `side="right"` mirrors it.
 */
function GateHalf({ side, className }: { side: 'left' | 'right'; className?: string }) {
  return (
    <svg
      viewBox="0 -24 200 624"
      preserveAspectRatio={side === 'left' ? 'xMinYMax meet' : 'xMaxYMax meet'}
      aria-hidden
      className={cn(side === 'right' && '-scale-x-100', className)}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={OUTLINE} fill="currentColor" fillOpacity="0.07" />
        {LEDGES.map(([x, top, bottom]) => (
          <g key={top}>
            <path d={`M${x} ${top}H200M${x} ${bottom}H200`} strokeOpacity="0.7" />
            <path d={`M${x} ${top}c-6 -1 -10 -6 -8 -13c1 4 4 6 7 6`} />
          </g>
        ))}
        <path d="M24 360H200M24 472H200M12 540H200" strokeOpacity="0.7" />
        <rect x="58" y="384" width="108" height="70" rx="4" strokeOpacity="0.55" />
        <path d="M177 8c-7 -6 -6 -15 0 -24c6 9 7 18 0 24z" fill="currentColor" fillOpacity="0.35" />
      </g>
    </svg>
  );
}

/**
 * The attract screen stands in a split gate. On the landscape robot screens the halves rise
 * the full height at both edges; on the portrait totem they stand at the bottom, so the
 * buttons sit in the opening.
 */
export function Gate({ className }: { className?: string }) {
  const half =
    'pointer-events-none absolute bottom-0 h-full w-auto portrait:h-[42%] landscape:h-[86%]';
  return (
    <div aria-hidden className={cn('text-primary/45', className)}>
      <GateHalf side="left" className={cn(half, 'left-0')} />
      <GateHalf side="right" className={cn(half, 'right-0')} />
    </div>
  );
}
