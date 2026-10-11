import { newCharacter } from '../core';
import { spellcastingStats, spellSlots } from '../spellcasting';
import type { CasterType, CharacterClass } from '../types';
import { angvel, wizardClass } from './fixtures';

const cls = (classId: string, level: number, casterType: CasterType, spellAbility?: CharacterClass['spellAbility']): CharacterClass => ({
  classId,
  name: { en: classId },
  level,
  hitDie: 8,
  hitDiceUsed: 0,
  casterType,
  spellAbility,
});

test('Angvel: spell save DC 13, spell attack +5', () => {
  const [s] = spellcastingStats(angvel());
  expect(s.ability).toBe('int');
  expect(s.dc).toBe(13);
  expect(s.attack).toBe(5);
});

test('DC and attack overrides add', () => {
  const c = angvel();
  c.overrides.spellDcBonus = 1;
  c.overrides.spellAttackBonus = 1;
  const [s] = spellcastingStats(c);
  expect(s.dc).toBe(14);
  expect(s.attack).toBe(6);
});

test('non-caster has no spellcasting stats', () => {
  const c = newCharacter({ classes: [cls('fighter', 3, 'none')] });
  expect(spellcastingStats(c)).toEqual([]);
});

test('Wizard 4 -> [4,3]', () => {
  expect(spellSlots(angvel()).slots).toEqual([4, 3, 0, 0, 0, 0, 0, 0, 0]);
});

test('Wizard 1 -> [2]', () => {
  expect(spellSlots(newCharacter({ classes: [wizardClass(1)] })).slots).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test('Wizard 20 -> [4,3,3,3,3,2,2,1,1]', () => {
  expect(spellSlots(newCharacter({ classes: [wizardClass(20)] })).slots).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
});

test('single-class Paladin 1 gets 2 first-level slots (2024)', () => {
  expect(spellSlots(newCharacter({ classes: [cls('paladin', 1, 'half', 'cha')] })).slots.slice(0, 2)).toEqual([2, 0]);
});

test('single-class Paladin 5 -> [4,2]', () => {
  expect(spellSlots(newCharacter({ classes: [cls('paladin', 5, 'half', 'cha')] })).slots.slice(0, 3)).toEqual([4, 2, 0]);
});

test('single-class third caster level 2 has no slots, level 3 -> [2]', () => {
  expect(spellSlots(newCharacter({ classes: [cls('fighter', 2, 'third', 'int')] })).slots[0]).toBe(0);
  expect(spellSlots(newCharacter({ classes: [cls('fighter', 3, 'third', 'int')] })).slots[0]).toBe(2);
});

test('multiclass Wizard 3 + Cleric 2 -> caster level 5 -> [4,3,2]', () => {
  const c = newCharacter({ classes: [wizardClass(3), cls('cleric', 2, 'full', 'wis')] });
  expect(spellSlots(c).slots.slice(0, 4)).toEqual([4, 3, 2, 0]);
});

test('multiclass Paladin 2 + Sorcerer 3 -> caster level 4 (half rounds up) -> [4,3]', () => {
  const c = newCharacter({ classes: [cls('paladin', 2, 'half', 'cha'), cls('sorcerer', 3, 'full', 'cha')] });
  expect(spellSlots(c).slots.slice(0, 3)).toEqual([4, 3, 0]);
});

test('multiclass Fighter(EK) 5 + Wizard 1 -> third rounds down -> caster level 2 -> [3]', () => {
  const c = newCharacter({ classes: [cls('fighter', 5, 'third', 'int'), wizardClass(1)] });
  expect(spellSlots(c).slots.slice(0, 2)).toEqual([3, 0]);
});

test('Fighter 5 + Wizard 3: only one spellcasting class uses its own table', () => {
  const c = newCharacter({ classes: [cls('fighter', 5, 'none'), wizardClass(3)] });
  expect(spellSlots(c).slots.slice(0, 3)).toEqual([4, 2, 0]);
});

test('Warlock 3 + Wizard 2: pact slots kept separate', () => {
  const c = newCharacter({ classes: [cls('warlock', 3, 'pact', 'cha'), wizardClass(2)] });
  const s = spellSlots(c);
  expect(s.slots.slice(0, 2)).toEqual([3, 0]);
  expect(s.pact).toEqual({ level: 2, count: 2 });
});

test.each([
  [1, 1, 1],
  [2, 2, 1],
  [5, 2, 3],
  [11, 3, 5],
  [17, 4, 5],
])('Warlock %i -> %i pact slots of level %i', (lvl, count, level) => {
  const s = spellSlots(newCharacter({ classes: [cls('warlock', lvl, 'pact', 'cha')] }));
  expect(s.pact).toEqual({ count, level });
  expect(s.slots.every((n) => n === 0)).toBe(true);
});
