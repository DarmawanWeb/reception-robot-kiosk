'use client';

import { transliterate } from '@taksu/bali';
import { flattenOrganization, pick, type KioskSite, type Locale } from '@taksu/content';
import { AksaraText } from '@taksu/ui/brand/aksara-text';
import { Button } from '@taksu/ui/components/button';
import { Printer, Route } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { formatWitaTime } from '../kiosk/hooks';
import type { KioskActions } from '../kiosk/types';
import { PrintSlip, QrImage } from '../print/print-slip';
import {
  counterKey,
  nextSequence,
  passId,
  passQrPayload,
  type VisitPurpose,
  type VisitorPass,
} from './guestbook';

const purposes: VisitPurpose[] = ['meet', 'service', 'visit', 'delivery', 'other'];

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable; the pass is still valid for this session.
  }
}

export function GuestbookView({
  site,
  locale,
  actions,
  onDone,
}: {
  site: KioskSite;
  locale: Locale;
  actions: KioskActions;
  onDone: () => void;
}) {
  const t = useTranslations('Guestbook');
  const [pass, setPass] = useState<VisitorPass | null>(null);
  const [error, setError] = useState<string | null>(null);
  const members = flattenOrganization(site.organization);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const purpose = String(data.get('purpose') ?? '') as VisitPurpose;
    if (!name || !purposes.includes(purpose)) {
      setError(t('required'));
      return;
    }
    const now = new Date();
    const key = counterKey(site.slug, now);
    const sequence = nextSequence(readStorage(key));
    writeStorage(key, String(sequence));
    const hostId = String(data.get('host') ?? '') || null;
    const issued: VisitorPass = {
      id: passId(now, sequence),
      name,
      origin: String(data.get('origin') ?? '').trim(),
      purpose,
      hostId,
      issuedAt: now.getTime(),
    };
    setError(null);
    setPass(issued);
    actions.setMood('happy');
    actions.say(t('thanks', { name }));
  }

  if (pass) {
    const host = members.find((member) => member.id === pass.hostId);
    const room = site.map.rooms.find((entry) => entry.id === host?.roomId);
    return (
      <div className="flex flex-col items-start gap-6">
        <PrintSlip>
          <AksaraText latin={site.name} decorative className="text-primary block text-sm" />
          <p className="font-semibold">{site.name}</p>
          <p className="font-display mt-3 text-xl font-bold">{t('passTitle')}</p>
          <AksaraText
            aksara={transliterate(pass.name)}
            decorative
            className="mt-2 block text-3xl"
          />
          <p className="font-display text-3xl font-bold break-words">{pass.name}</p>
          {pass.origin ? <p className="text-muted-foreground">{pass.origin}</p> : null}
          <dl className="mt-4 space-y-1 text-sm">
            <div>
              <dt className="inline font-semibold">{t('purpose')}: </dt>
              <dd className="inline">{t(`purposes.${pass.purpose}`)}</dd>
            </div>
            {host ? (
              <div>
                <dt className="inline font-semibold">{t('host')}: </dt>
                <dd className="inline">
                  {host.name}, {pick(host.role, locale)}
                </dd>
              </div>
            ) : null}
            {room ? (
              <div>
                <dt className="inline font-semibold">{t('room')}: </dt>
                <dd className="inline">{pick(room.name, locale)}</dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-4">
            <QrImage value={passQrPayload(pass, site.slug)} label={`${t('passId')} ${pass.id}`} />
          </div>
          <p className="mt-2 font-mono text-sm font-semibold tracking-wide">{pass.id}</p>
          <p className="text-muted-foreground text-xs">
            {t('issued', { time: formatWitaTime(pass.issuedAt, locale) })}
          </p>
          <p className="text-muted-foreground mt-3 text-xs">{t('returnNote')}</p>
        </PrintSlip>
        <div className="flex flex-wrap gap-3">
          <Button size="xl" onClick={() => window.print()}>
            <Printer aria-hidden />
            {t('print')}
          </Button>
          {room ? (
            <Button size="xl" variant="outline" onClick={() => actions.guideTo(room.id)}>
              <Route aria-hidden />
              {t('guide', { room: pick(room.name, locale) })}
            </Button>
          ) : null}
          <Button size="xl" variant="ghost" onClick={onDone}>
            {t('done')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-2xl flex-col gap-5">
      <p className="text-muted-foreground">{t('intro')}</p>
      <label className="flex flex-col gap-2 text-lg font-semibold">
        {t('name')}
        <input
          name="name"
          required
          autoComplete="name"
          className="border-border bg-surface h-14 rounded-md border px-4 text-xl"
        />
      </label>
      <label className="flex flex-col gap-2 text-lg font-semibold">
        {t('origin')}
        <input
          name="origin"
          autoComplete="organization"
          className="border-border bg-surface h-14 rounded-md border px-4 text-xl"
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-lg font-semibold">{t('purpose')}</legend>
        <div className="flex flex-wrap gap-2">
          {purposes.map((purpose, index) => (
            <label
              key={purpose}
              className="border-border bg-surface has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground flex min-h-12 cursor-pointer items-center gap-2 rounded-full border px-4"
            >
              <input
                type="radio"
                name="purpose"
                value={purpose}
                defaultChecked={index === 0}
                className="sr-only"
              />
              {t(`purposes.${purpose}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-2 text-lg font-semibold">
        {t('host')}
        <select
          name="host"
          className="border-border bg-surface h-14 rounded-md border px-4 text-lg"
        >
          <option value="">{t('hostUnknown')}</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}, {pick(member.role, locale)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-lg font-semibold">
        {t('phone')}
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className="border-border bg-surface h-14 rounded-md border px-4 text-xl"
        />
      </label>
      {error ? (
        <p role="alert" className="text-danger font-semibold">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="xl" className="self-start">
        <Printer aria-hidden />
        {t('submit')}
      </Button>
    </form>
  );
}
