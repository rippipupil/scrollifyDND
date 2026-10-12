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

describe('malformed input never yields a character that crashes the sheet', () => {
  const { maxHp, applyDamage, longRest } = require('../../rules/health');
  const { armorClass, weaponAttacks, carriedWeight } = require('../../rules/combat');
  const { spellcastingStats, spellSlots } = require('../../rules/spellcasting');
  const { saveBonus, skillBonus, passive, initiative, totalLevel, SKILLS } = require('../../rules/core');
  const { ABILITIES } = require('../../rules/types');

  const exercise = (c: any) => {
    maxHp(c);
    applyDamage(c, 5);
    longRest(c);
    armorClass(c);
    weaponAttacks(c);
    carriedWeight(c);
    spellcastingStats(c);
    spellSlots(c);
    totalLevel(c);
    initiative(c);
    passive(c, 'perception');
    for (const a of ABILITIES) saveBonus(c, a);
    for (const s of Object.keys(SKILLS)) skillBonus(c, s);
  };

  const cases: Record<string, unknown> = {
    'hp null': { hp: null },
    'inventory [null]': { inventory: [null, 3, 'x'] },
    'classes junk': { classes: [null, { level: 'a', hitDie: null }] },
    'abilities strings': { abilities: { str: '18', dex: null, con: 'x' } },
    'spells junk': { spellcasting: { spells: [null, { level: 'x' }], slotsUsed: 'no' } },
    'weapon junk': { inventory: [{ kind: 'weapon', equipped: true, weapon: { properties: 'finesse', damage: 7 } }] },
    'armor junk': { inventory: [{ kind: 'armor', equipped: true, armor: 'plate' }] },
    'name not loc': { species: { name: 'Elf' }, background: null, classes: [{ name: 5 }] },
    'proficiencies junk': { proficiencies: { saves: 'dex', skills: null } },
    'overrides junk': { overrides: { ac: 'x', initiativeBonus: null }, hp: { maxOverride: 'big' } },
    'arrays of junk': { resources: [null, { max: 'x' }], features: [7], notes: [null], conditions: [null, 'poisoned'] },
    'numbers junk': { speed: 'fast', exhaustion: 'a', deathSaves: 'x', currency: { gp: 'lots' } },
  };

  test.each(Object.entries(cases))('%s', (_name, raw) => {
    const c = migrateCharacter({ id: 'bad', ...(raw as object) });
    expect(() => exercise(c)).not.toThrow();
    expect(Number.isFinite(maxHp(c))).toBe(true);
    expect(Number.isFinite(armorClass(c))).toBe(true);
    for (const k of c.classes) expect(typeof k.name.en).toBe('string');
    for (const i of c.inventory) expect(typeof i.name.en).toBe('string');
    expect(typeof c.species.name.en).toBe('string');
    expect(c.conditions.every((x: unknown) => typeof x === 'string')).toBe(true);
  });

  test('valid values survive sanitizing', () => {
    const c = migrateCharacter({
      id: 'ok',
      hp: { current: 7, temp: 2, bonusPerLevel: 1, maxOverride: 30 },
      overrides: { ac: 17 },
      species: { name: { en: 'Elf', es: 'Elfo' } },
      inventory: [{ uid: 'i1', name: { en: 'Dagger' }, kind: 'weapon', qty: 2, weight: 1, equipped: true, attuned: false, weapon: { damage: '1d4', damageType: 'piercing', properties: ['finesse'], ranged: false, martial: false } }],
    });
    expect(c.hp).toEqual({ current: 7, temp: 2, bonusPerLevel: 1, maxOverride: 30 });
    expect(c.overrides.ac).toBe(17);
    expect(c.species.name).toEqual({ en: 'Elf', es: 'Elfo' });
    expect(c.inventory[0].weapon?.properties).toEqual(['finesse']);
    expect(c.inventory[0].qty).toBe(2);
  });
});

test('a portrait survives migration only when it is an image URI', () => {
  expect(migrateCharacter({ name: 'A', portraitUri: 'data:image/jpeg;base64,AAAA' }).portraitUri).toBe('data:image/jpeg;base64,AAAA');
  expect(migrateCharacter({ name: 'B', portraitUri: 42 }).portraitUri).toBeUndefined();
  expect(migrateCharacter({ name: 'C', portraitUri: 'javascript:alert(1)' }).portraitUri).toBeUndefined();
});
