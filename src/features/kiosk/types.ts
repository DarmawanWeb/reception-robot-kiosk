import type { RobotMood } from '@taksu/ui/brand/robot-face';

export type KioskView =
  | 'idle'
  | 'home'
  | 'voice'
  | 'about'
  | 'organization'
  | 'wayfinding'
  | 'queue'
  | 'guestbook'
  | 'assistant'
  | 'aksara'
  | 'culture';

export type MenuView = Exclude<KioskView, 'idle' | 'home'>;

export const menuViews: readonly MenuView[] = [
  'voice',
  'queue',
  'guestbook',
  'wayfinding',
  'assistant',
  'about',
  'organization',
  'aksara',
  'culture',
];

export function parseView(value: string | null): KioskView | null {
  if (!value) return null;
  return value === 'home' || (menuViews as readonly string[]).includes(value)
    ? (value as KioskView)
    : null;
}

/** What a feature view may ask the robot to do. */
export interface KioskActions {
  say: (text: string, onEnd?: () => void) => void;
  setMood: (mood: RobotMood) => void;
  guideTo: (roomId: string) => void;
}
