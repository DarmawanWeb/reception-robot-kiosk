'use client';

import { transliterate } from '@taksu/bali';
import type { KioskSite, Locale } from '@taksu/content';
import { AksaraText } from '@taksu/ui/brand/aksara-text';
import { NameWriter } from '@taksu/ui/brand/name-writer';
import { Button } from '@taksu/ui/components/button';
import { Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PrintSlip, SlipHeader } from '../print/print-slip';

const dateFormat = (locale: Locale) =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  });

/** Type a name, see it in Aksara Bali, and take it home on a printed keepsake. */
export function AksaraView({ site, locale }: { site: KioskSite; locale: Locale }) {
  const t = useTranslations('Aksara');
  const [name, setName] = useState('');
  const [keepsake, setKeepsake] = useState<string | null>(null);
  const clean = name.trim();

  function printKeepsake() {
    setKeepsake(clean);
    window.setTimeout(() => window.print(), 1200);
  }

  return (
    <div className="grid items-start gap-8 landscape:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="flex max-w-[46rem] flex-col gap-6">
        <NameWriter
          size="lg"
          label={t('label')}
          placeholder={t('placeholder')}
          hint={t('hint')}
          emptyText={t('empty')}
          onValueChange={setName}
        />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button size="xl" disabled={!transliterate(clean)} onClick={printKeepsake}>
            <Printer aria-hidden />
            {t('print')}
          </Button>
        </div>
        <p className="bg-surface-muted text-muted-foreground rounded-lg p-4 text-[0.95rem]">
          {t('note')}
        </p>
      </div>
      {keepsake ? (
        <div className="portrait:justify-self-center">
          <PrintSlip>
            <SlipHeader siteName={site.name} />
            <p className="mt-4 text-[0.95rem] font-semibold">{t('keepsakeTitle')}</p>
            <AksaraText
              latin={keepsake}
              decorative
              className="mt-2 block text-[2.6rem] leading-[1.9] break-words"
            />
            <p className="font-display text-[1.7rem] leading-tight font-bold break-words">
              {keepsake}
            </p>
            <div className="ticket-rule my-4" />
            <p className="text-paper-muted text-[0.85rem]">
              {dateFormat(locale).format(new Date())}
            </p>
          </PrintSlip>
        </div>
      ) : null}
    </div>
  );
}
