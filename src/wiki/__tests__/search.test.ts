import type { ContentEntry } from '../../content/types';
import { buildIndex, normalize, searchEntries } from '../search';

const spell = (id: string, en: string, es: string, level: number, extra: Partial<ContentEntry['data']> = {}): ContentEntry => ({
  id,
  category: 'spell',
  name: { en, es },
  text: { en: `${en} text`, es: `${es} texto` },
  source: 'srd',
  data: { level, school: 'evocation', classes: ['wizard'], concentration: false, ritual: false, ...extra },
});

const entries: ContentEntry[] = [
  spell('magic-missile', 'Magic Missile', 'Proyectil mágico', 1),
  spell('missile-shield', 'Shield of Missiles', 'Escudo de proyectiles', 2),
  spell('fireball', 'Fireball', 'Bola de fuego', 3, { classes: ['wizard', 'sorcerer'] }),
  spell('flaming-sphere', 'Flaming Sphere', 'Esfera flamígera', 2, { school: 'conjuration', concentration: true }),
  spell('detect-magic', 'Detect Magic', 'Detectar magia', 1, { ritual: true, concentration: true, classes: ['cleric', 'wizard'] }),
  { id: 'prone', category: 'condition', name: { en: 'Prone', es: 'Derribado' }, text: { en: 'You are on the ground.', es: 'Estás en el suelo. Proyectil.' }, source: 'srd' },
];
const index = buildIndex(entries);

test('normalize strips accents and case', () => {
  expect(normalize('Proyectil Mágico')).toBe('proyectil magico');
  expect(normalize('  ESFERA  Flamígera ')).toBe('esfera flamigera');
});

test('Spanish query without accents finds the spell first', () => {
  expect(searchEntries(index, 'proyectil magico')[0].id).toBe('magic-missile');
});

test('English query finds the same spell', () => {
  expect(searchEntries(index, 'Magic missile')[0].id).toBe('magic-missile');
});

test('name prefix outranks name contains, which outranks text match', () => {
  const ids = searchEntries(index, 'proyectil').map((e) => e.id);
  expect(ids[0]).toBe('magic-missile');
  expect(ids).toContain('missile-shield');
  expect(ids[ids.length - 1]).toBe('prone');
});

test('all words must match', () => {
  expect(searchEntries(index, 'bola agua')).toEqual([]);
});

test('filter by category', () => {
  expect(searchEntries(index, '', { category: 'condition' }).map((e) => e.id)).toEqual(['prone']);
});

test('filter spells by level, class, school, concentration and ritual', () => {
  expect(searchEntries(index, '', { spellLevel: 1 }).map((e) => e.id).sort()).toEqual(['detect-magic', 'magic-missile']);
  expect(searchEntries(index, '', { spellClass: 'sorcerer' }).map((e) => e.id)).toEqual(['fireball']);
  expect(searchEntries(index, '', { school: 'conjuration' }).map((e) => e.id)).toEqual(['flaming-sphere']);
  expect(searchEntries(index, '', { concentration: true }).map((e) => e.id).sort()).toEqual(['detect-magic', 'flaming-sphere']);
  expect(searchEntries(index, '', { ritual: true }).map((e) => e.id)).toEqual(['detect-magic']);
});

test('empty query sorts by name in the requested language', () => {
  const es = searchEntries(index, '', { category: 'spell' }, 'es').map((e) => e.name.es);
  expect(es[0]).toBe('Bola de fuego');
});
