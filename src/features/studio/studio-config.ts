import { getRobot, getSite, type KioskSite, type RobotSlug, robots } from '@taksu/content';
import { type MenuView, menuViews } from '../kiosk/types';

export const STUDIO_KEY = 'taksu-kiosk:studio';

export interface StudioConfig {
  robot: RobotSlug;
  base: string;
  name: string;
  tagline: string;
  views: MenuView[];
}

export const defaultStudioConfig: StudioConfig = {
  robot: 'kiosk',
  base: 'kantor-layanan',
  name: 'Kantor Désa Taman Sari',
  tagline: '',
  views: [...menuViews],
};

/** Validates a stored Studio config; anything malformed is treated as absent. */
export function parseStudioConfig(raw: string | null): StudioConfig | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StudioConfig>;
    const robot = robots.find((entry) => entry.slug === value.robot)?.slug;
    const name = typeof value.name === 'string' ? value.name.trim().slice(0, 80) : '';
    if (!robot || !name || typeof value.base !== 'string' || !getSite(value.base)) return null;
    const views = Array.isArray(value.views)
      ? menuViews.filter((view) => (value.views as string[]).includes(view))
      : [...menuViews];
    return {
      robot,
      base: value.base,
      name,
      tagline: typeof value.tagline === 'string' ? value.tagline.slice(0, 120) : '',
      views: views.length > 0 ? views : [...menuViews],
    };
  } catch {
    return null;
  }
}

/** Sample venue re-labelled with the visitor's own name and tagline. */
export function buildCustomSite(config: StudioConfig): KioskSite | null {
  const base = getSite(config.base);
  if (!base || !getRobot(config.robot)) return null;
  const tagline = config.tagline.trim();
  return {
    ...base,
    name: config.name,
    tagline: tagline ? { id: tagline, en: tagline } : base.tagline,
    isSample: true,
  };
}
