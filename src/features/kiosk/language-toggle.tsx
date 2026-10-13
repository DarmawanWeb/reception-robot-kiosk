'use client';

import { type Locale, localeLabels, locales } from '@taksu/content';
import { cn } from '@taksu/ui/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';

/**
 * Two-button language switch. The query string goes along (the kiosk keeps the open screen
 * in it), so a visitor who switches language in the middle of a task stays where they are.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const t = useTranslations('Kiosk');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function switchTo(option: Locale) {
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
    startTransition(() => router.replace({ pathname, query }, { locale: option }));
  }

  return (
    <fieldset
      aria-label={t('language')}
      className={cn('bg-surface-muted flex rounded-md p-1', className)}
    >
      {locales.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          title={localeLabels[option]}
          aria-pressed={option === locale}
          disabled={pending}
          onClick={() => switchTo(option)}
          className={cn(
            'h-10 min-w-12 rounded-sm px-3 text-[0.95rem] font-bold uppercase transition-colors',
            option === locale ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
          )}
        >
          {option}
        </button>
      ))}
    </fieldset>
  );
}
