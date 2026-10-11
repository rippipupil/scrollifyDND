/*
 * Converts vendored SRD 5.2 data into the app's ContentEntry format.
 * Pure functions over a source directory; no writes (see scripts/build-data.ts).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { autoEs } from './auto-es.ts';
import { htmlTableToPipes, parseMdSections, parseSpellsMd, type MdSpell } from './spells-md.ts';

type Loc = { en: string; es?: string };
type Entry = {
  id: string;
  category: string;
  name: Loc;
  text?: Loc;
  source: 'srd' | 'external';
  data?: any;
  external?: Record<string, string>;
  book?: string;
};
type EsMap = Record<string, Record<string, string>>;

export const CASTER: Record<string, { type: string; ability?: string }> = {
  bard: { type: 'full', ability: 'cha' },
  cleric: { type: 'full', ability: 'wis' },
  druid: { type: 'full', ability: 'wis' },
  sorcerer: { type: 'full', ability: 'cha' },
  wizard: { type: 'full', ability: 'int' },
  paladin: { type: 'half', ability: 'cha' },
  ranger: { type: 'half', ability: 'wis' },
  warlock: { type: 'pact', ability: 'cha' },
};

function readJson(dir: string, file: string): any[] {
  return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
}

/** Loads `<name>.json` plus every `<name>/*.json` part file, merged by id. */
function loadEs(i18nDir: string, file: string): EsMap {
  const merged: EsMap = {};
  const add = (p: string) => {
    for (const [id, v] of Object.entries(JSON.parse(fs.readFileSync(p, 'utf8')) as EsMap)) merged[id] = { ...merged[id], ...v };
  };
  const single = path.join(i18nDir, file);
  if (fs.existsSync(single)) add(single);
  const dir = path.join(i18nDir, file.replace(/\.json$/, ''));
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) add(path.join(dir, f));
  return merged;
}

const loc = (en: string | undefined, es?: string): Loc => (es ? { en: en ?? '', es } : { en: en ?? '' });
const ids = (list: any[] | undefined): string[] => (list ?? []).map((x) => x.index);

