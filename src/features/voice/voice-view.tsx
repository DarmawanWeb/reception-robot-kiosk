'use client';

import { type KioskSite, type Locale, pick, type ReceptionRobot } from '@taksu/content';
import { Button } from '@taksu/ui/components/button';
import { cn } from '@taksu/ui/lib/utils';
import { Mic, Route, Send, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { askAssistant } from '../assistant/ask';
import { listenOnce, stopSpeaking, useSpeechSupport } from '../kiosk/speech';
import type { KioskActions } from '../kiosk/types';
import { type Recording, startRecording, stopServerSpeech, transcribe } from './audio';
import { createLevelStore, type LevelStore } from './level-store';
import type { SpeechServerStatus } from './use-speech-server';

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Turn {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  roomId?: string;
}

function MicRing({ levels, active }: { levels: LevelStore; active: boolean }) {
  const level = useSyncExternalStore(levels.subscribe, levels.get, () => 0);
  return (
    <span
      aria-hidden
      className={cn(
        'bg-primary/25 absolute inset-0 rounded-full transition-transform',
        !active && 'scale-100 opacity-0',
      )}
      style={active ? { transform: `scale(${1 + level * 0.6})` } : undefined}
    />
  );
}

/** Push-to-talk conversation: server Whisper when available, browser speech otherwise. */
export function VoiceView({
  robot,
  site,
  siteName,
  locale,
  speechServer,
  actions,
}: {
  robot: ReceptionRobot;
  site: KioskSite;
  siteName?: string;
  locale: Locale;
  speechServer: SpeechServerStatus;
  actions: KioskActions;
}) {
  const t = useTranslations('Voice');
  const tAssistant = useTranslations('Assistant');
  const browser = useSpeechSupport();
  const [phase, setPhase] = useState<Phase>('idle');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [micLevels] = useState(createLevelStore);
  const recording = useRef<Recording | null>(null);
  const cancelBrowser = useRef<(() => void) | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const nextId = useRef(0);
  const listEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    turnsRef.current = turns;
    listEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns]);

  useEffect(
    () => () => {
      recording.current?.cancel();
      cancelBrowser.current?.();
    },
    [],
  );

  async function handleText(text: string) {
    const content = text.trim();
    if (!content) return;
    const history: Turn[] = [...turnsRef.current, { id: nextId.current++, role: 'user', content }];
    setTurns(history);
    setPhase('thinking');
    actions.setMood('thinking');
    const result = await askAssistant({
      robot: robot.slug,
      site: site.slug,
      siteName,
      locale,
      messages: history.map(({ role, content: turn }) => ({ role, content: turn })),
    });
    if (!result.ok) {
      const message =
        result.reason === 'rate_limited' ? tAssistant('rateLimited') : tAssistant('error');
      setTurns((current) => [
        ...current,
        { id: nextId.current++, role: 'assistant', content: message },
      ]);
      setPhase('idle');
      actions.setMood('idle');
      return;
    }
    setTurns((current) => [
      ...current,
      { id: nextId.current++, role: 'assistant', content: result.reply, roomId: result.roomId },
    ]);
    setPhase('speaking');
    actions.say(result.reply, () =>
      setPhase((current) => (current === 'speaking' ? 'idle' : current)),
    );
  }

  async function startListening() {
    setNotice(null);
    stopSpeaking();
    stopServerSpeech();
    const canRecord =
      speechServer.stt &&
      typeof MediaRecorder !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia);

    if (canRecord) {
      try {
        const rec = await startRecording(micLevels.set, 8000);
        recording.current = rec;
        setPhase('listening');
        actions.setMood('listening');
        const audio = await rec.done;
        recording.current = null;
        if (!audio) {
          setPhase('idle');
          return;
        }
        setPhase('thinking');
        actions.setMood('thinking');
        const text = await transcribe(audio, locale);
        if (!text) {
          setNotice(t('notHeard'));
          setPhase('idle');
          actions.setMood('idle');
          return;
        }
        await handleText(text);
      } catch {
        setNotice(t('micDenied'));
        setPhase('idle');
        actions.setMood('idle');
      }
      return;
    }

    if (browser.stt) {
      setPhase('listening');
      actions.setMood('listening');
      cancelBrowser.current = listenOnce(locale, {
        onResult: (text) => void handleText(text),
        onEnd: () => {
          cancelBrowser.current = null;
          setPhase((current) => (current === 'listening' ? 'idle' : current));
        },
      });
      return;
    }
    setNotice(t('unsupported'));
  }

  function stopListening() {
    if (recording.current) recording.current.stop();
    else cancelBrowser.current?.();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft;
    setDraft('');
    void handleText(text);
  }

  const roomName = (roomId: string) => {
    const room = site.map.rooms.find((entry) => entry.id === roomId);
    return room ? pick(room.name, locale) : roomId;
  };
  const engine = speechServer.stt ? t('engineServer') : browser.stt ? t('engineBrowser') : null;
  const status =
    phase === 'listening'
      ? t('listening')
      : phase === 'thinking'
        ? t('thinking', { robot: robot.name })
        : phase === 'speaking'
          ? t('speaking', { robot: robot.name })
          : t('tapToTalk');

  return (
    <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
      <div className="flex flex-col items-center gap-5 text-center">
        <button
          type="button"
          onClick={phase === 'listening' ? stopListening : () => void startListening()}
          disabled={phase === 'thinking'}
          aria-pressed={phase === 'listening'}
          aria-label={phase === 'listening' ? t('tapToStop') : t('tapToTalk')}
          className="bg-primary text-primary-foreground relative flex size-44 items-center justify-center rounded-full shadow-2xl transition-transform active:scale-95 disabled:opacity-60"
        >
          <MicRing levels={micLevels} active={phase === 'listening'} />
          {phase === 'listening' ? (
            <Square className="relative size-14" aria-hidden />
          ) : (
            <Mic className="relative size-16" aria-hidden />
          )}
        </button>
        <p aria-live="polite" className="text-xl font-semibold">
          {status}
        </p>
        {engine ? <p className="text-muted-foreground text-xs">{engine}</p> : null}
        {notice ? (
          <p role="alert" className="text-danger text-sm font-semibold">
            {notice}
          </p>
        ) : null}
      </div>

      <div className="flex min-h-[24rem] flex-col gap-4">
        <ol aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {turns.length === 0 ? <li className="text-muted-foreground">{t('empty')}</li> : null}
          {turns.map((turn) => (
            <li
              key={turn.id}
              className={cn(
                'flex max-w-[85%] flex-col gap-2',
                turn.role === 'user' ? 'items-end self-end' : 'self-start',
              )}
            >
              <span className="text-muted-foreground text-xs font-semibold">
                {turn.role === 'user' ? t('you') : robot.name}
              </span>
              <p
                className={cn(
                  'rounded-xl px-4 py-3 text-lg leading-relaxed',
                  turn.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'border-border bg-surface border',
                )}
              >
                {turn.content}
              </p>
              {turn.roomId ? (
                <Button variant="outline" onClick={() => actions.guideTo(turn.roomId as string)}>
                  <Route aria-hidden />
                  {tAssistant('takeMe', { room: roomName(turn.roomId) })}
                </Button>
              ) : null}
            </li>
          ))}
          <div ref={listEnd} />
        </ol>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={500}
            placeholder={t('typeInstead')}
            aria-label={t('typeInstead')}
            className="border-border bg-surface h-14 min-w-0 flex-1 rounded-md border px-4 text-lg"
          />
          <Button
            type="submit"
            size="lg"
            className="h-14"
            disabled={!draft.trim() || phase === 'thinking'}
          >
            <Send aria-hidden />
            <span className="sr-only">{tAssistant('send')}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
