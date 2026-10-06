'use client';

import { getRobot, getSite, pick, type RobotSlug } from '@taksu/content';
import { RobotFace, type RobotMood } from '@taksu/ui/brand/robot-face';
import { Button } from '@taksu/ui/components/button';
import { cn } from '@taksu/ui/lib/utils';
import { House } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AboutView } from '../about/about-view';
import { AksaraView } from '../aksara/aksara-view';
import { AssistantView } from '../assistant/assistant-view';
import { CultureView } from '../culture/culture-view';
import { OrgChart } from '../organization/org-chart';
import { QueueView } from '../queue/queue-view';
import { WayfindingView } from '../wayfinding/wayfinding-view';
import { HomeMenu } from './home-menu';
import { useIdleTimer } from './hooks';
import { IdleScreen } from './idle-screen';
import { KioskHeader } from './kiosk-header';
import { speak, stopSpeaking, useSpeechSupport } from './speech';
import type { KioskActions, KioskView } from './types';

const IDLE_TIMEOUT_MS = 90_000;

/** The robot's touchscreen: a small state machine of views around an expressive face. */
export function KioskApp({ robotSlug, siteSlug }: { robotSlug: RobotSlug; siteSlug: string }) {
  const robot = getRobot(robotSlug);
  const site = getSite(siteSlug);
  const locale = useLocale();
  const t = useTranslations('Kiosk');
  const support = useSpeechSupport();

  const [view, setView] = useState<KioskView>('idle');
  const [mood, setMood] = useState<RobotMood>('idle');
  const [bubble, setBubble] = useState('');
  const [voiceOn, setVoiceOn] = useState(true);
  const [destination, setDestination] = useState<string | null>(null);
  const moodTimer = useRef<number | undefined>(undefined);

  const say = useCallback(
    (text: string) => {
      setBubble(text);
      window.clearTimeout(moodTimer.current);
      const settle = () => setMood((current) => (current === 'speaking' ? 'idle' : current));
      if (voiceOn && support.tts && robot) {
        speak(text, locale, robot.persona.voice, {
          onStart: () => setMood('speaking'),
          onEnd: settle,
        });
      } else {
        setMood('speaking');
        moodTimer.current = window.setTimeout(settle, Math.min(4000, 500 + text.length * 40));
      }
    },
    [voiceOn, support.tts, locale, robot],
  );

  const goTo = useCallback(
    (next: KioskView) => {
      setView(next);
      if (next === 'idle') return;
      say(t(`lines.${next}`, { site: site?.name ?? '' }));
    },
    [say, t, site?.name],
  );

  const actions: KioskActions = {
    say,
    setMood,
    guideTo: (roomId) => {
      setDestination(roomId);
      goTo('wayfinding');
    },
  };

  useIdleTimer(view !== 'idle', IDLE_TIMEOUT_MS, () => {
    stopSpeaking();
    setView('idle');
    setMood('idle');
    setBubble('');
    setDestination(null);
  });

  useEffect(
    () => () => {
      stopSpeaking();
      window.clearTimeout(moodTimer.current);
    },
    [],
  );

  if (!robot || !site) return null;
  const theme = robot.slug === 'timo' ? 'dark' : undefined;

  if (view === 'idle') {
    return (
      <div className={cn(theme, 'bg-background text-foreground h-dvh')}>
        <IdleScreen
          robot={robot}
          site={site}
          onStart={() => {
            setView('home');
            say(pick(robot.persona.greeting, locale));
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn(theme, 'bg-background text-foreground grid h-dvh grid-rows-[auto_1fr]')}>
      <KioskHeader
        site={site}
        locale={locale}
        voiceOn={voiceOn}
        onToggleVoice={() => {
          if (voiceOn) stopSpeaking();
          setVoiceOn(!voiceOn);
        }}
      />
      <div className="grid min-h-0 grid-rows-[auto_1fr] md:grid-cols-[minmax(15rem,24%)_1fr] md:grid-rows-1">
        <aside className="border-border flex items-center gap-4 border-b p-4 md:flex-col md:justify-center md:border-r md:border-b-0 md:p-6">
          <RobotFace
            variant={robot.slug}
            mood={mood}
            label={t('faceLabel', { robot: robot.name, mood: t(`moods.${mood}`) })}
            className="w-28 shrink-0 md:w-full md:max-w-[17rem]"
          />
          <p
            aria-live="polite"
            className="bg-surface-muted min-h-12 flex-1 rounded-xl px-4 py-3 text-base leading-snug md:flex-none md:text-center md:text-lg"
          >
            {bubble}
          </p>
          {view !== 'home' ? (
            <Button variant="outline" size="lg" className="shrink-0" onClick={() => goTo('home')}>
              <House aria-hidden />
              <span className="hidden sm:inline">{t('home')}</span>
            </Button>
          ) : null}
        </aside>
        <main className="min-h-0 overflow-y-auto p-5 md:p-8">
          {view === 'home' ? <HomeMenu robot={robot} onSelect={goTo} /> : null}
          {view === 'about' ? <AboutView site={site} locale={locale} /> : null}
          {view === 'organization' ? (
            <OrgChart site={site} locale={locale} onGuide={actions.guideTo} />
          ) : null}
          {view === 'wayfinding' ? (
            <WayfindingView
              key={destination ?? 'none'}
              site={site}
              locale={locale}
              initialRoomId={destination}
              actions={actions}
            />
          ) : null}
          {view === 'queue' ? (
            <QueueView site={site} locale={locale} actions={actions} onDone={() => goTo('home')} />
          ) : null}
          {view === 'assistant' ? (
            <AssistantView robot={robot} site={site} locale={locale} actions={actions} />
          ) : null}
          {view === 'aksara' ? <AksaraView /> : null}
          {view === 'culture' ? <CultureView site={site} locale={locale} /> : null}
        </main>
      </div>
    </div>
  );
}
