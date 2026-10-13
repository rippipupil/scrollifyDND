import { addEnemy, emptyEncounter } from '../../dm/encounter';
import { newEnemy } from '../../dm/enemy';
import { newEntry } from '../../journal/journal';
import { newCharacter } from '../../rules/core';
import { decodeBundle, encodeBundle } from '../../share/codec';
import { useCharacters } from '../../store/characters';
import { useDm } from '../../store/dm';
import { useHomebrew } from '../../store/homebrew';
import { useJournal } from '../../store/journal';
import { useWikiUser } from '../../store/wiki';
import { backupName, mergeById, sanitizeBackup } from '../backup';
import { collectBackup, restoreBackup } from '../restore';

const PORTRAIT = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

function reset() {
  useCharacters.setState({ characters: {} });
  useDm.setState({ enemies: {}, encounter: emptyEncounter() });
  useJournal.setState({ entries: {} });
  useHomebrew.setState({ entries: [] });
  useWikiUser.setState({ notes: {}, favorites: [] });
}
beforeEach(reset);

function fill() {
  useCharacters.getState().add(newCharacter({ id: 'c1', name: 'Mira', portraitUri: PORTRAIT, updatedAt: 100 }));
  useDm.getState().saveEnemy(newEnemy({ id: 'e1', name: 'Trasgo' }));
  useJournal.getState().save({ ...newEntry('npc', 'Sildar'), id: 'j1', body: 'Rescatado' });
  useHomebrew.getState().upsert({ id: 'hb-sword', category: 'magic-item', name: { en: 'Moon Sword', es: 'Espada lunar' }, source: 'homebrew', data: {} } as any);
  useWikiUser.getState().setNote('spell:fireball', 'Cuidado con los aliados');
  useWikiUser.getState().toggleFavorite('spell:fireball');
}

test('a backup goes through a file and back with everything, portraits included', () => {
  fill();
  const file = encodeBundle('backup', collectBackup(1234), 'json');
  reset();
  const d = decodeBundle(file);
  expect(d.ok && d.kind).toBe('backup');
  if (!d.ok || d.kind !== 'backup') return;
  const r = restoreBackup(d.payload);
  expect(r).toMatchObject({ added: 4, updated: 0, encounter: false });
  expect(useCharacters.getState().characters.c1).toMatchObject({ name: 'Mira', portraitUri: PORTRAIT });
  expect(useDm.getState().enemies.e1.name).toBe('Trasgo');
  expect(useJournal.getState().entries.j1.body).toBe('Rescatado');
  expect(useHomebrew.getState().entries.map((e) => e.id)).toEqual(['hb-sword']);
  expect(useWikiUser.getState()).toMatchObject({ notes: { 'spell:fireball': 'Cuidado con los aliados' }, favorites: ['spell:fireball'] });
});

test('restoring never undoes newer work and adds what is missing', () => {
  fill();
  const old = collectBackup();
  useCharacters.setState({ characters: { c1: { ...useCharacters.getState().characters.c1, name: 'Mira (nivel 5)', updatedAt: 999 } } });
  useJournal.getState().remove('j1');
  const r = restoreBackup(old);
  expect(useCharacters.getState().characters.c1.name).toBe('Mira (nivel 5)');
  expect(useJournal.getState().entries.j1).toBeDefined();
  expect(r).toMatchObject({ added: 1, updated: 0 });
  // The same homebrew entry isn't duplicated.
  expect(useHomebrew.getState().entries).toHaveLength(1);
});

test('a saved combat comes back only when none is running', () => {
  const e = newEnemy({ id: 'e1', name: 'Trasgo' });
  const withFight = { ...collectBackup(), encounter: addEnemy(emptyEncounter(), e, 2) };
  expect(restoreBackup(withFight).encounter).toBe(true);
  expect(useDm.getState().encounter.combatants).toHaveLength(2);
  const other = { ...withFight, encounter: addEnemy(emptyEncounter(), e, 1) };
  expect(restoreBackup(other).encounter).toBe(false);
  expect(useDm.getState().encounter.combatants).toHaveLength(2);
});

test('broken parts of a backup are dropped, not fatal', () => {
  const b = sanitizeBackup({ characters: [null, 'x', newCharacter({ name: 'Ok' })], enemies: [5], journal: [{}], homebrew: [{ id: 1 }], wiki: { notes: { a: 3, b: 'texto' }, favorites: [1, 'spell:x'] } });
  expect(b.characters.map((c) => c.name)).toEqual(['Ok']);
  expect(b.enemies).toEqual([]);
  expect(b.homebrew).toEqual([]);
  expect(b.wiki).toEqual({ notes: { b: 'texto' }, favorites: ['spell:x'] });
  expect(() => sanitizeBackup('nope')).toThrow();
  expect(decodeBundle(JSON.stringify({ app: 'scrollify', kind: 'backup', v: 1, payload: 3 }))).toEqual({ ok: false, error: 'invalid' });
});

test('merge keeps the newest copy of each id', () => {
  const r = mergeById({ a: { id: 'a', updatedAt: 5, v: 1 } }, [{ id: 'a', updatedAt: 9, v: 2 }, { id: 'b', updatedAt: 1, v: 3 }, { id: 'a', updatedAt: 1, v: 4 }]);
  expect(r).toEqual({ merged: { a: { id: 'a', updatedAt: 9, v: 2 }, b: { id: 'b', updatedAt: 1, v: 3 } }, added: 1, updated: 1 });
  expect(backupName(new Date('2026-10-13T10:00:00Z'))).toBe('scrollify-backup-2026-10-13');
});
