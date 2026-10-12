'use client';

import { type KioskSite, type Locale, pick } from '@taksu/content';
import { AksaraText } from '@taksu/ui/brand/aksara-text';
import { useTranslations } from 'next-intl';

export function AboutView({ site, locale }: { site: KioskSite; locale: Locale }) {
  const t = useTranslations('About');
  return (
    <article className="max-w-3xl">
      <AksaraText latin={site.name} decorative className="text-primary block text-3xl" />
      <h1 className="font-display text-4xl font-bold [font-stretch:88%] md:text-5xl">
        {site.name}
      </h1>
      <p className="text-muted-foreground mt-2 text-xl font-semibold">
        {pick(site.tagline, locale)}
      </p>
      <p className="mt-6 text-xl leading-relaxed">{pick(site.about, locale)}</p>
      <h2 className="text-muted-foreground mt-10 text-lg font-semibold">{t('facts')}</h2>
      <dl className="divide-border border-border mt-3 divide-y border-y text-lg">
        {site.facts.map((fact) => (
          <div key={fact.label.en} className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr]">
            <dt className="text-muted-foreground">{pick(fact.label, locale)}</dt>
            <dd className="font-semibold">{pick(fact.value, locale)}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
