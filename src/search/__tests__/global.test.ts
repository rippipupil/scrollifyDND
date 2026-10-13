import { getEntry, searchContent } from '../../content';
import { newEnemy } from '../../dm/enemy';
import { loc } from '../../i18n';
import { newEntry } from '../../journal/journal';
import { newCharacter } from '../../rules/core';
import { globalSearch, snippet, type SearchSources } from '../global';

const sources = (over: Partial<SearchSources> = {}): SearchSources => ({
  characters: [newCharacter({ id: 'c1', name: 'Mira Vélez', player: 'Pablo' })],
  enemies: [newEnemy({ id: 'e1', name: 'Capitán trasgo', type: 'feérico' })],
  journal: [{ ...newEntry('npc', 'Sildar Hallwinter'), id: 'j1', body: 'Lo rescatamos en la cueva de los trasgos. Debe 50 po a Mira.' }],
  notes: { 'spell:fireball': 'Ojo con quemar al trasgo prisionero' },
  entryName: (key) => {
    const e = getEntry(key);
    return e ? loc(e.name, 'es') : undefined;
  },
  content: (q) => searchContent(q, {}, 'es', [], 10),
  ...over,
});

test('finds matches in every source, ignoring accents and case', () => {
  const hits = globalSearch('TRASGO', sources(), 'es');
  const kinds = hits.map((h) => h.kind);
  expect(kinds).toEqual(expect.arrayContaining(['enemy', 'journal', 'note', 'content']));
  expect(hits.find((h) => h.kind === 'note')).toMatchObject({ ref: 'spell:fireball', title: 'Bola de fuego' });
  expect(hits.find((h) => h.kind === 'journal')?.snippet).toContain('trasgos');
  expect(globalSearch('velez', sources(), 'es')[0]).toMatchObject({ kind: 'character', ref: 'c1' });
});

test('every word has to match, and an empty query finds nothing', () => {
  expect(globalSearch('mira pablo', sources(), 'es').filter((h) => h.kind === 'character')).toHaveLength(1);
  expect(globalSearch('mira bardo', sources(), 'es').filter((h) => h.kind === 'character')).toHaveLength(0);
  expect(globalSearch('   ', sources(), 'es')).toEqual([]);
});

test('journal pages found by title show no snippet; found by body they do', () => {
  expect(globalSearch('sildar', sources(), 'es').find((h) => h.kind === 'journal')?.snippet).toBeUndefined();
  expect(globalSearch('po', sources(), 'es').find((h) => h.kind === 'journal')?.snippet).toContain('50 po');
});

test('snippets are cut around the first word', () => {
  const long = `${'a'.repeat(100)} dragón rojo ${'b'.repeat(100)}`;
  const s = snippet(long, 'dragon', 40);
  expect(s.startsWith('…')).toBe(true);
  expect(s.endsWith('…')).toBe(true);
  expect(s).toContain('dragón');
  expect(snippet('corto', 'x')).toBe('corto');
});
