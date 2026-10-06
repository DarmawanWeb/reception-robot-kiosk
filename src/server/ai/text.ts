const STOPWORDS = new Set([
  'ada',
  'apa',
  'apakah',
  'bagaimana',
  'berapa',
  'bisa',
  'boleh',
  'dan',
  'dari',
  'di',
  'dimana',
  'ini',
  'itu',
  'jam',
  'ke',
  'kah',
  'mana',
  'mau',
  'saya',
  'untuk',
  'yang',
  'ruang',
  'ruangan',
  'a',
  'an',
  'and',
  'are',
  'can',
  'do',
  'does',
  'for',
  'how',
  'i',
  'is',
  'me',
  'my',
  'of',
  'room',
  'the',
  'to',
  'what',
  'when',
  'where',
  'which',
  'you',
]);

/** Lowercase word tokens without punctuation or stopwords. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9-]+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

export function overlap(a: readonly string[], b: ReadonlySet<string>): number {
  return a.reduce((count, token) => count + (b.has(token) ? 1 : 0), 0);
}
