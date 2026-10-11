import { maxHp } from '../../rules/health';
import { spellSlots } from '../../rules/spellcasting';
import { applyBackgroundAsi, buildCharacterFromWizard, emptyDraft, pointBuyCost, POINT_BUY_BUDGET, STANDARD_ARRAY } from '../wizard';

const base = { str: 8, dex: 10, con: 13, int: 15, wis: 12, cha: 14 };

test('standard array and point buy costs', () => {
  expect(STANDARD_ARRAY).toEqual([15, 14, 13, 12, 10, 8]);
  expect(pointBuyCost({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })).toBe(0);
  expect(pointBuyCost({ str: 15, dex: 15, con: 15, int: 8, wis: 8, cha: 8 })).toBe(POINT_BUY_BUDGET);
  expect(pointBuyCost({ str: 16, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })).toBe(Infinity);
});

test('background ASI +2/+1 and +1/+1/+1, capped at 20', () => {
  expect(applyBackgroundAsi(base, ['int', 'wis', 'cha'], { mode: '21', plus2: 'int', plus1: 'wis' })).toMatchObject({ int: 17, wis: 13, cha: 14 });
  expect(applyBackgroundAsi(base, ['int', 'wis', 'cha'], { mode: '111' })).toMatchObject({ int: 16, wis: 13, cha: 15 });
  expect(applyBackgroundAsi({ ...base, int: 19 }, ['int', 'wis', 'cha'], { mode: '21', plus2: 'int', plus1: 'wis' }).int).toBe(20);
});

test('ASI picks outside the background abilities are ignored', () => {
  expect(applyBackgroundAsi(base, ['int', 'wis', 'cha'], { mode: '21', plus2: 'str', plus1: 'wis' })).toMatchObject({ str: 8, wis: 13 });
});

test('builds a level 4 sage wizard from the wizard draft', () => {
  const c = buildCharacterFromWizard(
    {
      ...emptyDraft(),
      name: 'Angvel',
      player: 'Pablo',
      classes: [{ key: 'class:wizard', level: 4 }],
      speciesKey: 'species:human',
      backgroundKey: 'background:sage',
      baseScores: base,
      asi: { mode: '21', plus2: 'int', plus1: 'con' },
      skills: ['arcana', 'insight'],
      classEquipment: 0,
      backgroundEquipment: 1,
    },
    'es',
  );
  expect(c.name).toBe('Angvel');
  expect(c.classes[0]).toMatchObject({ classId: 'wizard', level: 4, hitDie: 6, casterType: 'full', spellAbility: 'int' });
  expect(c.abilities).toMatchObject({ int: 17, con: 14 });
  expect(c.proficiencies.saves).toEqual(['int', 'wis']);
  expect(c.proficiencies.skills).toMatchObject({ arcana: 'prof', insight: 'prof', history: 'prof' });
  expect(c.proficiencies.weapons).toContain('simple');
  expect(c.species.name.es).toBe('Humano');
  expect(c.speed).toBe(30);
  expect(c.features.map((f) => f.name)).toEqual(expect.arrayContaining(['Ingenioso', 'Iniciado en la magia']));
  expect(c.features.some((f) => f.source === 'feature')).toBe(true);
  expect(c.inventory.find((i) => i.ref === 'equipment:dagger')?.qty).toBe(2);
  expect(c.currency.gp).toBe(5 + 50);
  expect(c.hp.current).toBe(maxHp(c));
  expect(spellSlots(c).slots.slice(0, 2)).toEqual([4, 3]);
});

test('multiclass keeps saves from the first class only', () => {
  const c = buildCharacterFromWizard({ ...emptyDraft(), name: 'X', classes: [{ key: 'class:fighter', level: 1 }, { key: 'class:wizard', level: 1 }], baseScores: base }, 'es');
  expect(c.classes.map((k) => k.classId)).toEqual(['fighter', 'wizard']);
  expect(c.proficiencies.saves).toEqual(['str', 'con']);
});

test('custom species and background by name', () => {
  const c = buildCharacterFromWizard({ ...emptyDraft(), name: 'X', classes: [{ key: 'class:wizard', level: 1 }], customSpeciesName: 'Aasimar caído', customBackgroundName: 'Heladero', baseScores: base }, 'es');
  expect(c.species.name.es).toBe('Aasimar caído');
  expect(c.background.name.es).toBe('Heladero');
});

test('homebrew species without traits becomes a single feature with its text', () => {
  const hb = { id: 'hb-aasimar', category: 'species' as const, name: { en: 'Fallen Aasimar', es: 'Aasimar caído' }, text: { en: 'Necrotic shroud', es: 'Sudario necrótico' }, source: 'homebrew' as const, data: { speed: 30, size: 'Medium' } };
  const c = buildCharacterFromWizard({ ...emptyDraft(), name: 'X', classes: [{ key: 'class:wizard', level: 1 }], speciesKey: 'species:hb-aasimar', baseScores: base }, 'es', [hb]);
  expect(c.species.name.es).toBe('Aasimar caído');
  expect(c.features[0]).toMatchObject({ name: 'Aasimar caído', text: 'Sudario necrótico' });
});
