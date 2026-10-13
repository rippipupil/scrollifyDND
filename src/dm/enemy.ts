import type { ContentEntry } from '../content/types';
import { loc, type Lang } from '../i18n';
import { abilityMod, SKILLS, uid } from '../rules/core';
import { ABILITIES, type Ability, type SkillId } from '../rules/types';
import { ENEMY_ACTION_KINDS, type Enemy, type EnemyAction, type EnemyActionKind } from './types';

export function newEnemy(partial: Partial<Enemy> = {}): Enemy {
  const now = Date.now();
  return {
    id: uid('enemy'),
    name: '',
    size: 'Medium',
    type: '',
    alignment: '',
    cr: 0,
    xp: 0,
    ac: 10,
    acNote: '',
    hpMax: 10,
    hpFormula: '',
    speed: '',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    saves: {},
    skills: [],
    vulnerabilities: [],
    resistances: [],
    immunities: [],
    conditionImmunities: [],
    senses: '',
    passivePerception: 10,
    languages: '',
    actions: [],
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function enemyInitBonus(e: Enemy): number {
  return abilityMod(e.abilities.dex);
}

export function enemySave(e: Enemy, a: Ability): number {
  return e.saves[a] ?? abilityMod(e.abilities[a]);
}

/** Experience points by challenge rating (same table in 2014 and 2024). */
const XP_BY_CR: Record<string, number> = {
  0: 10, 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
  11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000, 16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000, 21: 33000, 22: 41000,
  23: 50000, 24: 62000, 25: 75000, 26: 90000, 27: 105000, 28: 120000, 29: 135000, 30: 155000,
};
export const xpForCr = (cr: number): number => XP_BY_CR[cr] ?? 0;

export function crLabel(cr: number): string {
  if (cr === 0.125) return '1/8';
  if (cr === 0.25) return '1/4';
  if (cr === 0.5) return '1/2';
  return String(cr);
}

const KIND_FROM_SRD: [string, EnemyActionKind][] = [
  ['special_abilities', 'trait'],
  ['actions', 'action'],
  ['bonus_actions', 'bonus'],
  ['reactions', 'reaction'],
  ['legendary_actions', 'legendary'],
];

function srdAction(a: any, kind: EnemyActionKind, lang: Lang): EnemyAction {
  // The bestiary shows plain text: the translation's _italic_ labels lose their underscores.
  const text = lang === 'es' && a.es?.desc ? String(a.es.desc).replace(/_([^_\n]+)_/g, '$1') : String(a.desc ?? '');
  const out: EnemyAction = { uid: uid('act'), kind, name: String((lang === 'es' && a.es?.name) || a.name || ''), text };
  if (typeof a.attack_bonus === 'number') out.attackBonus = a.attack_bonus;
  const dmg = Array.isArray(a.damage) ? a.damage.find((d: any) => d?.damage_dice) : undefined;
  if (dmg) {
    out.damage = String(dmg.damage_dice).replace(/\s+/g, '');
    if (dmg.damage_type?.index) out.damageType = dmg.damage_type.index;
  }
  // With an attack roll, a DC is an escape/grapple DC, not a saving throw.
  if (a.dc && out.attackBonus === undefined && ABILITIES.includes(a.dc.dc_type?.index)) {
    out.save = { ability: a.dc.dc_type.index, dc: Number(a.dc.dc_value) || 0 };
  }
  return out;
}

const ES_TYPES: Record<string, string> = {
  aberration: 'aberración', beast: 'bestia', celestial: 'celestial', construct: 'constructo', dragon: 'dragón', elemental: 'elemental',
  fey: 'feérico', fiend: 'infernal', giant: 'gigante', humanoid: 'humanoide', monstrosity: 'monstruosidad', ooze: 'cieno',
  plant: 'planta', undead: 'muerto viviente', 'swarm of tiny beasts': 'enjambre de bestias diminutas',
  'swarm of tiny undead': 'enjambre de muertos vivientes diminutos',
};
/** Creature type in the reader's language ('celestial or fiend' → 'celestial o infernal'). */
export function creatureType(type: string | undefined, lang: Lang): string {
  if (!type) return '';
  return lang === 'es' ? type.split(' or ').map((x) => ES_TYPES[x] ?? x).join(' o ') : type;
}
const ES_ALIGN: Record<string, string> = {
  'lawful good': 'legal bueno', 'neutral good': 'neutral bueno', 'chaotic good': 'caótico bueno', 'lawful neutral': 'legal neutral',
  neutral: 'neutral', 'chaotic neutral': 'caótico neutral', 'lawful evil': 'legal malvado', 'neutral evil': 'neutral malvado',
  'chaotic evil': 'caótico malvado', unaligned: 'sin alineamiento',
};
const ES_MOVES: Record<string, string> = { swim: 'nadar', fly: 'volar', hover: 'levitar', burrow: 'excavar', climb: 'trepar' };
const ES_SENSES: Record<string, string> = { darkvision: 'visión en la oscuridad', blindsight: 'vista ciega', tremorsense: 'sentir vibraciones', truesight: 'visión verdadera' };

/** "30 ft." → "9 m" (5 ft = 1,5 m), with a Spanish decimal comma. */
function metric(v: unknown): string {
  return String(v).replace(/(\d+)\s*ft\.?/g, (_, n) => `${String(Math.round(Number(n) * 3) / 10).replace('.', ',')} m`);
}

/** Copies an SRD monster into an editable bestiary enemy. */
export function enemyFromMonster(entry: ContentEntry, lang: Lang): Enemy {
  const d = entry.data ?? {};
  const abilities = {
    str: d.strength ?? 10,
    dex: d.dexterity ?? 10,
    con: d.constitution ?? 10,
    int: d.intelligence ?? 10,
    wis: d.wisdom ?? 10,
    cha: d.charisma ?? 10,
  } as Record<Ability, number>;
  const saves: Partial<Record<Ability, number>> = {};
  const skills: { id: SkillId; bonus: number }[] = [];
  for (const p of d.proficiencies ?? []) {
    const idx: string = p?.proficiency?.index ?? '';
    if (idx.startsWith('saving-throw-')) saves[idx.slice(13) as Ability] = p.value;
    else if (idx.startsWith('skill-') && idx.slice(6) in SKILLS) skills.push({ id: idx.slice(6) as SkillId, bonus: p.value });
  }
  const es = lang === 'es';
  const speed = Object.entries(d.speed ?? {})
    .map(([k, v]) => {
      const value = es ? metric(v) : String(v);
      if (k === 'walk') return value;
      if (v === true) return es ? ES_MOVES[k] ?? k : k;
      return `${es ? ES_MOVES[k] ?? k : k} ${value}`;
    })
    .join(', ');
  const senses = Object.entries(d.senses ?? {})
    .filter(([k]) => k !== 'passive_perception')
    .map(([k, v]) => (es ? `${ES_SENSES[k] ?? k.replace(/_/g, ' ')} ${metric(v)}` : `${k.replace(/_/g, ' ')} ${v}`))
    .join(', ');
  const ac = Array.isArray(d.armor_class) ? d.armor_class[0] : undefined;
  return newEnemy({
    name: loc(entry.name, lang),
    size: d.size ?? 'Medium',
    type: creatureType(d.type, lang),
    alignment: es ? ES_ALIGN[d.alignment] ?? d.alignment ?? '' : d.alignment ?? '',
    cr: d.challenge_rating ?? 0,
    // Indexed monsters outside the SRD only carry CR, AC and average HP; the rest is filled in from the book.
    xp: d.xp ?? xpForCr(d.challenge_rating ?? 0),
    ac: ac?.value ?? d.ac ?? 10,
    acNote: (ac?.armor ?? []).map((x: any) => x.name).join(', ') || (ac?.type && ac.type !== 'dex' ? ac.type : ''),
    hpMax: d.hit_points ?? d.hp ?? 1,
    hpFormula: d.hit_points_roll ?? d.hit_dice ?? '',
    speed,
    abilities,
    saves,
    skills,
    vulnerabilities: [...(d.damage_vulnerabilities ?? [])],
    resistances: [...(d.damage_resistances ?? [])],
    immunities: [...(d.damage_immunities ?? [])],
    conditionImmunities: (d.condition_immunities ?? []).map((c: any) => (typeof c === 'string' ? c : c.index)),
    senses,
    passivePerception: d.senses?.passive_perception ?? 10 + abilityMod(abilities.wis),
    languages: d.languages ?? '',
    actions: KIND_FROM_SRD.flatMap(([key, kind]) => (d[key] ?? []).map((a: any) => srdAction(a, kind, lang))),
    // Only the numbers are indexed for monsters outside the SRD: point to the book for the rest.
    notes: entry.source === 'external' ? `${lang === 'es' ? 'Ficha completa' : 'Full stat block'}: ${entry.book ?? ''}${d.page ? `, ${lang === 'es' ? 'pág.' : 'p.'} ${d.page}` : ''}` : '',
    source: `monster:${entry.id}`,
  });
}

const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const strList = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

function sanitizeAction(a: Record<string, any>): EnemyAction {
  const out: EnemyAction = {
    uid: str(a.uid) || uid('act'),
    kind: ENEMY_ACTION_KINDS.includes(a.kind) ? a.kind : 'action',
    name: str(a.name),
    text: str(a.text),
  };
  if (typeof a.attackBonus === 'number' && Number.isFinite(a.attackBonus)) out.attackBonus = a.attackBonus;
  if (typeof a.damage === 'string' && a.damage) out.damage = a.damage;
  if (typeof a.damageType === 'string' && a.damageType) out.damageType = a.damageType;
  if (isObj(a.save) && ABILITIES.includes(a.save.ability)) out.save = { ability: a.save.ability, dc: num(a.save.dc, 10) };
  return out;
}

/** Repairs stored/imported enemy JSON so the screens can't crash on it. Throws on non-objects. */
export function sanitizeEnemy(raw: unknown): Enemy {
  if (!isObj(raw)) throw new Error('Enemy must be an object');
  const base = newEnemy();
  const abilities = { ...base.abilities };
  if (isObj(raw.abilities)) for (const a of ABILITIES) abilities[a] = num(raw.abilities[a], 10);
  const saves: Partial<Record<Ability, number>> = {};
  if (isObj(raw.saves)) for (const a of ABILITIES) if (raw.saves[a] !== undefined && Number.isFinite(num(raw.saves[a], NaN))) saves[a] = num(raw.saves[a], 0);
  return {
    id: str(raw.id) || base.id,
    name: str(raw.name),
    size: str(raw.size, base.size),
    type: str(raw.type),
    alignment: str(raw.alignment),
    cr: num(raw.cr, 0),
    xp: num(raw.xp, 0),
    ac: num(raw.ac, 10),
    acNote: str(raw.acNote),
    hpMax: Math.max(1, num(raw.hpMax, 10)),
    hpFormula: str(raw.hpFormula),
    speed: str(raw.speed, base.speed),
    abilities,
    saves,
    skills: (Array.isArray(raw.skills) ? raw.skills : [])
      .filter((s: unknown): s is Record<string, any> => isObj(s) && typeof s.id === 'string' && s.id in SKILLS)
      .map((s: Record<string, any>) => ({ id: s.id as SkillId, bonus: num(s.bonus, 0) })),
    vulnerabilities: strList(raw.vulnerabilities),
    resistances: strList(raw.resistances),
    immunities: strList(raw.immunities),
    conditionImmunities: strList(raw.conditionImmunities),
    senses: str(raw.senses),
    passivePerception: num(raw.passivePerception, 10),
    languages: str(raw.languages),
    actions: (Array.isArray(raw.actions) ? raw.actions : []).filter(isObj).map(sanitizeAction),
    notes: str(raw.notes),
    ...(typeof raw.source === 'string' ? { source: raw.source } : {}),
    createdAt: num(raw.createdAt, base.createdAt),
    updatedAt: num(raw.updatedAt, base.updatedAt),
  };
}
