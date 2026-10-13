import { getRobot, getSite, kioskSites, robots } from '@taksu/content';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { LanguageToggle } from '@/features/kiosk/language-toggle';
import { TotemFrame } from '@/features/preview/totem-frame';
import { Link } from '@/i18n/navigation';
import { localeFromParams, resolveLocale } from '@/lib/locale';

type Props = { params: Promise<{ locale: string; robot: string; site: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return robots.flatMap((robot) =>
    kioskSites.map((site) => ({ robot: robot.slug, site: site.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [locale, { robot: robotSlug, site: siteSlug }] = await Promise.all([
    localeFromParams(params),
    params,
  ]);
  const robot = getRobot(robotSlug);
  const site = getSite(siteSlug);
  if (!robot || !site) return {};
  const t = await getTranslations({ locale, namespace: 'Preview' });
  return { title: t('title', { robot: robot.name, site: site.name }), robots: { index: false } };
}

/** The portrait kiosk shown at its real 1080×1920 layout, standing in its totem. */
export default async function PreviewPage({ params }: Props) {
  const [locale, { robot: robotSlug, site: siteSlug }] = await Promise.all([
    resolveLocale(params),
    params,
  ]);
  const robot = getRobot(robotSlug);
  const site = getSite(siteSlug);
  if (!robot || !site) notFound();
  const t = await getTranslations('Preview');

  return (
    <div className="flex min-h-dvh flex-col items-center px-5 pt-4 pb-8">
      <header className="flex w-full max-w-5xl items-center justify-between gap-4">
        <Link href="/" className="text-muted-foreground hover:text-primary text-sm font-semibold">
          {t('back')}
        </Link>
        <p className="text-muted-foreground hidden text-sm md:block">{t('hint')}</p>
        <LanguageToggle />
      </header>
      <div className="mt-6">
        <TotemFrame
          src={`/${locale}/${robot.slug}/${site.slug}`}
          title={t('title', { robot: robot.name, site: site.name })}
        />
      </div>
    </div>
  );
}
