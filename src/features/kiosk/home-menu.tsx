'use client';

import type { ReceptionRobot } from '@taksu/content';
import {
  BookOpen,
  Flower2,
  Info,
  MessagesSquare,
  Mic,
  Network,
  NotebookPen,
  Route,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
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

export function HomeMenu({
  robot,
  views,
  onSelect,
}: {
  robot: ReceptionRobot;
  views: readonly MenuView[];
  onSelect: (view: MenuView) => void;
}) {
  const t = useTranslations('Kiosk.menu');
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {views.map((view, index) => {
        const Icon = icons[view];
        return (
          <li key={view}>
            <button
              type="button"
              onClick={() => onSelect(view)}
              className={
                index === 0
                  ? 'border-primary bg-surface active:bg-surface-muted flex h-full min-h-32 w-full items-start gap-4 rounded-xl border-2 p-5 text-left transition-colors'
                  : 'border-border bg-surface hover:border-primary active:bg-surface-muted flex h-full min-h-32 w-full items-start gap-4 rounded-xl border p-5 text-left transition-colors'
              }
            >
              <span className="bg-primary text-primary-foreground flex size-14 shrink-0 items-center justify-center rounded-full">
                <Icon className="size-7" aria-hidden />
              </span>
              <span>
                <span className="font-display block text-2xl leading-tight font-semibold">
                  {t(`${view}.title`, { robot: robot.name })}
                </span>
                <span className="text-muted-foreground mt-1 block">{t(`${view}.body`)}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
