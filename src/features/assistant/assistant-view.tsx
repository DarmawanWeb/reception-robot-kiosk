'use client';

import { type KioskSite, type Locale, pick, type ReceptionRobot } from '@taksu/content';
import { Button } from '@taksu/ui/components/button';
import { cn } from '@taksu/ui/lib/utils';
import { Route, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { KioskActions } from '../kiosk/types';
import { askAssistant } from './ask';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  roomId?: string;
  offline?: boolean;
}

/** Text chat with the robot, grounded in the venue data. */
export function AssistantView({
  robot,
  site,
  siteName,
  locale,
  actions,
}: {
  robot: ReceptionRobot;
  site: KioskSite;
  siteName?: string;
  locale: Locale;
  actions: KioskActions;
}) {
  const t = useTranslations('Assistant');
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', content: pick(robot.persona.greeting, locale) },
  ]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const listEnd = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to the newest message whenever the list changes
  useEffect(() => {
    listEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, pending]);

  async function ask(question: string) {
    const content = question.trim();
    if (!content || pending) return;
    const history = [...messages, { id: nextId.current++, role: 'user' as const, content }];
    setMessages(history);
    setDraft('');
    setPending(true);
    actions.setMood('thinking');
    const result = await askAssistant({
      robot: robot.slug,
      site: site.slug,
      siteName,
      locale,
      messages: history.map(({ role, content: text }) => ({ role, content: text })),
    });
    setPending(false);
    if (!result.ok) {
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: 'assistant',
          content: result.reason === 'rate_limited' ? t('rateLimited') : t('error'),
        },
      ]);
      actions.setMood('idle');
      return;
    }
    setMessages((current) => [
      ...current,
      {
        id: nextId.current++,
        role: 'assistant',
        content: result.reply,
        roomId: result.roomId,
        offline: result.source === 'offline',
      },
    ]);
    actions.say(result.reply);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  const roomName = (roomId: string) => {
    const room = site.map.rooms.find((entry) => entry.id === roomId);
    return room ? pick(room.name, locale) : roomId;
  };

  return (
    <div className="flex min-h-[24rem] flex-1 flex-col gap-4">
      <ol aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {messages.map((message) => (
          <li
            key={message.id}
            className={cn(
              'flex max-w-[85%] flex-col gap-2',
              message.role === 'user' ? 'items-end self-end' : 'self-start',
            )}
          >
            <span className="text-muted-foreground text-[0.85rem] font-semibold">
              {message.role === 'user' ? t('you') : robot.name}
            </span>
            <p
              className={cn(
                'rounded-xl px-4 py-3 text-[1.15rem] leading-relaxed',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'border-border bg-surface border',
              )}
            >
              {message.content}
            </p>
            {message.roomId ? (
              <Button variant="outline" onClick={() => actions.guideTo(message.roomId as string)}>
                <Route aria-hidden />
                {t('takeMe', { room: roomName(message.roomId) })}
              </Button>
            ) : null}
            {message.offline ? (
              <span className="text-muted-foreground text-[0.85rem]">{t('offline')}</span>
            ) : null}
          </li>
        ))}
        {pending ? (
          <li className="text-muted-foreground self-start text-[1.1rem]">
            {t('thinking', { robot: robot.name })}
          </li>
        ) : null}
        <div ref={listEnd} />
      </ol>
      <div>
        <p className="text-muted-foreground mb-2.5 text-[0.95rem] font-semibold">
          {t('suggestions')}
        </p>
        <ul className="flex flex-wrap gap-2">
          {site.faq.slice(0, 4).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => void ask(pick(item.question, locale))}
                className="border-border bg-surface hover:border-primary min-h-11 rounded-full border-2 px-4 py-2 text-left text-[0.95rem] font-semibold disabled:opacity-50"
              >
                {pick(item.question, locale)}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={500}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          className="border-border bg-surface focus-visible:border-primary h-16 min-w-0 flex-1 rounded-md border-2 px-4 text-[1.15rem]"
        />
        <Button type="submit" size="xl" disabled={pending || !draft.trim()}>
          <Send aria-hidden />
          <span className="max-sm:sr-only">{t('send')}</span>
        </Button>
      </form>
    </div>
  );
}
