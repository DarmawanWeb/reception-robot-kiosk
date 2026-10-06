'use client';

import { NameWriter } from '@taksu/ui/brand/name-writer';
import { useTranslations } from 'next-intl';

export function AksaraView() {
  const t = useTranslations('Aksara');
  return (
    <div className="max-w-3xl">
      <NameWriter
        size="lg"
        label={t('label')}
        placeholder={t('placeholder')}
        hint={t('hint')}
        emptyText={t('empty')}
      />
      <p className="bg-surface-muted text-muted-foreground mt-8 rounded-lg p-4 text-sm">
        {t('note')}
      </p>
    </div>
  );
}
