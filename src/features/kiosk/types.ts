import type { RobotMood } from '@taksu/ui/brand/robot-face';

export type KioskView =
  | 'idle'
  | 'home'
  | 'about'
  | 'organization'
  | 'wayfinding'
  | 'queue'
  | 'assistant'
  | 'aksara'
  | 'culture';

export type MenuView = Exclude<KioskView, 'idle' | 'home'>;

export const menuViews: readonly MenuView[] = [
  'wayfinding',
  'queue',
  'assistant',
  'about',
  'organization',
  'aksara',
  'culture',
];

/** What a feature view may ask the robot to do. */
export interface KioskActions {
  say: (text: string) => void;
  setMood: (mood: RobotMood) => void;
  guideTo: (roomId: string) => void;
}
