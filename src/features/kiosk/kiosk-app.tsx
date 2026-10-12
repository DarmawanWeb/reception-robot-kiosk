'use client';

import { getRobot, type KioskSite, pick, type RobotSlug } from '@taksu/content';
import type { RobotMood } from '@taksu/ui/brand/robot-face';
import { Button } from '@taksu/ui/components/button';
import { cn } from '@taksu/ui/lib/utils';
import { House } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AboutView } from '../about/about-view';
import { AksaraView } from '../aksara/aksara-view';
import { AssistantView } from '../assistant/assistant-view';
import { CultureView } from '../culture/culture-view';
import { GuestbookView } from '../guestbook/guestbook-view';
import { OrgChart } from '../organization/org-chart';
import { QueueView } from '../queue/queue-view';
import { speakWithServer, stopServerSpeech } from '../voice/audio';
import { createLevelStore } from '../voice/level-store';
import { useSpeechServer } from '../voice/use-speech-server';
import { VoiceView } from '../voice/voice-view';
import { WayfindingView } from '../wayfinding/wayfinding-view';
import { HomeMenu } from './home-menu';
import { useIdleTimer } from './hooks';
import { IdleScreen } from './idle-screen';
import { KioskHeader } from './kiosk-header';
import { LiveFace } from './live-face';
import { speak, stopSpeaking, useSpeechSupport } from './speech';
import { type KioskActions, type KioskView, type MenuView, menuViews, parseView } from './types';

const IDLE_TIMEOUT_MS = 90_000;

/** The robot's touchscreen: a small state machine of views around an expressive, talking face. */
export function KioskApp({
  robotSlug,
  site,
  isCustom = false,
  views = menuViews,
}: {
  robotSlug: RobotSlug;
  site: KioskSite;
  /** Studio kiosks reuse a sample venue under the visitor's own name. */
  isCustom?: boolean;
  views?: readonly MenuView[];
}) {
  const robot = getRobot(robotSlug);
  const locale = useLocale();
  const t = useTranslations('Kiosk');
  const browserSpeech = useSpeechSupport();
  const speechServer = useSpeechServer();
  const searchParams = useSearchParams();

  const [view, setView] = useState<KioskView>(() => parseView(searchParams.get('view')) ?? 'idle');
  const [destination, setDestination] = useState<string | null>(() => searchParams.get('room'));
  const [mood, setMood] = useState<RobotMood>('idle');
  const [bubble, setBubble] = useState('');
  const [voiceOn, setVoiceOn] = useState(true);
  const [levels] = useState(createLevelStore);
  const moodTimer = useRef<number | undefined>(undefined);
  const siteName = isCustom ? site.name : undefined;

  const say = useCallback(
    (text: string, onEnd?: () => void) => {
      setBubble(text);
      window.clearTimeout(moodTimer.current);
      stopSpeaking();
      stopServerSpeech();
      const settle = () => {
        setMood((current) => (current === 'speaking' ? 'idle' : current));
        onEnd?.();
      };
      const silent = () => {
        setMood('speaking');
        moodTimer.current = window.setTimeout(settle, Math.min(4000, 500 + text.length * 40));
      };
      if (!voiceOn || !robot) {
        silent();
        return;
      }
      const viaBrowser = () => {
        if (browserSpeech.tts)
          speak(text, locale, robot.persona.voice, {
            onStart: () => setMood('speaking'),
            onEnd: settle,
          });
        else silent();
      };
      if (!speechServer.tts[locale]) {
        viaBrowser();
        return;
      }
      void speakWithServer(text, locale, {
        onStart: () => setMood('speaking'),
        onLevel: levels.set,
        onEnd: settle,
      }).then((played) => {
        if (!played) viaBrowser();
      });
    },
    [voiceOn, robot, browserSpeech.tts, speechServer.tts, locale, levels],
  );

  const goTo = useCallback(
    (next: KioskView) => {
      setView(next);
      if (next === 'idle') return;
      say(t(`lines.${next}`, { site: site.name }));
    },
    [say, t, site.name],
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
    stopServerSpeech();
    setView('idle');
    setMood('idle');
    setBubble('');
    setDestination(null);
  });

  useEffect(
    () => () => {
      stopSpeaking();
      stopServerSpeech();
      window.clearTimeout(moodTimer.current);
    },
    [],
  );

  if (!robot) return null;
  const theme = robot.slug === 'snow' ? undefined : 'dark';

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
          if (voiceOn) {
            stopSpeaking();
            stopServerSpeech();
          }
          setVoiceOn(!voiceOn);
        }}
      />
      <div className="grid min-h-0 grid-rows-[auto_1fr] md:grid-cols-[minmax(15rem,24%)_1fr] md:grid-rows-1">
        <aside className="border-border flex items-center gap-4 border-b p-4 md:flex-col md:justify-center md:border-r md:border-b-0 md:p-6">
          <LiveFace
            levels={levels}
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
          {view === 'home' ? <HomeMenu robot={robot} views={views} onSelect={goTo} /> : null}
          {view === 'voice' ? (
            <VoiceView
              robot={robot}
              site={site}
              siteName={siteName}
              locale={locale}
              speechServer={speechServer}
              actions={actions}
            />
          ) : null}
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
              canEscort={robot.capabilities.escort}
              actions={actions}
            />
          ) : null}
          {view === 'queue' ? (
            <QueueView site={site} locale={locale} actions={actions} onDone={() => goTo('home')} />
          ) : null}
          {view === 'guestbook' ? (
            <GuestbookView
              site={site}
              locale={locale}
              actions={actions}
              onDone={() => goTo('home')}
            />
          ) : null}
          {view === 'assistant' ? (
            <AssistantView
              robot={robot}
              site={site}
              siteName={siteName}
              locale={locale}
              actions={actions}
            />
          ) : null}
          {view === 'aksara' ? <AksaraView /> : null}
          {view === 'culture' ? <CultureView site={site} locale={locale} /> : null}
        </main>
      </div>
    </div>
  );
}
