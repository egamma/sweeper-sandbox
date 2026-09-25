/** Pure text helpers used by the extension. No vscode imports here so they are unit-testable. */

export interface TextStats {
  words: number;
  characters: number;
  lines: number;
  paragraphs: number;
}

/** Count words, characters, lines, and paragraphs of a document body. */
export function computeStats(text: string): TextStats {
  const trimmed = text.trim();
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
  const documentLines = text.split(/\r\n|\r|\n/);
  let paragraphs = 0;
  let inParagraph = false;

  for (const line of documentLines) {
    const isBlank = line.trim().length === 0;
    if (!isBlank && !inParagraph) {
      paragraphs += 1;
    }
    inParagraph = !isBlank;
  }

  return { words, characters: text.length, lines: documentLines.length, paragraphs };
}

/** Render the status bar label for the given stats. */
export function formatStats(stats: TextStats, showCharacters: boolean): string {
  const base = `$(book) ${stats.words} words`;
  return showCharacters ? `${base}, ${stats.characters} chars` : base;
}

/** Render the status bar tooltip for the given stats. */
export function formatTooltip(stats: TextStats): string {
  return `Note Stats — ${stats.lines} lines, ${stats.paragraphs} paragraphs — click to hide`;
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
export function formatTimestamp(date: Date, _format: TimestampFormat): string {
  return date.toISOString();
}
