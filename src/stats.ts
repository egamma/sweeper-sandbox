/** Pure text helpers used by the extension. No vscode imports here so they are unit-testable. */

export interface TextStats {
  words: number;
  characters: number;
}

/** Count words and characters of a document body. */
export function computeStats(text: string): TextStats {
  const trimmed = text.trim();
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  return { words, characters: text.length };
}

/** Render the status bar label for the given stats. */
export function formatStats(stats: TextStats, showCharacters: boolean): string {
  const base = `$(book) ${stats.words} words`;
  return showCharacters ? `${base}, ${stats.characters} chars` : base;
}

/** Turn a heading line into a URL-friendly slug. */
export function slugify(heading: string): string {
  return heading
    .replace(/^#+\s*/, '')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type TimestampFormat = 'iso' | 'date' | 'datetime';

/** Format a timestamp for insertion. */
export function formatTimestamp(date: Date, format: TimestampFormat): string {
  if (format === 'iso') {
    return date.toISOString();
  }

  if (format === 'date') {
    return date.toISOString().slice(0, 10);
  }

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
