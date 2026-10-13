'use client';

import { type KioskSite, type Locale, pick } from '@taksu/content';
import { useTranslations } from 'next-intl';

/** The venue in a few lines. Its name is already on the signboard above. */
export function AboutView({ site, locale }: { site: KioskSite; locale: Locale }) {
  const t = useTranslations('About');
  return (
    <article className="max-w-[46rem]">
      <p className="font-display text-[1.6rem] leading-snug font-bold text-balance">
        {pick(site.tagline, locale)}
      </p>
      <p className="mt-4 text-[1.2rem] leading-relaxed">{pick(site.about, locale)}</p>
      <h3 className="mt-9 text-[1.1rem] font-bold">{t('facts')}</h3>
      <dl className="divide-border border-border mt-3 divide-y border-y text-[1.15rem]">
        {site.facts.map((fact) => (
          <div key={fact.label.en} className="grid gap-1 py-4 sm:grid-cols-[13rem_1fr]">
            <dt className="text-muted-foreground">{pick(fact.label, locale)}</dt>
            <dd className="font-semibold">{pick(fact.value, locale)}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
