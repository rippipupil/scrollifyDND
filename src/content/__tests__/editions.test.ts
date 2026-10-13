import { allEntries, getEntry, searchContent } from '..';
import { spellSlots } from '../../rules/spellcasting';
import { buildCharacterFromWizard, emptyDraft } from '../../sheet/wizard';
import { entryEra } from '../../wiki/search';

const external = allEntries().filter((e) => e.source === 'external');

test('every indexed option has a Spanish name, a book and a link', () => {
  for (const e of external) {
    expect(e.name.es).toBeTruthy();
    expect(e.book).toBeTruthy();
    expect(e.external && Object.keys(e.external).length).toBeTruthy();
  }
});

test('2014 options from the PDF books are indexed as legacy, without rules text', () => {
  const ancestral = getEntry('subclass:ext-subclass-path-of-the-ancestral-guardian');
  expect(ancestral?.name.es).toBe('Senda del Guardián Ancestral');
  expect(entryEra(ancestral!)).toBe('2014');
  expect(ancestral?.data.classId).toBe('barbarian');
  expect(ancestral?.text).toBeUndefined();
  expect(ancestral?.external?.wikidot).toBe('https://dnd5e.wikidot.com/barbarian:ancestral-guardian');
  expect(getEntry('species:ext-species-tabaxi')?.data).toMatchObject({ era: '2014', speed: 30, darkvision: 60 });
  expect(getEntry('feat:ext-feat-elven-accuracy')?.data).toMatchObject({ era: '2014', racial: true });
});

test('options replaced in 2024 are not duplicated as legacy entries', () => {
  // Path of the Totem Warrior became Path of the Wild Heart; Mobile became Speedy.
  expect(getEntry('subclass:ext-subclass-path-of-the-totem-warrior')).toBeUndefined();
  expect(getEntry('subclass:ext-subclass-path-of-the-wild-heart')).toBeDefined();
  expect(getEntry('feat:ext-feat-mobile')).toBeUndefined();
  expect(getEntry('feat:ext-feat-speedy')).toBeDefined();
});

test('2024-era books add their options as 5.5 content', () => {
  const moon = getEntry('subclass:ext-subclass-college-of-the-moon');
  expect(moon && entryEra(moon)).toBe('2024');
  expect(getEntry('feat:ext-feat-boon-of-speed')?.data.type).toBe('epic-boon');
  expect(getEntry('species:ext-species-warforged')?.name.es).toBe('Forjado (Warforged)');
});

test('the edition filter separates 5e and 5.5 options', () => {
  const legacy = searchContent('', { category: 'subclass', era: '2014' }, 'es');
  const current = searchContent('', { category: 'subclass', era: '2024' }, 'es');
  expect(legacy.length).toBeGreaterThan(40);
  expect(legacy.every((e) => e.data?.era === '2014')).toBe(true);
  expect(current.some((e) => e.source === 'srd')).toBe(true);
  expect(current.some((e) => e.data?.era === '2014')).toBe(false);
});

test('a 2024 artificer can be created: half caster with Intelligence, d8 hit die', () => {
  const c = buildCharacterFromWizard(
    { ...emptyDraft(), name: 'Tinka', classes: [{ key: 'class:ext-class-artificer', level: 3, subclassKey: 'subclass:ext-subclass-artificer-alchemist' }], speciesKey: 'species:gnome' },
    'es',
  );
  expect(c.classes[0]).toMatchObject({ hitDie: 8, casterType: 'half', spellAbility: 'int', subclassName: { en: 'Alchemist', es: 'Alquimista' } });
  expect(c.proficiencies.saves).toEqual(['con', 'int']);
  expect(c.proficiencies.armor).toEqual(['light', 'medium', 'shields']);
  expect(spellSlots(c).slots.slice(0, 2)).toEqual([3, 0]);
});

test('every indexed spell has our own bilingual rules card', () => {
  const spells = external.filter((e) => e.category === 'spell');
  expect(spells.length).toBeGreaterThan(200);
  for (const s of spells) {
    expect(s.data.rules?.es).toMatch(/\*\*/);
    expect(s.data.rules?.en).toMatch(/\*\*/);
  }
  expect(getEntry('spell:ext-spell-silvery-barbs')?.data.rules.es).toContain('repite el d20');
});

test('Chronurgy is found by its usual Spanish name', () => {
  const hit = searchContent('cronurgia', { category: 'subclass' }, 'es')[0];
  expect(hit?.id).toBe('ext-subclass-chronurgy-magic');
  expect(hit?.data.classId).toBe('wizard');
});
