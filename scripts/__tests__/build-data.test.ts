import * as path from 'node:path';
import { buildAll, cleanText, slugAidedd, slugify, slugWikidot } from '../lib/build';

const root = path.resolve(__dirname, '../..');
const all = buildAll({
  srd: path.join(root, 'data/srd-2024-en'),
  md: path.join(root, 'data/srd-md'),
  i18n: path.join(root, 'data/i18n/es'),
  external: path.join(root, 'data/external'),
});

test('SRD counts', () => {
  expect(all.spells).toHaveLength(339);
  expect(all.classes).toHaveLength(12);
  expect(all.monsters).toHaveLength(341);
  expect(all['magic-items']).toHaveLength(262);
  expect(all.conditions).toHaveLength(15);
  expect(all.species).toHaveLength(9);
});

test('every entry has an English name and unique id per file', () => {
  for (const [file, entries] of Object.entries(all)) {
    const seen = new Set<string>();
    for (const e of entries) {
      expect(e.name.en).toBeTruthy();
      expect(seen.has(e.id)).toBe(false);
      seen.add(e.id);
    }
    if (file !== "external") expect(entries.length).toBeGreaterThan(0);
  }
});

test('wizard level 4 has [4,3] slots and is a full INT caster', () => {
  const wiz = all.classes.find((c) => c.id === 'wizard')!;
  expect(wiz.data.casterType).toBe('full');
  expect(wiz.data.spellAbility).toBe('int');
  expect(wiz.data.hitDie).toBe(6);
  expect(wiz.data.levels[3].slots.slice(0, 3)).toEqual([4, 3, 0]);
});

test('fire bolt spell data', () => {
  const s = all.spells.find((x) => x.id === 'fire-bolt')!;
  expect(s.data.level).toBe(0);
  expect(s.data.classes).toContain('wizard');
  expect(s.data.school).toBe('evocation');
});

test('longsword weapon data', () => {
  const w = all.equipment.find((x) => x.id === 'longsword')!;
  expect(w.data.weapon).toMatchObject({ damage: '1d8', damageType: 'slashing', versatileDamage: '1d10', martial: true, ranged: false, mastery: 'sap' });
  const chain = all.equipment.find((x) => x.id === 'chain-mail')!;
  expect(chain.data.armor).toMatchObject({ base: 16, type: 'heavy', strMin: 13, stealthDisadvantage: true });
});

test('rules glossary excludes conditions and converts tables', () => {
  expect(all.rules.find((r) => r.id === 'rule-blinded')).toBeUndefined();
  const action = all.rules.find((r) => r.id === 'rule-action')!;
  expect(action.text!.en).toContain('| Attack |');
  expect(all.rules.find((r) => r.id === 'rule-concentration')!.text!.en).toContain('half the damage');
});

test('cleanText joins PDF hyphenation', () => {
  expect(cleanText('one ex- pended use')).toBe('one expended use');
});

test('slugify', () => {
  expect(slugify("Tasha's Hideous Laughter")).toBe('tashas-hideous-laughter');
  expect(slugify('Esfera flamígera')).toBe('esfera-flamigera');
});

test('spell formulaic fields get automatic Spanish', () => {
  const s = all.spells.find((x) => x.id === 'fireball')!;
  expect(s.data.castingTime.es).toBe('Acción');
  expect(s.data.range.es).toBe('45 m');
  expect(s.data.duration.es).toBe('Instantánea');
  expect(all.spells.find((x) => x.id === 'arcane-lock')!.data.material.en.startsWith('(')).toBe(false);
  expect(all.spells.every((x) => !x.data.range.en.includes('Component'))).toBe(true);
});

test('spell text comes from clean SRD markdown when available', () => {
  const cw = all.spells.find((x) => x.id === 'control-water')!;
  expect(cw.text!.en).not.toContain('Precipitation');
  expect(all.spells.find((x) => x.id === 'fireball')!.data.higherLevel.en).toMatch(/^The damage increases by 1d6/);
});

test('every spell is fully translated to Spanish', () => {
  const missing = all.spells.filter(
    (s) => !s.name.es || !s.text?.es || (s.data.higherLevel && !s.data.higherLevel.es) || (s.data.material && !s.data.material.es),
  );
  expect(missing.map((s) => s.id)).toEqual([]);
});

test('conditions, masteries and weapon properties are translated', () => {
  for (const k of ['conditions', 'masteries', 'weapon-properties']) {
    expect(all[k].filter((e) => !e.name.es || !e.text?.es).map((e) => e.id)).toEqual([]);
  }
});

test('species text comes from SRD markdown and includes every trait', () => {
  const db = all.species.find((s) => s.id === 'dragonborn')!;
  expect(db.text!.en).toContain('_Breath Weapon._');
  expect(db.text!.en).toContain('| Black | Acid | Gold | Fire |');
  expect(all.species.find((s) => s.id === 'tiefling')!.data.size).toBe('Small or Medium');
});

test('species traits are split and aligned EN/ES', () => {
  const db = all.species.find((s) => s.id === 'dragonborn')!;
  const names = db.data.traits.map((t: any) => t.name.en);
  expect(names).toEqual(['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance', 'Darkvision', 'Draconic Flight']);
  expect(db.data.traits[1].name.es).toBe('Arma de aliento');
  expect(db.data.traits[1].text.en).toContain('Long Rest');
  for (const sp of all.species) expect(sp.data.traits.every((t: any) => t.name.es)).toBe(true);
});

