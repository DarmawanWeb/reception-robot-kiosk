'use client';

import { getRobot, type KioskSite, type Locale, pick, type RobotSlug } from '@taksu/content';
import type { RobotMood } from '@taksu/ui/brand/robot-face';
import { Button } from '@taksu/ui/components/button';
import { cn } from '@taksu/ui/lib/utils';
import { House, LogOut } from 'lucide-react';
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
import { KioskClock, KioskControls } from './kiosk-controls';
import { KioskHeader } from './kiosk-header';
import { LiveFace } from './live-face';
import { speak, stopSpeaking, useSpeechSupport } from './speech';
import { type KioskActions, type KioskView, type MenuView, menuViews, parseView } from './types';
import { ViewTitle } from './view-title';

const IDLE_TIMEOUT_MS = 90_000;

/**
 * Keeps the open screen (and a chosen room) in the address bar without a navigation, so a
 * language switch or a reload lands on the same screen.
 */
function useViewInUrl(view: KioskView, room: string | null) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (view === 'idle') url.searchParams.delete('view');
    else url.searchParams.set('view', view);
    if (view === 'wayfinding' && room) url.searchParams.set('room', room);
    else url.searchParams.delete('room');
    url.searchParams.delete('greet');
    if (url.href !== window.location.href) window.history.replaceState(null, '', url);
  }, [view, room]);
}

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
  const locale = useLocale() as Locale;
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
  /** Set when the visitor started from the attract screen in the other language. */
  const greetOnArrival = useRef(searchParams.get('greet') === '1');
  const siteName = isCustom ? site.name : undefined;

  useViewInUrl(view, destination);

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

  useEffect(() => {
    if (!greetOnArrival.current || !robot) return;
    greetOnArrival.current = false;
    say(pick(robot.persona.greeting, locale));
  }, [robot, say, locale]);

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

  const finish = useCallback(() => {
    stopSpeaking();
    stopServerSpeech();
    setView('idle');
    setMood('idle');
    setBubble('');
    setDestination(null);
  }, []);

  useIdleTimer(view !== 'idle', IDLE_TIMEOUT_MS, finish);

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
      <div className={cn(theme, 'kiosk-screen bg-background text-foreground h-dvh')}>
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

  const toggleVoice = () => {
    if (voiceOn) {
      stopSpeaking();
      stopServerSpeech();
    }
    setVoiceOn(!voiceOn);
  };

  // Back to the menu from a screen; from the menu itself, end the visit.
  const navButton =
    view === 'home' ? (
      <Button size="xl" variant="outline" className="w-full" onClick={finish}>
        <LogOut aria-hidden />
        {t('finish')}
      </Button>
    ) : (
      <Button size="xl" className="w-full" onClick={() => goTo('home')}>
        <House aria-hidden />
        {t('home')}
      </Button>
    );

  return (
    <div
      className={cn(
        theme,
        'kiosk-screen bg-background text-foreground grid h-dvh overflow-hidden',
        'landscape:grid-cols-[minmax(14rem,23%)_minmax(0,1fr)] landscape:grid-rows-[auto_minmax(0,1fr)]',
        'portrait:grid-cols-[minmax(0,1fr)] portrait:grid-rows-[auto_auto_minmax(0,1fr)_auto]',
      )}
    >
      <div className="border-border border-b landscape:col-span-2">
        <KioskHeader site={site} locale={locale} voiceOn={voiceOn} onToggleVoice={toggleVoice} />
      </div>

      <aside className="border-border flex items-center gap-5 landscape:flex-col landscape:border-r landscape:px-5 landscape:pt-8 landscape:pb-5 portrait:border-b portrait:px-6 portrait:py-4">
        <LiveFace
          levels={levels}
          variant={robot.slug}
          mood={mood}
          label={t('faceLabel', { robot: robot.name, mood: t(`moods.${mood}`) })}
          className="shrink-0 landscape:w-full landscape:max-w-[15rem] portrait:w-[8.5rem]"
        />
        {/* Before the robot has said anything, the bubble shows what this screen is for. */}
        <p
          aria-live="polite"
          className="speech text-[1.15rem] leading-snug landscape:w-full landscape:px-4 landscape:py-3 landscape:text-center portrait:flex-1 portrait:px-5 portrait:py-3.5"
        >
          {bubble || t(`lines.${view}`, { site: site.name })}
        </p>
        <div className="mt-auto w-full portrait:hidden">{navButton}</div>
      </aside>

      <main className="flex min-h-0 flex-col overflow-y-auto px-8 pt-7 pb-8 portrait:px-6 portrait:pt-5 portrait:pb-6">
        {view === 'home' ? (
          <HomeMenu robot={robot} views={views} onSelect={goTo} />
        ) : (
          <ViewTitle view={view} robotName={robot.name} />
        )}
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
            site={site}
            locale={locale}
            roomId={destination}
            onRoomChange={setDestination}
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
        {view === 'aksara' ? <AksaraView site={site} locale={locale} /> : null}
        {view === 'culture' ? <CultureView site={site} locale={locale} /> : null}
      </main>

      <nav
        aria-label={t('dock')}
        className="border-border flex items-center gap-4 border-t px-6 py-4 landscape:hidden"
      >
        <div className="w-[15rem] shrink-0 max-sm:w-auto max-sm:flex-1">{navButton}</div>
        <KioskClock locale={locale} className="ml-auto items-end text-right max-sm:hidden" />
        <KioskControls voiceOn={voiceOn} onToggleVoice={toggleVoice} />
      </nav>
    </div>
  );
}
