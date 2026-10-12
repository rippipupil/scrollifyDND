import { getEntry } from '../../content';
import { entryToFeature, entryToItem, entryToSpell } from '../adapters';

test('longsword becomes a martial weapon item with mastery', () => {
  const it = entryToItem(getEntry('equipment:longsword')!);
  expect(it.kind).toBe('weapon');
  expect(it.weapon).toMatchObject({ damage: '1d8', damageType: 'slashing', martial: true, versatileDamage: '1d10', mastery: 'sap' });
  expect(it.ref).toBe('equipment:longsword');
  expect(it.weight).toBe(3);
  expect(it.name.es).toBe('Espada larga');
});

test('chain mail becomes heavy armor; shield becomes a shield', () => {
  expect(entryToItem(getEntry('equipment:chain-mail')!)).toMatchObject({ kind: 'armor', armor: { type: 'heavy', base: 16, strMin: 13 } });
  expect(entryToItem(getEntry('equipment:shield')!)).toMatchObject({ kind: 'shield', shieldBonus: 2 });
});

test('dagger is finesse, light and thrown', () => {
  expect(entryToItem(getEntry('equipment:dagger')!).weapon!.properties).toEqual(expect.arrayContaining(['finesse', 'light', 'thrown']));
});

test('magic item keeps attunement flag', () => {
  const it = entryToItem(getEntry('magic-item:cloak-of-protection')!);
  expect(it.kind).toBe('magic');
  expect(it.requiresAttunement).toBe(true);
});

test('spell entry becomes a known spell', () => {
  const s = entryToSpell(getEntry('spell:flaming-sphere')!, 'wizard');
  expect(s).toMatchObject({ ref: 'spell:flaming-sphere', level: 2, concentration: true, ritual: false, classId: 'wizard', prepared: true });
  expect(s.name.es).toBe('Esfera de llamas');
});

test('cantrips are always prepared', () => {
  expect(entryToSpell(getEntry('spell:fire-bolt')!).always).toBe(true);
});

test('feat entry becomes a feature with localized text', () => {
  const f = entryToFeature(getEntry('feat:alert')!, 'es');
  expect(f.name).toBe('Alerta');
  expect(f.text).toContain('iniciativa');
  expect(f.ref).toBe('feat:alert');
});

import { newCharacter } from '../../rules/core';
import { addEntryToCharacter, canAddToCharacter } from '../adapters';

test('addEntryToCharacter routes spells, items and feats to the right list', () => {
  let c = newCharacter({ name: 'A', classes: [{ classId: 'wizard', name: { en: 'Wizard' }, level: 1, hitDie: 6, hitDiceUsed: 0, casterType: 'full', spellAbility: 'int' }] });
  c = addEntryToCharacter(c, getEntry('spell:magic-missile')!, 'es');
  c = addEntryToCharacter(c, getEntry('equipment:dagger')!, 'es');
  c = addEntryToCharacter(c, getEntry('feat:alert')!, 'es');
  expect(c.spellcasting.spells[0]).toMatchObject({ ref: 'spell:magic-missile', classId: 'wizard' });
  expect(c.inventory[0].ref).toBe('equipment:dagger');
  expect(c.features[0].name).toBe('Alerta');
});

test('only some categories can be added to a sheet', () => {
  expect(canAddToCharacter(getEntry('spell:fireball')!)).toBe(true);
  expect(canAddToCharacter(getEntry('monster:aboleth')!)).toBe(false);
  expect(canAddToCharacter(getEntry('rule:rule-action')!)).toBe(false);
});
