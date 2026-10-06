'use client';

import { RobotFace, type RobotFaceProps } from '@taksu/ui/brand/robot-face';
import { useSyncExternalStore } from 'react';
import type { LevelStore } from '../voice/level-store';

/** Robot face whose mouth follows the live TTS level; only this component re-renders per frame. */
export function LiveFace({ levels, ...props }: RobotFaceProps & { levels: LevelStore }) {
  const level = useSyncExternalStore(levels.subscribe, levels.get, () => 0);
  return (
    <RobotFace {...props} level={props.mood === 'speaking' && level > 0 ? level : undefined} />
  );
}
