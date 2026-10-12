import { angvel } from '../../rules/__tests__/fixtures';
import { availableSlots, castSpell, cycleSkillProf, spendSlot, toggleCondition, toggleSave } from '../actions';
import { newCharacter } from '../../rules/core';
import type { KnownSpell } from '../../rules/types';

const sphere: KnownSpell = { uid: 's1', name: { en: 'Flaming Sphere' }, level: 2, prepared: true, concentration: true };
const missile: KnownSpell = { uid: 's2', name: { en: 'Magic Missile' }, level: 1, prepared: true };
const bolt: KnownSpell = { uid: 's3', name: { en: 'Fire Bolt' }, level: 0, prepared: true, always: true };

function withSpells() {
  const c = angvel();
  c.spellcasting.spells = [sphere, missile, bolt];
  return c;
}

test('available slots = max - used', () => {
  const c = withSpells();
  c.spellcasting.slotsUsed[0] = 1;
  expect(availableSlots(c).slots.slice(0, 2)).toEqual([3, 3]);
});

test('casting uses a slot of the chosen level', () => {
  const r = castSpell(withSpells(), 's2', 2);
  expect(r.ok).toBe(true);
  expect(r.character.spellcasting.slotsUsed.slice(0, 2)).toEqual([0, 1]);
});

test('cannot cast below the spell level or without slots', () => {
  expect(castSpell(withSpells(), 's1', 1).ok).toBe(false);
  const c = withSpells();
  c.spellcasting.slotsUsed[1] = 3;
  expect(castSpell(c, 's1', 2).ok).toBe(false);
});

test('concentration spells set and replace concentration', () => {
  const c = withSpells();
  c.spellcasting.concentratingOn = 'Bless';
  const r = castSpell(c, 's1', 2);
  expect(r.character.spellcasting.concentratingOn).toBe('Flaming Sphere');
  expect(r.replacedConcentration).toBe('Bless');
});

test('cantrips and rituals cost no slot', () => {
  expect(castSpell(withSpells(), 's3', 0).character.spellcasting.slotsUsed.every((n) => n === 0)).toBe(true);
  expect(castSpell(withSpells(), 's2', 'ritual').character.spellcasting.slotsUsed.every((n) => n === 0)).toBe(true);
});

test('pact magic slots are spent with "pact"', () => {
  const c = withSpells();
  c.classes = [{ classId: 'warlock', name: { en: 'Warlock' }, level: 3, hitDie: 8, hitDiceUsed: 0, casterType: 'pact', spellAbility: 'cha' }];
  const r = castSpell(c, 's2', 'pact');
  expect(r.ok).toBe(true);
  expect(r.character.spellcasting.pactUsed).toBe(1);
  r.character.spellcasting.pactUsed = 2;
  expect(castSpell(r.character, 's2', 'pact').ok).toBe(false);
});

test('toggle condition, save and cycle skill proficiency', () => {
  let c = angvel();
  c = toggleCondition(c, 'prone');
  expect(c.conditions).toContain('prone');
  c = toggleCondition(c, 'prone');
  expect(c.conditions).not.toContain('prone');
  c = toggleSave(c, 'dex');
  expect(c.proficiencies.saves).toContain('dex');
  expect(cycleSkillProf(c, 'arcana').proficiencies.skills.arcana).toBe('expertise');
  expect(cycleSkillProf(cycleSkillProf(c, 'arcana'), 'arcana').proficiencies.skills.arcana).toBe('none');
  expect(cycleSkillProf(c, 'stealth').proficiencies.skills.stealth).toBe('prof');
});

test('table mode spends and recovers slots within the maximum', () => {
  const wiz = newCharacter({ classes: [{ classId: 'wizard', name: { en: 'Wizard' }, level: 3, hitDie: 6, hitDiceUsed: 0, casterType: 'full', spellAbility: 'int' }] });
  let c = spendSlot(wiz, 2, 1);
  expect(c.spellcasting.slotsUsed[1]).toBe(1);
  c = spendSlot(spendSlot(spendSlot(c, 2, 1), 2, 1), 2, 1);
  expect(c.spellcasting.slotsUsed[1]).toBe(2);
  c = spendSlot(spendSlot(spendSlot(c, 2, -1), 2, -1), 2, -1);
  expect(c.spellcasting.slotsUsed[1]).toBe(0);
  expect(spendSlot(wiz, 5, 1).spellcasting.slotsUsed[4]).toBe(0);
});
