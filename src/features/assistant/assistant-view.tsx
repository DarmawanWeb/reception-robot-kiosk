'use client';

import { pick, type CommercialRobot, type KioskSite, type Locale } from '@taksu/content';
import { Button } from '@taksu/ui/components/button';
import { cn } from '@taksu/ui/lib/utils';
import { Mic, MicOff, Route, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { KioskActions } from '../kiosk/types';
import { listenOnce, useSpeechSupport } from '../kiosk/speech';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  roomId?: string;
  offline?: boolean;
}

interface AssistantResponse {
  reply: string;
  source: 'model' | 'offline';
  action?: { type: 'navigate'; roomId: string };
}

export function AssistantView({
  robot,
  site,
  locale,
  actions,
}: {
  robot: CommercialRobot;
  site: KioskSite;
  locale: Locale;
  actions: KioskActions;
}) {
  const t = useTranslations('Assistant');
  const support = useSpeechSupport();
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', content: pick(robot.persona.greeting, locale) },
  ]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [listening, setListening] = useState(false);
  const stopListening = useRef<(() => void) | null>(null);
  const listEnd = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    listEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, pending]);

  useEffect(() => () => stopListening.current?.(), []);

  async function ask(question: string) {
    const content = question.trim();
    if (!content || pending) return;
    const history = [...messages, { id: nextId.current++, role: 'user' as const, content }];
    setMessages(history);
    setDraft('');
    setPending(true);
    actions.setMood('thinking');

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          robot: robot.slug,
          site: site.slug,
          locale,
          messages: history.map(({ role, content: text }) => ({ role, content: text })),
        }),
      });
      if (!response.ok) throw new Error(`Assistant responded ${response.status}`);
      const data = (await response.json()) as AssistantResponse;
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: 'assistant',
          content: data.reply,
          roomId: data.action?.roomId,
          offline: data.source === 'offline',
        },
      ]);
      actions.say(data.reply);
    } catch {
      setMessages((current) => [
        ...current,
        { id: nextId.current++, role: 'assistant', content: t('error') },
      ]);
      actions.setMood('idle');
    } finally {
      setPending(false);
    }
  }

  function toggleListening() {
    if (listening) {
      stopListening.current?.();
      return;
    }
    setListening(true);
    actions.setMood('listening');
    stopListening.current = listenOnce(locale, {
      onResult: (transcript) => void ask(transcript),
      onEnd: () => {
        setListening(false);
        stopListening.current = null;
      },
    });
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
    <div className="flex h-full min-h-[28rem] flex-col gap-4">
      <ol aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {messages.map((message) => (
          <li
            key={message.id}
            className={cn(
              'flex max-w-[85%] flex-col gap-2',
              message.role === 'user' ? 'items-end self-end' : 'self-start',
            )}
          >
            <span className="text-muted-foreground text-xs font-semibold">
              {message.role === 'user' ? t('you') : robot.name}
            </span>
            <p
              className={cn(
                'rounded-xl px-4 py-3 text-lg leading-relaxed',
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
              <span className="text-muted-foreground text-xs">{t('offline')}</span>
            ) : null}
          </li>
        ))}
        {pending ? (
          <li className="text-muted-foreground animate-pulse self-start">
            {t('thinking', { robot: robot.name })}
          </li>
        ) : null}
        <div ref={listEnd} />
      </ol>

      <div>
        <p className="text-muted-foreground mb-2 text-sm font-semibold">{t('suggestions')}</p>
        <ul className="flex flex-wrap gap-2">
          {site.faq.slice(0, 4).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => void ask(pick(item.question, locale))}
                className="border-border bg-surface hover:border-primary rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {pick(item.question, locale)}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        {support.stt ? (
          <Button
            type="button"
            size="xl"
            variant={listening ? 'default' : 'outline'}
            aria-pressed={listening}
            aria-label={listening ? t('stopListening') : t('listen')}
            onClick={toggleListening}
          >
            {listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}
          </Button>
        ) : null}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={500}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          className="border-border bg-surface h-16 min-w-0 flex-1 rounded-md border px-4 text-lg"
        />
        <Button type="submit" size="xl" disabled={pending || !draft.trim()}>
          <Send aria-hidden />
          <span className="hidden sm:inline">{t('send')}</span>
        </Button>
      </form>
    </div>
  );
}
