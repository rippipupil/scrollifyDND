import { SCHEMA_VERSION } from '../../rules/core';
import { migrateCharacter } from '../migrations';

test('fills missing fields of an old character and stamps the version', () => {
  const old = { id: 'x', name: 'Angvel', abilities: { str: 12, dex: 10, con: 14, int: 16, wis: 13, cha: 19 }, classes: [] };
  const c = migrateCharacter(old);
  expect(c.schemaVersion).toBe(SCHEMA_VERSION);
  expect(c.name).toBe('Angvel');
  expect(c.abilities.int).toBe(16);
  expect(c.spellcasting.slotsUsed).toHaveLength(9);
  expect(c.hp.temp).toBe(0);
  expect(c.currency.gp).toBe(0);
});

test('rejects non-objects', () => {
  expect(() => migrateCharacter(null)).toThrow();
  expect(() => migrateCharacter('hello')).toThrow();
});

test('rejects characters from a newer app version', () => {
  expect(() => migrateCharacter({ id: 'x', schemaVersion: SCHEMA_VERSION + 1 })).toThrow(/newer/);
});
