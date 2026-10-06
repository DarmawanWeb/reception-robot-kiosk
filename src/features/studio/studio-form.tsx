'use client';

import { transliterate } from '@taksu/bali';
import { kioskSites, robots } from '@taksu/content';
import { RobotFace } from '@taksu/ui/brand/robot-face';
import { Button } from '@taksu/ui/components/button';
import { cn } from '@taksu/ui/lib/utils';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { useRouter } from '@/i18n/navigation';
import { menuViews, type MenuView } from '../kiosk/types';
import { defaultStudioConfig, STUDIO_KEY, type StudioConfig } from './studio-config';

/** Lets a prospect brand a kiosk with their own name and Aksara Bali sign. */
export function StudioForm() {
  const t = useTranslations('Studio');
  const tMenu = useTranslations('Kiosk.menu');
  const router = useRouter();
  const [config, setConfig] = useState<StudioConfig>(defaultStudioConfig);
  const update = (patch: Partial<StudioConfig>) =>
    setConfig((current) => ({ ...current, ...patch }));
  const robotName = robots.find((robot) => robot.slug === config.robot)?.name ?? '';

  function toggleView(view: MenuView) {
    update({
      views: config.views.includes(view)
        ? config.views.filter((entry) => entry !== view)
        : [...config.views, view],
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config.name.trim()) return;
    try {
      window.localStorage.setItem(
        STUDIO_KEY,
        JSON.stringify({ ...config, name: config.name.trim() }),
      );
    } catch {
      // Without storage the custom kiosk cannot load; the form stays on screen.
      return;
    }
    router.push(`/${config.robot}/custom`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col gap-8">
        <fieldset>
          <legend className="mb-3 text-lg font-semibold">{t('robot')}</legend>
          <div className="grid grid-cols-3 gap-3">
            {robots.map((robot) => (
              <label
                key={robot.slug}
                className={cn(
                  'bg-surface flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-3 text-center',
                  config.robot === robot.slug ? 'border-primary' : 'border-border',
                )}
              >
                <input
                  type="radio"
                  name="robot"
                  value={robot.slug}
                  checked={config.robot === robot.slug}
                  onChange={() => update({ robot: robot.slug })}
                  className="sr-only"
                />
                <RobotFace variant={robot.slug} label={robot.name} className="w-full" />
                <span className="font-semibold">{robot.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-2 font-semibold">
          {t('name')}
          <input
            value={config.name}
            maxLength={80}
            required
            onChange={(event) => update({ name: event.target.value })}
            className="border-border bg-surface h-12 rounded-md border px-4 text-lg"
          />
        </label>
        <label className="flex flex-col gap-2 font-semibold">
          {t('tagline')}
          <input
            value={config.tagline}
            maxLength={120}
            onChange={(event) => update({ tagline: event.target.value })}
            className="border-border bg-surface h-12 rounded-md border px-4"
          />
        </label>
        <label className="flex flex-col gap-2 font-semibold">
          {t('base')}
          <select
            value={config.base}
            onChange={(event) => update({ base: event.target.value })}
            className="border-border bg-surface h-12 rounded-md border px-4"
          >
            {kioskSites.map((site) => (
              <option key={site.slug} value={site.slug}>
                {site.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="mb-3 font-semibold">{t('features')}</legend>
          <div className="flex flex-wrap gap-2">
            {menuViews.map((view) => (
              <label
                key={view}
                className="border-border bg-surface has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={config.views.includes(view)}
                  onChange={() => toggleView(view)}
                  className="sr-only"
                />
                {tMenu(`${view}.title`, { robot: robotName })}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
        <div>
          <p className="mb-3 font-semibold">{t('signage')}</p>
          <div className="rounded-lg border-[6px] border-[#5b3b1e] bg-[#1c1712] px-6 py-6 text-center text-[#f3e3b8] shadow-[inset_0_0_0_2px_#8a6a3a]">
            <p lang="ban-Bali" className="aksara min-h-[2.3em] text-3xl break-words">
              {transliterate(config.name)}
            </p>
            <p className="font-display text-xl font-bold tracking-wide break-words uppercase">
              {config.name.replace(/é/gi, 'e')}
            </p>
          </div>
        </div>
        <Button type="submit" size="xl" disabled={!config.name.trim() || config.views.length === 0}>
          {t('open')}
        </Button>
      </div>
    </form>
  );
}
