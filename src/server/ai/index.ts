import { readAiConfig, type AiConfig } from '@/lib/ai-config';
import { detectRoom } from './intents';
import { buildSystemPrompt } from './prompt';
import { anthropicComplete } from './providers/anthropic';
import { offlineReply } from './providers/offline';
import { openAiCompatibleComplete } from './providers/openai-compatible';
import type { AssistantReply, AssistantRequest, ChatTurn } from './types';

/** Model APIs expect the conversation to start with the user and alternate roles. */
export function normalizeTurns(messages: ChatTurn[]): ChatTurn[] {
  const firstUser = messages.findIndex((turn) => turn.role === 'user');
  if (firstUser === -1) return [];
  return messages.slice(firstUser).reduce<ChatTurn[]>((turns, turn) => {
    const previous = turns.at(-1);
    if (previous?.role === turn.role) {
      previous.content = `${previous.content}\n${turn.content}`;
      return turns;
    }
    return [...turns, { ...turn }];
  }, []);
}

async function modelReply(config: AiConfig, request: AssistantRequest): Promise<string> {
  const system = buildSystemPrompt(request);
  const turns = normalizeTurns(request.messages);
  return config.provider === 'anthropic'
    ? anthropicComplete(config, system, turns)
    : openAiCompatibleComplete(config, system, turns);
}

export async function generateReply(
  request: AssistantRequest,
  config: AiConfig = readAiConfig(),
): Promise<AssistantReply> {
  const question =
    [...request.messages].reverse().find((turn) => turn.role === 'user')?.content ?? '';
  const room = detectRoom(request.site, question);
  const action = room ? ({ type: 'navigate', roomId: room.id } as const) : undefined;

  if (config.provider !== 'offline') {
    try {
      return { reply: await modelReply(config, request), source: 'model', action };
    } catch (error) {
      console.error('[assistant] model call failed, answering offline', error);
    }
  }
  return { reply: offlineReply(request), source: 'offline', action };
}
