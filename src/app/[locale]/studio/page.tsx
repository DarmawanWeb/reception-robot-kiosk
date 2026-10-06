import { PolengBand } from '@taksu/ui/brand/ornaments';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { StudioForm } from '@/features/studio/studio-form';
import { Link } from '@/i18n/navigation';
import { localeFromParams, resolveLocale } from '@/lib/locale';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params);
  const t = await getTranslations({ locale, namespace: 'Studio' });
  return { title: t('metaTitle'), robots: { index: false } };
}

export default async function StudioPage({ params }: Props) {
  await resolveLocale(params);
  const t = await getTranslations('Studio');
  return (
    <div className="min-h-dvh">
      <PolengBand />
      <main className="mx-auto max-w-6xl px-5 pt-8 pb-20 sm:px-8">
        <Link href="/" className="text-muted-foreground hover:text-primary text-sm font-semibold">
          {t('back')}
        </Link>
        <h1 className="mt-4 text-4xl font-bold tracking-tight [font-stretch:85%] sm:text-5xl">
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl text-lg">{t('intro')}</p>
        <div className="mt-10">
          <StudioForm />
        </div>
      </main>
    </div>
  );
}
