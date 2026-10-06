import type { KioskSite, SiteRoom } from '@taksu/content';
import { overlap, tokenize } from './text';

const ROOM_SYNONYMS: Record<string, string[]> = {
  toilet: ['toilet', 'wc', 'restroom', 'restrooms', 'bathroom', 'kamar-mandi', 'mandi'],
  restoran: ['restoran', 'restaurant', 'makan', 'sarapan', 'breakfast', 'warung'],
  pool: ['kolam', 'renang', 'pool', 'swim', 'swimming'],
  gym: ['gym', 'fitness', 'kebugaran'],
  tunggu: ['tunggu', 'waiting'],
};

function roomTokens(room: SiteRoom): Set<string> {
  return new Set([
    ...tokenize(room.name.id),
    ...tokenize(room.name.en),
    ...(ROOM_SYNONYMS[room.id] ?? []),
    room.id,
  ]);
}

/** Finds the room a visitor is most likely asking about, if any. */
export function detectRoom(site: KioskSite, question: string): SiteRoom | undefined {
  const tokens = tokenize(question.replace(/kamar mandi/gi, 'kamar-mandi'));
  let best: { room: SiteRoom; score: number } | undefined;
  for (const room of site.map.rooms) {
    const score = overlap(tokens, roomTokens(room));
    if (score > 0 && (!best || score > best.score)) best = { room, score };
  }
  return best?.room;
}
