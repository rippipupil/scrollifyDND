import { allEntries, getEntry } from '../../content';
import { classScaling, subclassesOf, subclassLevels } from '../classInfo';

const levels = (id: string) => getEntry(`class:${id}`)!.data.levels;
const row = (id: string, key: string) => classScaling(levels(id)).find((r) => r.key === key);

test('class columns become steps at the levels where they change', () => {
  expect(row('barbarian', 'rage_damage_bonus')?.steps).toEqual([
    { level: 1, value: '+2' },
    { level: 9, value: '+3' },
    { level: 16, value: '+4' },
  ]);
  expect(row('rogue', 'sneak_attack')?.steps.slice(0, 3)).toEqual([
    { level: 1, value: '1d6' },
    { level: 3, value: '2d6' },
    { level: 5, value: '3d6' },
  ]);
  expect(row('monk', 'martial_arts_die')?.steps[0]).toEqual({ level: 1, value: 'd6' });
  expect(row('monk', 'unarmored_movement_bonus')).toMatchObject({ kind: 'distance', steps: expect.arrayContaining([{ level: 2, value: 10 }]) });
  // Zero means "not yet": Wild Shape starts at level 2.
  expect(row('druid', 'wild_shape_uses')?.steps[0]).toEqual({ level: 2, value: 2 });
});

test('spellcasting and proficiency bonus are included', () => {
  expect(row('wizard', 'maxSpellLevel')?.steps.map((s) => s.level)).toEqual([1, 3, 5, 7, 9, 11, 13, 15, 17]);
  expect(row('paladin', 'maxSpellLevel')?.steps[0]).toEqual({ level: 1, value: 1 });
  expect(row('fighter', 'maxSpellLevel')).toBeUndefined();
  expect(row('fighter', 'prof')?.steps).toEqual([
    { level: 1, value: '+2' },
    { level: 5, value: '+3' },
    { level: 9, value: '+4' },
    { level: 13, value: '+5' },
    { level: 17, value: '+6' },
  ]);
});

test('a class lists every subclass, 2024 first, and its subclass levels', () => {
  const all = allEntries();
  const name = (e: { name: { en: string } }) => e.name.en;
  const wizard = subclassesOf('wizard', all, name);
  expect(wizard.map((s) => s.id)).toEqual(expect.arrayContaining(['evoker', 'ext-subclass-chronurgy-magic']));
  expect(wizard.findIndex((s) => s.data?.era === '2014')).toBeGreaterThan(wizard.findIndex((s) => s.id === 'evoker'));
  expect(subclassesOf('ext-class-artificer', all, name).length).toBeGreaterThanOrEqual(5);
  expect(subclassLevels(subclassesOf('fighter', all, name))).toEqual([3, 7, 10, 15, 18]);
});
