import { kioskSites, pick, robots } from '@taksu/content';
import { Logo } from '@taksu/ui/brand/logo';
import { PolengBand } from '@taksu/ui/brand/ornaments';
import { RobotFace } from '@taksu/ui/brand/robot-face';
import { Badge } from '@taksu/ui/components/badge';
import { Button } from '@taksu/ui/components/button';
import { cn } from '@taksu/ui/lib/utils';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import snowTimo from '@/assets/snow-timo-bali.webp';
import { LanguageToggle } from '@/features/kiosk/language-toggle';
import { Link } from '@/i18n/navigation';
import { resolveLocale } from '@/lib/locale';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Demo launcher: every robot at every sample venue, plus the Studio. */
export default async function LauncherPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getTranslations('Launcher');

  return (
    <div className="min-h-dvh">
      <PolengBand />
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <a href={`${siteUrl}/${locale}/reception`} aria-label={t('backToSite')}>
          <Logo />
        </a>
        <LanguageToggle />
      </header>
      <main className="mx-auto max-w-6xl px-5 pt-6 pb-20 sm:px-8">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight [font-stretch:85%] sm:text-5xl">
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg">{t('intro')}</p>
        <div className="border-border mt-10 overflow-hidden rounded-xl border">
          <Image
            src={snowTimo}
            alt="Snow & Timo"
            priority
            placeholder="blur"
            sizes="(min-width: 1152px) 72rem, 100vw"
            className="h-auto max-h-[28rem] w-full object-cover"
          />
        </div>
        <ul className="mt-10 grid gap-6 lg:grid-cols-3">
          {robots.map((robot) => (
            <li
              key={robot.slug}
              className={cn(
                robot.slug !== 'snow' && 'dark',
                'border-border bg-background text-foreground flex flex-col rounded-xl border p-6',
              )}
            >
              <RobotFace variant={robot.slug} label={robot.name} className="max-w-56" />
              <h2 className="mt-6 text-3xl font-bold [font-stretch:85%]">{robot.name}</h2>
              <p className="text-muted-foreground text-sm font-semibold">
                {pick(robot.edition, locale)}
              </p>
              <p className="text-primary mt-1 font-semibold">{pick(robot.tagline, locale)}</p>
              <p className="text-muted-foreground mt-3 flex-1 text-sm">
                {pick(robot.summary, locale)}
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {kioskSites.map((site) => (
                  <li key={site.slug}>
                    <Button
                      asChild
                      size="lg"
                      variant={site.slug === robot.demoSite ? 'default' : 'outline'}
                      className="w-full justify-between"
                    >
                      <Link href={`/${robot.slug}/${site.slug}`}>
                        {t('openAt', { site: site.name })}
                        {site.slug === robot.demoSite ? (
                          <Badge variant="gold">{t('recommended')}</Badge>
                        ) : null}
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="border-border bg-surface mt-10 flex flex-col gap-4 rounded-xl border p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{t('studioTitle')}</h2>
            <p className="text-muted-foreground mt-1">{t('studioBody')}</p>
          </div>
          <Button asChild size="lg">
            <Link href="/studio">{t('studioCta')}</Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-10 text-sm">{t('tip')}</p>
        <p className="text-muted-foreground mt-2 text-sm">{t('sampleNote')}</p>
      </main>
    </div>
  );
}
