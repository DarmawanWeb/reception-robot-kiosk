'use client';

import { OM_SWASTIASTU } from '@taksu/bali';
import { type KioskSite, type Locale, pick } from '@taksu/content';
import { AksaraText } from '@taksu/ui/brand/aksara-text';

export function CultureView({ site, locale }: { site: KioskSite; locale: Locale }) {
  return (
    <div className="max-w-4xl">
      <div className="border-border bg-surface rounded-xl border p-6">
        <AksaraText
          aksara={OM_SWASTIASTU.aksara}
          decorative
          className="text-primary block text-3xl"
        />
        <p className="font-display text-3xl font-bold">{OM_SWASTIASTU.latin}</p>
        <p className="text-muted-foreground mt-1 text-lg">{OM_SWASTIASTU.meaning[locale]}</p>
      </div>
      <ul className="mt-6 grid gap-5 md:grid-cols-2">
        {site.culture.map((note) => (
          <li key={note.id} className="border-primary border-t-2 pt-4">
            <h2 className="text-xl font-semibold">{pick(note.title, locale)}</h2>
            <p className="text-muted-foreground mt-2 text-lg leading-relaxed">
              {pick(note.body, locale)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
