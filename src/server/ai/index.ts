import { readAiConfig, type AiConfig } from '@/lib/ai-config';
import { detectRoom } from './intents';
import { buildSystemPrompt } from './prompt';
import { anthropicComplete } from './providers/anthropic';
import { ollamaComplete } from './providers/ollama';
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
  switch (config.provider) {
    case 'anthropic':
      return anthropicComplete(config, system, turns);
    case 'ollama':
      return ollamaComplete(config, system, turns);
    default:
      return openAiCompatibleComplete(config, system, turns);
  }
}

/** Model calls in flight in this server process (one PM2 process per app). */
let activeModelCalls = 0;

export async function generateReply(
  request: AssistantRequest,
  config: AiConfig = readAiConfig(),
): Promise<AssistantReply> {
  const question =
    [...request.messages].reverse().find((turn) => turn.role === 'user')?.content ?? '';
  const room = detectRoom(request.site, question);
  const action = room ? ({ type: 'navigate', roomId: room.id } as const) : undefined;

  if (config.provider !== 'offline') {
    if (activeModelCalls >= config.maxConcurrency) {
      console.warn('[assistant] model busy, answering offline');
    } else {
      activeModelCalls += 1;
      try {
        return { reply: await modelReply(config, request), source: 'model', action };
      } catch (error) {
        console.error('[assistant] model call failed, answering offline', error);
      } finally {
        activeModelCalls -= 1;
      }
    }
  }
  return { reply: offlineReply(request), source: 'offline', action };
}
