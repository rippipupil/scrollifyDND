import {
  abilityMod,
  clampInt,
  d20Penalty,
  initiative,
  passive,
  profBonus,
  saveBonus,
  skillBonus,
  totalLevel,
} from '../core';
import { angvel } from './fixtures';

describe('abilityMod', () => {
  test.each([
    [16, 3],
    [19, 4],
    [10, 0],
    [9, -1],
    [1, -5],
    [30, 10],
  ])('score %i -> %i', (score, mod) => {
    expect(abilityMod(score)).toBe(mod);
  });
});

describe('profBonus', () => {
  test.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [9, 4],
    [13, 5],
    [17, 6],
    [20, 6],
  ])('level %i -> +%i', (lvl, pb) => {
    expect(profBonus(lvl)).toBe(pb);
  });
});

describe('Angvel derived values', () => {
  const c = angvel();
  test('total level', () => expect(totalLevel(c)).toBe(4));
  test('INT save +5 (proficient)', () => expect(saveBonus(c, 'int')).toBe(5));
  test('CHA save +4 (not proficient)', () => expect(saveBonus(c, 'cha')).toBe(4));
  test('Arcana +5', () => expect(skillBonus(c, 'arcana')).toBe(5));
  test('Insight +3', () => expect(skillBonus(c, 'insight')).toBe(3));
  test('Persuasion +4 (CHA, no prof)', () => expect(skillBonus(c, 'persuasion')).toBe(4));
  test('passive Perception 11', () => expect(passive(c, 'perception')).toBe(11));
  test('initiative +0', () => expect(initiative(c)).toBe(0));
});

test('expertise doubles proficiency', () => {
  const c = angvel();
  c.proficiencies.skills.arcana = 'expertise';
  expect(skillBonus(c, 'arcana')).toBe(7);
});

test('exhaustion 2 gives -4 to saves and skills', () => {
  const c = angvel();
  c.exhaustion = 2;
  expect(d20Penalty(c)).toBe(-4);
  expect(saveBonus(c, 'int')).toBe(1);
  expect(skillBonus(c, 'arcana')).toBe(1);
});

test('initiative override adds bonus', () => {
  const c = angvel();
  c.overrides.initiativeBonus = 2;
  expect(initiative(c)).toBe(2);
});

describe('clampInt', () => {
  test('empty string -> fallback', () => expect(clampInt('', 0, 30, 10)).toBe(10));
  test('negative clamps to min', () => expect(clampInt('-5', 0, 30, 10)).toBe(0));
  test('garbage -> fallback', () => expect(clampInt('abc', 0, 30, 7)).toBe(7));
  test('above max clamps', () => expect(clampInt(99, 0, 30, 7)).toBe(30));
  test('decimal truncates', () => expect(clampInt('12.7', 0, 30, 7)).toBe(12));
});
