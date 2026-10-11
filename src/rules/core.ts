import type { Ability, Character, ProfLevel, SkillId } from './types';

export const SCHEMA_VERSION = 1;

export const SKILLS: Record<SkillId, Ability> = {
  acrobatics: 'dex',
  'animal-handling': 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  'sleight-of-hand': 'dex',
  stealth: 'dex',
  survival: 'wis',
};

export const SKILL_IDS = Object.keys(SKILLS) as SkillId[];

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatMod(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export function totalLevel(c: Character): number {
  return c.classes.reduce((sum, k) => sum + k.level, 0) || 1;
}

export function profBonus(level: number): number {
  return 2 + Math.floor((Math.max(1, Math.min(20, level)) - 1) / 4);
}

export function charProf(c: Character): number {
  return profBonus(totalLevel(c));
}

export function mod(c: Character, ab: Ability): number {
  return abilityMod(c.abilities[ab]);
}

/** Exhaustion 2024: −2 × level to every d20 test. */
export function d20Penalty(c: Character): number {
  return -2 * Math.max(0, Math.min(6, c.exhaustion));
}

function profMultiplier(level: ProfLevel | undefined): number {
  switch (level) {
    case 'half':
      return 0.5;
    case 'prof':
      return 1;
    case 'expertise':
      return 2;
    default:
      return 0;
  }
}

export function saveBonus(c: Character, ab: Ability): number {
  const prof = c.proficiencies.saves.includes(ab) ? charProf(c) : 0;
  return mod(c, ab) + prof + d20Penalty(c);
}

export function skillBonus(c: Character, skill: SkillId): number {
  const prof = Math.floor(charProf(c) * profMultiplier(c.proficiencies.skills[skill]));
  return mod(c, SKILLS[skill]) + prof + d20Penalty(c);
}

export function passive(c: Character, skill: SkillId): number {
  return 10 + skillBonus(c, skill);
}

export function initiative(c: Character): number {
  return mod(c, 'dex') + (c.overrides.initiativeBonus ?? 0) + d20Penalty(c);
}

/** Parses user input into an integer within [min, max]; returns fallback for non-numbers. */
export function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

let uidCounter = 0;
export function uid(prefix = 'id'): string {
  uidCounter = (uidCounter + 1) % 1_000_000;
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${uidCounter}`;
}

export function newCharacter(partial: Partial<Character> = {}): Character {
  const now = Date.now();
  const base: Character = {
    id: uid('char'),
    schemaVersion: SCHEMA_VERSION,
    name: '',
    player: '',
    createdAt: now,
    updatedAt: now,
    species: { name: { en: '' } },
    background: { name: { en: '' } },
    classes: [],
    alignment: '',
    size: 'Medium',
    speed: 30,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    proficiencies: { saves: [], skills: {}, armor: [], weapons: [], tools: [], languages: [] },
    hp: { current: 0, temp: 0, bonusPerLevel: 0 },
    deathSaves: { successes: 0, failures: 0 },
    dead: false,
    spellcasting: { spells: [], slotsUsed: [0, 0, 0, 0, 0, 0, 0, 0, 0], pactUsed: 0, concentratingOn: null },
    inventory: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    conditions: [],
    exhaustion: 0,
    inspiration: false,
    resources: [],
    features: [],
    effects: {},
    personality: { traits: '', ideals: '', bonds: '', flaws: '', backstory: '', appearance: '' },
    notes: [],
    overrides: {},
  };
  return { ...base, ...partial };
}
