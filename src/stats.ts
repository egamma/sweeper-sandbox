/** Pure text helpers used by the extension. No vscode imports here so they are unit-testable. */

export interface TextStats {
  words: number;
  characters: number;
}

/** Count words and characters of a document body. */
export function computeStats(text: string): TextStats {
  const trimmed = text.trim();
  const words = trimmed.length === 0 ? 0 : trimmed.split(' ').length;
  return { words, characters: text.length };
}

/** Render the status bar label for the given stats. */
export function formatStats(stats: TextStats, showCharacters: boolean): string {
  const base = `$(book) ${stats.words} words`;
  return showCharacters ? `${base}, ${stats.characters} chars` : base;
}

/** Latin letters that have no accent to strip, mapped to their usual ASCII spelling. */
const TRANSLITERATIONS: Record<string, string> = {
  ß: 'ss',
  æ: 'ae',
  œ: 'oe',
  ø: 'o',
  ł: 'l',
  đ: 'd',
  þ: 'th',
};

/**
 * Turn a heading line into a URL-friendly slug: lowercase ASCII words joined by single hyphens.
 * Accented Latin letters are folded to ASCII; anything else is dropped. No leading or trailing hyphens.
 */
export function slugify(heading: string): string {
  return heading
    .replace(/^#+\s*/, '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/[ßæœøłđþ]/g, (letter) => TRANSLITERATIONS[letter])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type TimestampFormat = 'iso' | 'date' | 'datetime';

/** Format a timestamp for insertion. */
export function formatTimestamp(date: Date, _format: TimestampFormat): string {
  return date.toISOString();
}
