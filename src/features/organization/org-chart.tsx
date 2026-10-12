'use client';

import {
  flattenOrganization,
  type KioskSite,
  type Locale,
  type OrgNode,
  pick,
} from '@taksu/content';
import { Button } from '@taksu/ui/components/button';
import { cn } from '@taksu/ui/lib/utils';
import { Route } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

/** Initials from the personal name, ignoring degrees after the comma. */
function initials(name: string): string {
  const words = (name.split(',')[0] ?? name).trim().split(/\s+/);
  return words
    .slice(-2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

function MemberButton({
  member,
  locale,
  selected,
  onSelect,
  compact = false,
}: {
  member: OrgNode;
  locale: Locale;
  selected: boolean;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(member.id)}
      className={cn(
        'bg-surface flex w-full items-center gap-3 rounded-lg border text-left transition-colors',
        compact ? 'p-2.5' : 'p-3.5',
        selected ? 'border-primary ring-primary/40 ring-2' : 'border-border hover:border-primary',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full font-bold',
          compact ? 'size-9 text-xs' : 'size-11 text-sm',
        )}
      >
        {initials(member.name)}
      </span>
      <span className="min-w-0">
        <span className={cn('block font-semibold', compact ? 'text-sm' : 'text-base')}>
          {member.name}
        </span>
        <span className="text-muted-foreground block text-sm">{pick(member.role, locale)}</span>
      </span>
    </button>
  );
}

export function OrgChart({
  site,
  locale,
  onGuide,
}: {
  site: KioskSite;
  locale: Locale;
  onGuide: (roomId: string) => void;
}) {
  const t = useTranslations('Organization');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const root = site.organization;
  const children = root.children ?? [];
  const selected = flattenOrganization(root).find((member) => member.id === selectedId);
  const room = site.map.rooms.find((entry) => entry.id === selected?.roomId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center">
        <div className="w-full max-w-sm">
          <MemberButton
            member={root}
            locale={locale}
            selected={selectedId === root.id}
            onSelect={setSelectedId}
          />
        </div>
        <div aria-hidden className="bg-border h-6 w-px" />
        <div
          aria-hidden
          className="bg-border hidden h-px md:block"
          style={{ width: `${((children.length - 1) / children.length) * 100}%` }}
        />
        <ul
          className="grid w-full gap-6 md:[grid-template-columns:repeat(var(--columns),minmax(0,1fr))]"
          style={{ '--columns': children.length } as React.CSSProperties}
        >
          {children.map((child) => (
            <li key={child.id} className="flex flex-col items-center">
              <div aria-hidden className="bg-border hidden h-6 w-px md:block" />
              <div className="w-full">
                <MemberButton
                  member={child}
                  locale={locale}
                  selected={selectedId === child.id}
                  onSelect={setSelectedId}
                />
              </div>
              {child.children?.length ? (
                <ul className="border-border mt-3 flex w-full flex-col gap-2 border-l-2 pl-3">
                  {child.children.map((grandchild) => (
                    <li key={grandchild.id}>
                      <MemberButton
                        compact
                        member={grandchild}
                        locale={locale}
                        selected={selectedId === grandchild.id}
                        onSelect={setSelectedId}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div aria-live="polite" className="border-border bg-surface-muted rounded-xl border p-5">
        {selected ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xl font-semibold">{selected.name}</p>
              <p className="text-muted-foreground">{pick(selected.role, locale)}</p>
              {room ? (
                <p className="mt-1">
                  {t('room')}: <span className="font-semibold">{pick(room.name, locale)}</span>
                </p>
              ) : null}
            </div>
            {room ? (
              <Button size="lg" onClick={() => onGuide(room.id)}>
                <Route aria-hidden />
                {t('takeMe')}
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground">{t('select')}</p>
        )}
      </div>
    </div>
  );
}
