import { getRobot, getSite, kioskSites, robots } from '@taksu/content';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { KioskApp } from '@/features/kiosk/kiosk-app';
import { CustomKiosk } from '@/features/studio/custom-kiosk';
import { resolveLocale } from '@/lib/locale';

type Props = { params: Promise<{ locale: string; robot: string; site: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return robots.flatMap((robot) => [
    ...kioskSites.map((site) => ({ robot: robot.slug, site: site.slug })),
    { robot: robot.slug, site: 'custom' },
  ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { robot: robotSlug, site: siteSlug } = await params;
  const robot = getRobot(robotSlug);
  const site = getSite(siteSlug);
  if (!robot) return {};
  return {
    title: site ? `${robot.name}, ${site.name}` : `${robot.name}, Studio`,
    robots: { index: false },
  };
}

export default async function KioskPage({ params }: Props) {
  const [, { robot: robotSlug, site: siteSlug }] = await Promise.all([
    resolveLocale(params),
    params,
  ]);
  const robot = getRobot(robotSlug);
  if (!robot) notFound();
  if (siteSlug === 'custom') {
    return (
      <Suspense fallback={<div className="bg-background h-dvh" />}>
        <CustomKiosk robotSlug={robot.slug} />
      </Suspense>
    );
  }
  const site = getSite(siteSlug);
  if (!site) notFound();
  return (
    <Suspense fallback={<div className="bg-background h-dvh" />}>
      <KioskApp robotSlug={robot.slug} site={site} />
    </Suspense>
  );
}
