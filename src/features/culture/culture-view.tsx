'use client';

import { OM_SWASTIASTU } from '@taksu/bali';
import { type KioskSite, type Locale, pick } from '@taksu/content';
import { AksaraText } from '@taksu/ui/brand/aksara-text';

export function CultureView({ site, locale }: { site: KioskSite; locale: Locale }) {
  return (
    <div className="flex max-w-[54rem] flex-col gap-8">
      <div>
        <AksaraText
          aksara={OM_SWASTIASTU.aksara}
          decorative
          className="text-primary block text-[2.1rem] leading-[1.9]"
        />
        <p className="font-display text-[2.3rem] leading-none font-bold [font-stretch:88%]">
          {OM_SWASTIASTU.latin}
        </p>
        <p className="text-muted-foreground mt-2 text-[1.15rem]">{OM_SWASTIASTU.meaning[locale]}</p>
      </div>
      <ul className="grid gap-x-10 gap-y-7 landscape:grid-cols-2">
        {site.culture.map((note) => (
          <li key={note.id} className="border-primary border-t-2 pt-4">
            <h3 className="text-[1.3rem] leading-tight font-bold">{pick(note.title, locale)}</h3>
            <p className="text-muted-foreground mt-2 text-[1.1rem] leading-relaxed">
              {pick(note.body, locale)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
