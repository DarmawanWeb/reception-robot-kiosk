'use client';

import type { ReceptionRobot } from '@taksu/content';
import { cn } from '@taksu/ui/lib/utils';
import {
  BookOpen,
  ChevronRight,
  Flower2,
  Info,
  type LucideIcon,
  MessagesSquare,
  Mic,
  Network,
  NotebookPen,
  Route,
  Ticket,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import type { MenuView } from './types';

const icons: Record<MenuView, LucideIcon> = {
  voice: Mic,
  queue: Ticket,
  guestbook: NotebookPen,
  wayfinding: Route,
  assistant: MessagesSquare,
  about: Info,
  organization: Network,
  aksara: BookOpen,
  culture: Flower2,
};

/** The first four menus are the errands people come for; the rest sit below as a list. */
const PRIMARY_COUNT = 4;

export function HomeMenu({
  robot,
  views,
  onSelect,
}: {
  robot: ReceptionRobot;
  views: readonly MenuView[];
  onSelect: (view: MenuView) => void;
}) {
  const t = useTranslations('Kiosk');
  const primary = views.slice(0, PRIMARY_COUNT);
  const secondary = views.slice(PRIMARY_COUNT);
  const title = (view: MenuView) => t(`menu.${view}.title`, { robot: robot.name });

  return (
    <nav aria-labelledby="menu-title" className="flex flex-col gap-5">
      <h2
        id="menu-title"
        className="font-display text-[2rem] leading-tight font-bold [font-stretch:90%]"
      >
        {t('homeTitle')}
      </h2>
      <ul className="grid grid-cols-2 gap-4">
        {primary.map((view, index) => {
          const Icon = icons[view];
          return (
            <li key={view}>
              <button
                type="button"
                onClick={() => onSelect(view)}
                className={cn(
                  'flex h-full min-h-[10.5rem] w-full flex-col justify-between gap-5 rounded-xl border-2 p-5 text-left transition-colors portrait:min-h-[10.5rem] portrait:p-6',
                  index === 0
                    ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/92'
                    : 'border-border bg-surface hover:border-primary active:bg-surface-muted',
                )}
              >
                <Icon
                  aria-hidden
                  strokeWidth={1.75}
                  className={cn('size-[2.6rem]', index === 0 ? '' : 'text-primary')}
                />
                <span>
                  <span className="font-display block text-[1.6rem] leading-[1.15] font-bold">
                    {title(view)}
                  </span>
                  <span
                    className={cn(
                      'mt-1.5 block text-[1rem] leading-snug',
                      index === 0 ? 'opacity-85' : 'text-muted-foreground',
                    )}
                  >
                    {t(`menu.${view}.body`)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {secondary.length > 0 ? (
        <ul
          className="grid gap-3 landscape:grid-cols-[repeat(var(--count),minmax(0,1fr))]"
          style={{ '--count': secondary.length } as CSSProperties}
        >
          {secondary.map((view) => {
            const Icon = icons[view];
            return (
              <li key={view}>
                <button
                  type="button"
                  onClick={() => onSelect(view)}
                  className="border-border bg-surface hover:border-primary active:bg-surface-muted flex h-full min-h-[3.9rem] w-full items-center gap-4 rounded-lg border-2 px-4 py-2.5 text-left transition-colors"
                >
                  <Icon aria-hidden strokeWidth={1.75} className="text-primary size-7 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1.1rem] leading-tight font-bold">
                      {title(view)}
                    </span>
                    <span className="text-muted-foreground mt-0.5 block text-[0.95rem] leading-snug landscape:hidden">
                      {t(`menu.${view}.body`)}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="text-muted-foreground size-6 shrink-0 landscape:hidden"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </nav>
  );
}