/** Normalizes SRD text: unwraps hyphenated line breaks from PDF extraction, trims indentation. */
export function cleanText(s: string | string[] | undefined): string {
  if (!s) return '';
  const joined = Array.isArray(s) ? s.join('\n\n') : s;
  return joined
    .replace(/(\w)- (\w)/g, '$1$2')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function withEs(entry: Entry, es: EsMap): Entry {
  const t = es[entry.id];
  if (!t) return entry;
  const out: Entry = { ...entry, name: loc(entry.name.en, t.name) };
  if (entry.text) out.text = loc(entry.text.en, t.text);
  if (entry.data && typeof entry.data === 'object') {
    const data = { ...entry.data };
    for (const [k, v] of Object.entries(t)) {
      if (k === 'name' || k === 'text') continue;
      const cur = data[k];
      if (cur && typeof cur === 'object' && 'en' in cur) data[k] = loc(cur.en, v);
    }
    out.data = data;
  }
  return out;
}

function cleanMaterial(m: string | undefined): string | undefined {
  if (!m) return undefined;
  const t = m.trim();
  return t.startsWith('(') && !t.endsWith(')') ? t.slice(1) : t;
}

function fillAuto(l: Loc | undefined): Loc | undefined {
  if (!l || l.es) return l;
  const es = autoEs(l.en);
  return es ? { en: l.en, es } : l;
}

export function buildSpells(src: string, es: EsMap, md: Map<string, MdSpell> = new Map()): Entry[] {
  return readJson(src, '5e-SRD-Spells.json').map((s) => {
    const clean = md.get(s.index) ?? md.get(slugify(s.name));
    const e = withEs(
      {
        id: s.index,
        category: 'spell',
        name: loc(s.name),
        text: loc(clean?.text ?? cleanText(s.description)),
        source: 'srd',
        data: {
          level: s.level,
          school: s.school.index,
          classes: ids(s.classes),
          castingTime: loc(s.casting_time),
          range: loc(String(s.range).replace(/\s+Component:.*$/i, '')),
          components: s.components ?? [],
          material: s.material ? loc(cleanMaterial(s.material)) : undefined,
          duration: loc(s.duration),
          concentration: !!s.concentration,
          ritual: !!s.ritual,
          higherLevel: clean?.higherLevel
            ? loc(clean.higherLevel)
            : s.higher_level
              ? loc(cleanText(s.higher_level))
              : undefined,
          attackType: s.attack_type,
          damageType: s.damage?.damage_type?.index,
        },
      },
      es,
    );
    e.data.castingTime = fillAuto(e.data.castingTime);
    e.data.range = fillAuto(e.data.range);
    e.data.duration = fillAuto(e.data.duration);
    return e;
  });
}

function costText(c: any): string | undefined {
  return c ? `${c.quantity} ${c.unit}` : undefined;
}

export function buildEquipment(src: string, es: EsMap): Entry[] {
  const items = readJson(src, '5e-SRD-Equipment.json').map((e) => {
    const cats = ids(e.equipment_categories);
    const text = cleanText([e.description, e.notes].flat().filter(Boolean) as string[]);
    return withEs(
      {
        id: e.index,
        category: 'equipment',
        name: loc(e.name),
        text: text ? loc(text) : undefined,
        source: 'srd',
        data: {
          categories: cats,
          cost: costText(e.cost),
          weight: e.weight ?? 0,
          armor: e.armor_class
            ? {
                base: e.armor_class.base,
                type: cats.includes('heavy-armor') ? 'heavy' : cats.includes('medium-armor') ? 'medium' : cats.includes('light-armor') ? 'light' : 'shield',
                strMin: e.str_minimum || undefined,
                stealthDisadvantage: !!e.stealth_disadvantage,
              }
            : undefined,
          weapon: e.damage
            ? {
                damage: e.damage.damage_dice,
                damageType: e.damage.damage_type?.index,
                versatileDamage: e.two_handed_damage?.damage_dice,
                properties: ids(e.properties),
                mastery: e.mastery?.index,
                martial: cats.includes('martial-weapons'),
                ranged: cats.includes('ranged-weapons'),
                range: e.range ? `${e.range.normal}${e.range.long ? '/' + e.range.long : ''}` : undefined,
                throwRange: e.throw_range ? `${e.throw_range.normal}/${e.throw_range.long}` : undefined,
              }
            : undefined,
          quantity: e.quantity,
          contents: e.contents?.map((c: any) => ({ id: c.item.index, qty: c.quantity })),
        },
      },
      es,
    );
  });
  const poisons = readJson(src, '5e-SRD-Poisons.json').map((p) =>
    withEs(
      {
        id: `poison-${p.index}`,
        category: 'equipment',
        name: loc(p.name),
        text: loc(cleanText(p.description)),
        source: 'srd',
        data: { categories: ['poison'], cost: costText(p.cost), weight: 0, poisonType: p.type },
      },
      es,
    ),
  );
  return [...items, ...poisons];
}

export function buildMagicItems(src: string, es: EsMap): Entry[] {
  return readJson(src, '5e-SRD-Magic-Items.json').map((m) =>
    withEs(
      {
        id: m.index,
        category: 'magic-item',
        name: loc(m.name),
        text: loc(cleanText(m.desc)),
        source: 'srd',
        data: {
          rarity: m.rarity?.name,
          attunement: !!m.attunement,
          itemCategory: m.equipment_category?.index,
          variant: !!m.variant,
          variants: ids(m.variants),
        },
      },
      es,
    ),
  );
}

export function buildFeatures(src: string, es: EsMap): Entry[] {
  return readJson(src, '5e-SRD-Features.json').map((f) =>
    withEs(
      {
        id: f.index,
        category: 'feature',
        name: loc(f.name),
        text: loc(cleanText(f.description)),
        source: 'srd',
        data: { classId: f.class?.index, level: Number(String(f.level?.index ?? '').split('-').pop()) || undefined, subclassId: f.subclass?.index },
      },
      es,
    ),
  );
}

function choiceSummary(choices: any[] | undefined) {
  return (choices ?? []).map((c) => ({
    desc: c.desc,
    choose: c.choose,
    options: (c.from?.options ?? []).map((o: any) => o.item?.index).filter(Boolean),
  }));
}

export function buildClasses(src: string, es: EsMap): Entry[] {
  const levels = readJson(src, '5e-SRD-Levels.json');
  return readJson(src, '5e-SRD-Classes.json').map((k) => {
    const lv = levels
      .filter((l) => l.class?.index === k.index && !l.subclass)
      .sort((a, b) => a.level - b.level)
      .map((l) => ({
        level: l.level,
        prof: l.prof_bonus,
        features: ids(l.features),
        cantrips: l.spellcasting?.cantrips_known,
        prepared: l.spellcasting?.prepared_spells,
        slots: l.spellcasting
          ? [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => l.spellcasting[`spell_slots_level_${n}`] ?? 0)
          : undefined,
        classSpecific: l.class_specific,
      }));
    const caster = CASTER[k.index] ?? { type: 'none' };
    const lines = [
      `**Hit Point Die:** d${k.hit_die}`,
      k.primary_ability?.desc ? `**Primary Ability:** ${k.primary_ability.desc}` : '',
      `**Saving Throws:** ${(k.saving_throws ?? []).map((s: any) => s.name).join(', ')}`,
      ...(k.proficiency_choices ?? []).map((c: any) => `**Skills:** ${c.desc}`),
      `**Proficiencies:** ${(k.proficiencies ?? []).filter((p: any) => !p.index.startsWith('saving-throw')).map((p: any) => p.name).join(', ')}`,
      ...(k.starting_equipment_options ?? []).map((o: any) => `**Starting Equipment:** ${o.desc}`),
    ].filter(Boolean);
    return withEs(
      {
        id: k.index,
        category: 'class',
        name: loc(k.name),
        text: loc(lines.join('\n\n')),
        source: 'srd',
        data: {
          hitDie: k.hit_die,
          saves: ids(k.saving_throws),
          primaryAbility: ids(k.primary_ability?.ability_scores),
          proficiencies: ids(k.proficiencies).filter((p) => !p.startsWith('saving-throw')),
          skillChoices: choiceSummary(k.proficiency_choices),
          startingEquipment: (k.starting_equipment_options ?? []).map((o: any) => o.desc),
          casterType: caster.type,
          spellAbility: caster.ability,
          subclasses: ids(k.subclasses),
          levels: lv,
        },
      },
      es,
    );
  });
}

export function buildSubclasses(src: string, es: EsMap): Entry[] {
  return readJson(src, '5e-SRD-Subclasses.json').map((s) => {
    const feats = (s.features ?? []).map((f: any) => `### ${f.name} (${f.level})\n\n${cleanText(f.description)}`);
    return withEs(
      {
        id: s.index,
        category: 'subclass',
        name: loc(s.name),
        text: loc([`_${s.summary ?? ''}_`, cleanText(s.description), ...feats].filter(Boolean).join('\n\n')),
        source: 'srd',
        data: {
          classId: s.class?.index,
          features: (s.features ?? []).map((f: any) => ({ name: loc(f.name), level: f.level })),
        },
      },
      es,
    );
  });
}

export function buildSpecies(src: string, es: EsMap, esTraits: EsMap, md: Map<string, MdSpell> = new Map()): Entry[] {
  const traits = readJson(src, '5e-SRD-Traits.json');
  const subspecies = readJson(src, '5e-SRD-Subspecies.json');
  const traitById = new Map(traits.map((t) => [t.index, t]));
  return readJson(src, '5e-SRD-Species.json').map((sp) => {
    const tlist = (sp.traits ?? []).map((t: any) => traitById.get(t.index)).filter(Boolean);
    const traitText = (lang: 'en' | 'es') =>
      tlist
        .map((t: any) => {
          const tr = esTraits[t.index];
          const name = lang === 'es' && tr?.name ? tr.name : t.name;
          const body = lang === 'es' && tr?.text ? tr.text : cleanText(t.description);
          return `### ${name}\n\n${body}`;
        })
        .join('\n\n');
    const size = sp.size ?? (sp.size_options?.from?.options ?? []).map((o: any) => o.size).join(' or ');
    const header = `**Creature Type:** ${sp.type} · **Size:** ${size} · **Speed:** ${sp.speed} ft.`;
    const e = es[sp.index];
    const enText = md.get(sp.index)?.text ?? `${header}\n\n${traitText('en')}`;
    const entry: Entry = {
      id: sp.index,
      category: 'species',
      name: loc(sp.name, e?.name),
      text: loc(enText, e?.text),
      source: 'srd',
      data: {
        type: sp.type,
        size,
        speed: sp.speed,
        traits: md.get(sp.index) ? alignTraits(splitTraits(enText), e?.text ? splitTraits(e.text) : []) : tlist.map((t: any) => ({ id: t.index, name: loc(t.name, esTraits[t.index]?.name), text: loc(cleanText(t.description), esTraits[t.index]?.text) })),
        subspecies: subspecies
          .filter((s) => s.species?.index === sp.index)
          .map((s) => ({ id: s.index, name: loc(s.name, es[s.index]?.name), damageType: s.damage_type?.index })),
        darkvision: tlist.some((t: any) => t.index.startsWith('darkvision')) ? Number(tlist.find((t: any) => t.index.startsWith('darkvision')).index.split('-')[1]) : 0,
      },
    };
    return entry;
  });
}

/** Splits species text into "_Trait._ body" blocks (body runs until the next trait or table heading). */
export function splitTraits(text: string): { name: string; text: string }[] {
  const out: { name: string; text: string }[] = [];
  for (const para of text.split(/\n\n/)) {
    const m = /^_([^_]+?)\._\s*([\s\S]*)$/.exec(para);
    if (m) out.push({ name: m[1], text: m[2] });
    else if (out.length) out[out.length - 1].text += `\n\n${para}`;
  }
  return out;
}

function alignTraits(en: { name: string; text: string }[], es: { name: string; text: string }[]) {
  return en.map((t, i) => ({
    id: slugify(t.name),
    name: loc(t.name, es.length === en.length ? es[i].name : undefined),
    text: loc(t.text, es.length === en.length ? es[i].text : undefined),
  }));
}

export function buildBackgrounds(src: string, es: EsMap): Entry[] {
  return readJson(src, '5e-SRD-Backgrounds.json').map((b) => {
    const skills = ids(b.proficiencies).filter((p) => p.startsWith('skill-')).map((p) => p.replace('skill-', ''));
    const tools = (b.proficiencies ?? []).filter((p: any) => p.index.startsWith('tool-')).map((p: any) => p.name.replace('Tool: ', ''));
    const lines = [
      `**Ability Scores:** ${(b.ability_scores ?? []).map((a: any) => a.name).join(', ')}`,
      `**Feat:** ${b.feat?.name}${b.feat?.note ? ` (${b.feat.note})` : ''}`,
      `**Skill Proficiencies:** ${(b.proficiencies ?? []).filter((p: any) => p.index.startsWith('skill-')).map((p: any) => p.name.replace('Skill: ', '')).join(', ')}`,
      tools.length ? `**Tool Proficiency:** ${tools.join(', ')}` : '',
      ...(b.proficiency_choices ?? []).map((c: any) => `**Tool Proficiency:** ${c.desc}`),
      ...(b.equipment_options ?? []).map((o: any) => `**Equipment:** ${o.desc}`),
    ].filter(Boolean);
    return withEs(
      {
        id: b.index,
        category: 'background',
        name: loc(b.name),
        text: loc(lines.join('\n\n')),
        source: 'srd',
        data: {
          abilities: ids(b.ability_scores),
          feat: b.feat?.index,
          featNote: b.feat?.note,
          skills,
          tools,
          equipment: (b.equipment_options ?? []).map((o: any) => o.desc),
        },
      },
      es,
    );
  });
}

export function buildSimple(src: string, file: string, category: string, es: EsMap, extra?: (x: any) => any): Entry[] {
  return readJson(src, file).map((x) =>
    withEs(
      {
        id: x.index,
        category,
        name: loc(x.name),
        text: loc(cleanText(x.description ?? x.desc)),
        source: 'srd',
        data: extra ? extra(x) : undefined,
      },
      es,
    ),
  );
}

export function buildMonsters(src: string, es: EsMap): Entry[] {
  return readJson(src, '5e-SRD-Monsters.json').map((m) => {
    const { url, image, index, name, ...rest } = m;
    return withEs({ id: index, category: 'monster', name: loc(name), source: 'srd', data: rest }, es);
  });
}

/** Rules glossary entries from SRD 5.2.1 markdown ("#### Term" sections). Conditions are skipped. */
export function buildRules(mdFile: string, es: EsMap): Entry[] {
  const md = fs.readFileSync(mdFile, 'utf8');
  const body = md.slice(md.indexOf('## Rules Definitions'));
  const parts = body.split(/^#### /m).slice(1);
  return parts
    .map((p) => {
      const nl = p.indexOf('\n');
      const title = p.slice(0, nl).trim();
      const raw = p
        .slice(nl + 1)
        .replace(/^###? .*$/gm, '')
        .replace(/<table>[\s\S]*?<\/table>/g, (t) => htmlTableToPipes(t));
      const tag = /\[(.+)\]$/.exec(title)?.[1];
      const name = title.replace(/\s*\[.+\]$/, '');
      const id = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      return { id: `rule-${id}`, name, tag, text: cleanText(raw) };
    })
    .filter((r) => r.tag !== 'Condition')
    .map((r) => withEs({ id: r.id, category: 'rule', name: loc(r.name), text: loc(r.text), source: 'srd', data: { tag: r.tag } }, es));
}

export function buildExternal(dir: string): Entry[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as any[])
    .map((x) => {
      const slugEn = x.slugEn ?? slugify(x.name.en);
      const kind = x.category === 'spell' ? 'spell' : x.category === 'magic-item' ? 'magic-item' : null;
      const external: Record<string, string> = {
        nivel20: `https://www.google.com/search?q=${encodeURIComponent(`site:nivel20.com ${x.name.es ?? x.name.en}`)}`,
        wikidot:
          x.category === 'spell'
            ? `http://dnd2024.wikidot.com/spell:${slugEn}`
            : `https://www.google.com/search?q=${encodeURIComponent(`site:dnd2024.wikidot.com ${x.name.en}`)}`,
      };
      if (kind) {
        external.aidedd = `https://www.aidedd.org/${kind}/${slugEn}`;
        external.aideddEs = `https://www.google.com/search?q=${encodeURIComponent(`site:aidedd.org/${kind}/es ${x.name.es ?? x.name.en}`)}`;
      } else {
        external.aidedd = `https://www.google.com/search?q=${encodeURIComponent(`site:aidedd.org ${x.name.en}`)}`;
      }
      return { id: `ext-${x.category}-${slugEn}`, category: x.category, name: x.name, source: 'external' as const, data: x.data, external, book: x.book };
    });
}

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface BuildPaths {
  srd: string;
  md: string;
  i18n: string;
  external: string;
}

export function buildAll(p: BuildPaths): Record<string, Entry[]> {
  const es = (f: string) => loadEs(p.i18n, f);
  return {
    spells: buildSpells(p.srd, es('spells.json'), parseSpellsMd(path.join(p.md, 'spells.md'))),
    equipment: buildEquipment(p.srd, es('equipment.json')),
    'magic-items': buildMagicItems(p.srd, es('magic-items.json')),
    classes: buildClasses(p.srd, es('classes.json')),
    subclasses: buildSubclasses(p.srd, es('subclasses.json')),
    features: buildFeatures(p.srd, es('features.json')),
    species: buildSpecies(p.srd, es('species.json'), es('traits.json'), parseMdSections(path.join(p.md, 'character-origins.md'), '### Species Descriptions')),
    backgrounds: buildBackgrounds(p.srd, es('backgrounds.json')),
    feats: buildSimple(p.srd, '5e-SRD-Feats.json', 'feat', es('feats.json'), (f) => ({
      type: f.type,
      repeatable: !!f.repeatable,
      prerequisites: f.prerequisites,
    })),
    conditions: buildSimple(p.srd, '5e-SRD-Conditions.json', 'condition', es('conditions.json')),
    masteries: buildSimple(p.srd, '5e-SRD-Weapon-Mastery-Properties.json', 'mastery', es('masteries.json')),
    'weapon-properties': buildSimple(p.srd, '5e-SRD-Weapon-Properties.json', 'weapon-property', es('weapon-properties.json')),
    rules: buildRules(path.join(p.md, 'rules-glossary.md'), es('rules.json')),
    monsters: buildMonsters(p.srd, es('monsters.json')),
    external: buildExternal(p.external),
  };
}
