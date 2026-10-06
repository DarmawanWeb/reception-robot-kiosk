import type { Locale, RobotSlug } from '@taksu/content';

export interface AssistantTurn {
  role: 'user' | 'assistant';
  content: string;
}

export type AskResult =
  | { ok: true; reply: string; source: 'model' | 'offline'; roomId?: string }
  | { ok: false; reason: 'rate_limited' | 'error' };

/** Client call to /api/assistant shared by the chat and voice views. */
export async function askAssistant(input: {
  robot: RobotSlug;
  site: string;
  /** Display name for Studio kiosks built on a sample venue. */
  siteName?: string;
  locale: Locale;
  messages: AssistantTurn[];
}): Promise<AskResult> {
  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (response.status === 429) return { ok: false, reason: 'rate_limited' };
    if (!response.ok) return { ok: false, reason: 'error' };
    const data = (await response.json()) as {
      reply: string;
      source: 'model' | 'offline';
      action?: { type: 'navigate'; roomId: string };
    };
    return { ok: true, reply: data.reply, source: data.source, roomId: data.action?.roomId };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
