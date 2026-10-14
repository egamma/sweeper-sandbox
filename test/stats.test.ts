import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats, formatStats, formatTimestamp, slugify } from '../src/stats';

test('computeStats counts words in a simple sentence', () => {
  assert.equal(computeStats('one two three').words, 3);
});

test('computeStats returns zero for empty text', () => {
  assert.deepEqual(computeStats('   '), { words: 0, characters: 3 });
});

test('formatStats appends characters only when asked', () => {
  const stats = { words: 2, characters: 9 };
  assert.equal(formatStats(stats, false), '$(book) 2 words');
  assert.equal(formatStats(stats, true), '$(book) 2 words, 9 chars');
});

test('slugify lowercases and strips the heading marker', () => {
  assert.equal(slugify('## Hello World'), 'hello-world');
  assert.equal(slugify('###Title'), 'title');
});

test('slugify folds accented Latin letters to ASCII', () => {
  assert.equal(slugify('## Café menu, part 2!'), 'cafe-menu-part-2');
  assert.equal(slugify('## ÉCOLE Über'), 'ecole-uber');
});

test('slugify transliterates letters that have no accent to strip', () => {
  assert.equal(slugify('Straße Æther Œuvre Ørsted Łódź Đorđe Þór'), 'strasse-aether-oeuvre-orsted-lodz-dorde-thor');
});

test('slugify folds compatibility forms', () => {
  assert.equal(slugify('Ｈｅｌｌｏ'), 'hello');
});

test('slugify trims hyphens left by edge punctuation', () => {
  assert.equal(slugify('!Hello?'), 'hello');
  assert.equal(slugify('## (Draft) notes...'), 'draft-notes');
});

test('slugify collapses internal separators', () => {
  assert.equal(slugify('## a -- b   c'), 'a-b-c');
});

test('slugify drops characters that cannot fold to ASCII', () => {
  assert.equal(slugify('## Привет world'), 'world');
  assert.equal(slugify('## 日本'), '');
});

test('slugify returns an empty string when nothing is slug-worthy', () => {
  assert.equal(slugify('## !!!'), '');
  assert.equal(slugify(''), '');
});

test('slugify output only contains lowercase ASCII words joined by single hyphens', () => {
  const inputs = [
    '## Hello World',
    '###Title',
    '## Café menu, part 2!',
    '## ÉCOLE Über',
    'Straße Æther Œuvre Ørsted Łódź Đorđe Þór',
    'Ｈｅｌｌｏ',
    '!Hello?',
    '## (Draft) notes...',
    '## a -- b   c',
    '## Привет world',
    '## 日本',
    '## !!!',
    '',
  ];
  for (const input of inputs) {
    assert.match(slugify(input), /^([a-z0-9]+(-[a-z0-9]+)*)?$/, input);
  }
});

test('formatTimestamp iso returns an ISO string', () => {
  assert.equal(formatTimestamp(new Date(Date.UTC(2026, 0, 2, 3, 4, 5)), 'iso'), '2026-01-02T03:04:05.000Z');
});
