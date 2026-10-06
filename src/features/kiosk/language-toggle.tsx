'use client';

import { localeLabels, locales } from '@taksu/content';
import { cn } from '@taksu/ui/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';

/** Big two-button language switch; tourists choose language before anything else. */
export function LanguageToggle({ className }: { className?: string }) {
  const t = useTranslations('Kiosk');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="group"
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
          onClick={() => startTransition(() => router.replace(pathname, { locale: option }))}
          className={cn(
            'h-10 min-w-12 rounded-sm px-3 text-sm font-bold uppercase transition-colors',
            option === locale ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
