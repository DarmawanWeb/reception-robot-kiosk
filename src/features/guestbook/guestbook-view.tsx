'use client';

import { transliterate } from '@taksu/bali';
import { flattenOrganization, type KioskSite, type Locale, pick } from '@taksu/content';
import { AksaraText } from '@taksu/ui/brand/aksara-text';
import { Button } from '@taksu/ui/components/button';
import { Check, Printer, Route } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { formatWitaTime } from '../kiosk/hooks';
import type { KioskActions } from '../kiosk/types';
import { PrintSlip, QrImage, SlipHeader } from '../print/print-slip';
import {
  counterKey,
  nextSequence,
  passId,
  passQrPayload,
  type VisitorPass,
  type VisitPurpose,
} from './guestbook';

const purposes: VisitPurpose[] = ['meet', 'service', 'visit', 'delivery', 'other'];

const fieldClass =
  'border-border bg-surface focus-visible:border-primary h-[3.75rem] w-full rounded-md border-2 px-4 text-[1.2rem] font-normal';
const labelClass = 'flex flex-col gap-2 text-[1.1rem] font-bold';

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
      <div className="grid items-start gap-8 landscape:grid-cols-[21rem_minmax(0,1fr)] portrait:justify-items-center">
        <PrintSlip>
          <SlipHeader siteName={site.name} />
          <p className="mt-4 text-[0.95rem] font-semibold">{t('passTitle')}</p>
          <AksaraText
            aksara={transliterate(pass.name)}
            decorative
            className="mt-1 block text-[1.9rem] leading-[1.9] break-words"
          />
          <p className="font-display text-[1.9rem] leading-tight font-bold break-words">
            {pass.name}
          </p>
          {pass.origin ? <p className="text-paper-muted text-[0.95rem]">{pass.origin}</p> : null}
          <div className="ticket-rule my-4" />
          <dl className="space-y-1 text-left text-[0.95rem]">
            <div>
              <dt className="inline font-bold">{t('purpose')}: </dt>
              <dd className="inline">{t(`purposes.${pass.purpose}`)}</dd>
            </div>
            {host ? (
              <div>
                <dt className="inline font-bold">{t('host')}: </dt>
                <dd className="inline">
                  {host.name}, {pick(host.role, locale)}
                </dd>
              </div>
            ) : null}
            {room ? (
              <div>
                <dt className="inline font-bold">{t('room')}: </dt>
                <dd className="inline">{pick(room.name, locale)}</dd>
              </div>
            ) : null}
          </dl>
          <div className="mt-4">
            <QrImage
              value={passQrPayload(pass, site.slug)}
              size={104}
              label={`${t('passId')} ${pass.id}`}
            />
          </div>
          <p className="mt-1 text-[0.95rem] font-bold tracking-wide tabular-nums">{pass.id}</p>
          <p className="text-paper-muted text-[0.8rem]">
            {t('issued', { time: formatWitaTime(pass.issuedAt, locale) })}
          </p>
          <p className="text-paper-muted mt-2 text-[0.8rem]">{t('returnNote')}</p>
        </PrintSlip>

        <div className="flex flex-col gap-6 portrait:items-center portrait:text-center">
          <div>
            <p className="font-display text-[2rem] leading-tight font-bold">
              {t('readyTitle', { name: pass.name })}
            </p>
            <p className="text-muted-foreground mt-2 max-w-[28rem] text-[1.15rem]">
              {t('readyBody')}
            </p>
          </div>
          <div className="flex flex-col gap-3 landscape:max-w-[22rem] portrait:w-full portrait:max-w-[24rem]">
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
              <Check aria-hidden />
              {t('done')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-[44rem] flex-col gap-6">
      <div className="grid gap-6 landscape:grid-cols-2">
        <label className={labelClass}>
          {t('name')}
          <input name="name" required autoComplete="name" className={fieldClass} />
        </label>
        <label className={labelClass}>
          {t('origin')}
          <input name="origin" autoComplete="organization" className={fieldClass} />
        </label>
      </div>
      <fieldset>
        <legend className="mb-2.5 text-[1.1rem] font-bold">{t('purpose')}</legend>
        <div className="flex flex-wrap gap-2.5">
          {purposes.map((purpose, index) => (
            <label
              key={purpose}
              className="border-border bg-surface has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:outline-ring flex min-h-[3.25rem] cursor-pointer items-center rounded-full border-2 px-5 text-[1.05rem] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
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
      <div className="grid gap-6 landscape:grid-cols-2">
        <label className={labelClass}>
          {t('host')}
          <select name="host" className={fieldClass}>
            <option value="">{t('hostUnknown')}</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}, {pick(member.role, locale)}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          {t('phone')}
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={fieldClass}
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-danger text-[1.05rem] font-bold">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button type="submit" size="xl">
          <Printer aria-hidden />
          {t('submit')}
        </Button>
        <p className="text-muted-foreground text-[0.95rem]">{t('intro')}</p>
      </div>
    </form>
  );
}