test('external index has links and facts only', () => {
  const sb = all.external.find((e) => e.name.en === 'Silvery Barbs')!;
  expect(sb.category).toBe('spell');
  expect(sb.source).toBe('external');
  expect(sb.text).toBeUndefined();
  expect(sb.id).toBe('ext-spell-silvery-barbs');
  expect(sb.name.es).toBe('Púas plateadas');
  expect(sb.book).toBe('Strixhaven: A Curriculum of Chaos');
  expect(sb.data).toMatchObject({ level: 1, school: 'enchantment', classes: ['bard', 'sorcerer', 'wizard'], castingTime: { n: 1, unit: 'reaction' }, range: { kind: 'feet', amount: 60 } });
  expect(all.external.some((e) => e.name.en === 'Aasimar' && e.category === 'species')).toBe(true);
});

test('pre-2024 spells link to the 2014 wiki and AideDD 2014 pages', () => {
  const sb = all.external.find((e) => e.name.en === 'Silvery Barbs')!;
  expect(sb.external!.wikidot).toBe('https://dnd5e.wikidot.com/spell:silvery-barbs');
  expect(sb.external!.aidedd).toBe('https://www.aidedd.org/dnd/sorts.php?vo=silvery-barbs');
  expect(sb.external!.aideddEs).toBeUndefined();
});

test('2024 spells outside the SRD use the 2024 wiki and the official Spanish name', () => {
  const t = all.external.find((e) => e.name.en === 'Toll the Dead')!;
  expect(t.name.es).toBe('Tañido por los muertos');
  expect(t.external).toMatchObject({
    wikidot: 'https://dnd2024.wikidot.com/spell:toll-the-dead',
    aidedd: 'https://www.aidedd.org/spell/toll-the-dead',
    aideddEs: 'https://www.aidedd.org/spell/es/tanido-por-los-muertos',
  });
});

test('SRD spells link straight to their pages, with the PHB name where the SRD renamed the spell', () => {
  const hand = all.spells.find((e) => e.id === 'arcane-hand')!;
  expect(hand.name.es).toBe('Mano arcana');
  expect(hand.external).toMatchObject({
    wikidot: 'https://dnd2024.wikidot.com/spell:bigbys-hand',
    aidedd: 'https://www.aidedd.org/spell/bigby-s-hand',
    aideddEs: 'https://www.aidedd.org/spell/es/mano-de-bigby',
  });
  const cs = all.spells.find((e) => e.id === 'counterspell')!;
  expect(cs.name.es).toBe('Contrahechizo');
  expect(cs.external!.aideddEs).toBe('https://www.aidedd.org/spell/es/contrahechizo');
  expect(all.spells.find((e) => e.id === 'beacon-of-hope')!.external!.aideddEs).toBe('https://www.aidedd.org/spell/es/senal-de-esperanza');
});

test('the spell index covers the other official books, all named in Spanish, without SRD duplicates', () => {
  const ext = all.external.filter((e) => e.category === 'spell');
  const names = ext.map((e) => e.name.en);
  expect(names).toEqual(expect.arrayContaining(['Booming Blade', 'Green-Flame Blade', "Tasha's Mind Whip", 'Toll the Dead', 'Silvery Barbs']));
  expect(ext.length).toBeGreaterThan(200);
  expect(new Set(names).size).toBe(names.length);
  const srd = new Set(all.spells.map((s) => s.name.en));
  expect(names.filter((n) => srd.has(n))).toEqual([]);
  expect(ext.filter((e) => !e.name.es).map((e) => e.name.en)).toEqual([]);
});

test('other categories link directly to the 2024 wiki', () => {
  const link = (cat: string, id: string) => all[cat].find((e) => e.id === id)!.external!;
  expect(link('feats', 'alert').wikidot).toBe('https://dnd2024.wikidot.com/feat:alert');
  expect(link('backgrounds', 'acolyte').wikidot).toBe('https://dnd2024.wikidot.com/background:acolyte');
  expect(link('species', 'dwarf').wikidot).toBe('https://dnd2024.wikidot.com/species:dwarf');
  expect(link('classes', 'wizard').wikidot).toBe('https://dnd2024.wikidot.com/wizard:main');
  expect(link('subclasses', 'college-of-lore').wikidot).toBe('https://dnd2024.wikidot.com/bard:college-of-lore');
  expect(link('magic-items', 'ammunition-1').wikidot).toBe('https://dnd2024.wikidot.com/magic-item:ammunition');
  expect(link('magic-items', 'adamantine-armor').aidedd).toBe('https://www.aidedd.org/magic-item/adamantine-armor');
  const wild = all.external.find((e) => e.name.en === 'Path of the Wild Heart')!;
  expect(wild.external!.wikidot).toBe('https://dnd2024.wikidot.com/barbarian:path-of-the-wild-heart');
  expect(all.external.find((e) => e.name.en === 'Aasimar')!.external!.wikidot).toBe('https://dnd2024.wikidot.com/species:aasimar');
});

test('site slugs: AideDD turns apostrophes into dashes, Wikidot drops them', () => {
  expect(slugAidedd("Leomund's Tiny Hut")).toBe('leomund-s-tiny-hut');
  expect(slugWikidot("Leomund's Tiny Hut")).toBe('leomunds-tiny-hut');
  expect(slugAidedd('Sordera/ceguera')).toBe('sordera-ceguera');
  expect(slugAidedd('Señal de esperanza')).toBe('senal-de-esperanza');
});

test('class and background equipment options are structured', () => {
  const f = all.classes.find((c) => c.id === 'fighter')!;
  expect(f.data.equipmentOptions).toHaveLength(3);
  expect(f.data.equipmentOptions[0].items).toContainEqual({ id: 'javelin', name: 'Javelin', qty: 8 });
  expect(f.data.equipmentOptions[0].gold).toBe(4);
  expect(f.data.equipmentOptions[2]).toEqual({ items: [], gold: 155 });
  const soldier = all.backgrounds.find((b) => b.id === 'soldier')!;
  expect(soldier.data.equipmentOptions[1].gold).toBe(50);
});
