import type { KioskSite, Locale, ReceptionRobot } from '@taksu/content';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantRequest {
  robot: ReceptionRobot;
  site: KioskSite;
  locale: Locale;
  messages: ChatTurn[];
}

/** Optional follow-up the kiosk can offer as a button under the reply. */
export type AssistantAction = { type: 'navigate'; roomId: string };

export interface AssistantReply {
  reply: string;
  source: 'model' | 'offline';
  action?: AssistantAction;
}
