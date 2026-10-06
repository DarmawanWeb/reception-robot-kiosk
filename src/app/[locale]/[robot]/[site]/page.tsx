import { getRobot, getSite, kioskSites, robots } from '@taksu/content';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { KioskApp } from '@/features/kiosk/kiosk-app';
import { resolveLocale } from '@/lib/locale';

type Props = { params: Promise<{ locale: string; robot: string; site: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return robots.flatMap((robot) =>
    kioskSites.map((site) => ({ robot: robot.slug, site: site.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { robot: robotSlug, site: siteSlug } = await params;
  const robot = getRobot(robotSlug);
  const site = getSite(siteSlug);
  return robot && site ? { title: `${robot.name}, ${site.name}`, robots: { index: false } } : {};
}

export default async function KioskPage({ params }: Props) {
  const [, { robot: robotSlug, site: siteSlug }] = await Promise.all([
    resolveLocale(params),
    params,
  ]);
  const robot = getRobot(robotSlug);
  const site = getSite(siteSlug);
  if (!robot || !site) notFound();
  return <KioskApp robotSlug={robot.slug} siteSlug={site.slug} />;
}
