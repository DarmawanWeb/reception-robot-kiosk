import { transliterate } from '@taksu/bali';
import { cn } from '@taksu/ui/lib/utils';

/** Signage Latin drops the é that only guides the Aksara spelling (Désa → DESA). */
export function signLatin(name: string): string {
  return name.replace(/é/g, 'e').replace(/É/g, 'E');
}

/**
 * Papan nama: the timber signboard every Balinese office and business carries, with the name
 * in Aksara Bali above the Latin name, as Pergub Bali 80/2018 asks.
 */
export function Signboard({
  name,
  size = 'md',
  as: Heading = 'p',
  className,
}: {
  name: string;
  size?: 'md' | 'lg';
  /** The kiosk header renders the name as the page heading. */
  as?: 'h1' | 'p';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'papan text-center',
        size === 'lg' ? 'px-8 pt-2 pb-4' : 'px-5 pt-1 pb-2.5',
        className,
      )}
    >
      <p
        aria-hidden
        lang="ban-Bali"
        className={cn(
          'aksara break-words',
          size === 'lg'
            ? 'text-[1.9rem] leading-[2] max-sm:text-[1.4rem]'
            : 'text-[1.3rem] leading-[1.9] portrait:text-[1.45rem]',
        )}
      >
        {transliterate(name)}
      </p>
      <Heading
        className={cn(
          'font-display font-bold tracking-[0.06em] text-balance break-words uppercase',
          size === 'lg'
            ? 'text-[1.55rem] leading-tight max-sm:text-[1.15rem]'
            : 'text-[1.15rem] leading-tight portrait:text-[1.3rem]',
        )}
      >
        {signLatin(name)}
      </Heading>
    </div>
  );
}
