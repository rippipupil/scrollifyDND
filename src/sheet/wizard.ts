import { getEntry } from '../content';
import type { ContentEntry } from '../content/types';
import { loc, type Lang } from '../i18n';
import { newCharacter, uid } from '../rules/core';
import { maxHp } from '../rules/health';
import type { Ability, Character, CharacterClass, CasterType, Feature, InventoryItem, Loc, SkillId } from '../rules/types';
import { ABILITIES } from '../rules/types';
import { entryToItem } from './adapters';

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const POINT_BUY_BUDGET = 27;
const POINT_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

export function pointBuyCost(scores: Record<Ability, number>): number {
  let total = 0;
  for (const a of ABILITIES) {
    const cost = POINT_COST[scores[a]];
    if (cost === undefined) return Infinity;
    total += cost;
  }
  return total;
}

export interface AsiChoice {
  mode: '21' | '111';
  plus2?: Ability;
  plus1?: Ability;
}

export function applyBackgroundAsi(base: Record<Ability, number>, allowed: Ability[], asi: AsiChoice): Record<Ability, number> {
  const out = { ...base };
  const bump = (a: Ability | undefined, n: number) => {
    if (a && allowed.includes(a)) out[a] = Math.min(20, out[a] + n);
  };
  if (asi.mode === '111') allowed.forEach((a) => bump(a, 1));
  else if (asi.plus2 !== asi.plus1) {
    bump(asi.plus2, 2);
    bump(asi.plus1, 1);
  }
  return out;
}

export interface WizardDraft {
  name: string;
  player: string;
  alignment: string;
  classes: { key: string; level: number; subclassKey?: string }[];
  speciesKey?: string;
  customSpeciesName?: string;
  subspeciesId?: string;
  size?: string;
  backgroundKey?: string;
  customBackgroundName?: string;
  scoreMethod: 'standard' | 'pointbuy' | 'manual';
  baseScores: Record<Ability, number>;
  asi: AsiChoice;
  skills: SkillId[];
  classEquipment?: number;
  backgroundEquipment?: number;
}

export function emptyDraft(): WizardDraft {
  return {
    name: '',
    player: '',
    alignment: '',
    classes: [],
    scoreMethod: 'standard',
    baseScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    asi: { mode: '21' },
    skills: [],
  };
}

const ARMOR_PROF: Record<string, string[]> = {
  'light-armor': ['light'],
  'medium-armor': ['medium'],
  'heavy-armor': ['heavy'],
  'all-armor': ['light', 'medium', 'heavy'],
  shields: ['shields'],
};
const WEAPON_PROF: Record<string, string> = { 'simple-weapons': 'simple', 'martial-weapons': 'martial' };

function classFromEntry(e: ContentEntry, level: number, sub?: ContentEntry): CharacterClass {
  const d = e.data ?? {};
  return {
    classId: e.id,
    name: e.name,
    level: Math.max(1, Math.min(20, level)),
    hitDie: d.hitDie ?? 8,
    hitDiceUsed: 0,
    casterType: (sub?.data?.casterType as CasterType) ?? (d.casterType as CasterType) ?? 'none',
    spellAbility: d.spellAbility,
    subclassId: sub?.id,
    subclassName: sub?.name,
  };
}

function feature(name: Loc, text: Loc | undefined, source: string, ref: string | undefined, lang: Lang): Feature {
  return { uid: uid('feat'), name: loc(name, lang), text: loc(text, lang), source, ref };
}

function itemsFromOption(opt: { items: { id: string; name: string; qty: number }[]; gold: number } | undefined): { items: InventoryItem[]; gold: number } {
  if (!opt) return { items: [], gold: 0 };
  const items = opt.items.map((it) => {
    const e = getEntry(`equipment:${it.id}`);
    const base: InventoryItem = e
      ? entryToItem(e)
      : { uid: uid('item'), name: { en: it.name }, kind: 'gear', qty: 1, weight: 0, equipped: false, attuned: false };
    return { ...base, qty: it.qty };
  });
  return { items, gold: opt.gold };
}

export function buildCharacterFromWizard(draft: WizardDraft, lang: Lang, homebrew: ContentEntry[] = []): Character {
  const classEntries = draft.classes
    .map((k) => ({ e: getEntry(k.key, homebrew), level: k.level, sub: getEntry(k.subclassKey, homebrew) }))
    .filter((x): x is { e: ContentEntry; level: number; sub: ContentEntry | undefined } => !!x.e);
  const classes = classEntries.map((x) => classFromEntry(x.e, x.level, x.sub));
  const first = classEntries[0]?.e;

  const species = getEntry(draft.speciesKey, homebrew);
  const background = getEntry(draft.backgroundKey, homebrew);
  const bgAbilities: Ability[] = background?.data?.abilities?.length ? background.data.abilities : ABILITIES;

  const abilities = applyBackgroundAsi(draft.baseScores, bgAbilities, draft.asi);

  const skills: Character['proficiencies']['skills'] = {};
  for (const s of [...draft.skills, ...((background?.data?.skills ?? []) as SkillId[])]) skills[s] = 'prof';

  const classProfs: string[] = first?.data?.proficiencies ?? [];
  const armor = [...new Set(classProfs.flatMap((p) => ARMOR_PROF[p] ?? []))];
  const weapons = [...new Set(classProfs.filter((p) => !ARMOR_PROF[p]).map((p) => WEAPON_PROF[p] ?? p.replace(/s$/, '')))];

  const features: Feature[] = [];
  for (const t of species?.data?.traits ?? []) features.push(feature(t.name, t.text, 'species', species ? `species:${species.id}` : undefined, lang));
  if (background?.data?.feat) {
    const feat = getEntry(`feat:${background.data.feat}`, homebrew);
    if (feat) features.push(feature(feat.name, feat.text, 'feat', `feat:${feat.id}`, lang));
  }
  for (const { e, level, sub } of classEntries) {
    for (const lv of (e.data?.levels ?? []).slice(0, level)) {
      for (const fid of lv.features ?? []) {
        const fe = getEntry(`feature:${fid}`, homebrew);
        if (fe) features.push(feature(fe.name, fe.text, 'feature', `feature:${fid}`, lang));
      }
    }
    if (sub) features.push(feature(sub.name, sub.text, 'subclass', `subclass:${sub.id}`, lang));
  }

  const classPack = itemsFromOption(first?.data?.equipmentOptions?.[draft.classEquipment ?? -1]);
  const bgPack = itemsFromOption(background?.data?.equipmentOptions?.[draft.backgroundEquipment ?? -1]);

  const sizeRaw: string = species?.data?.size ?? 'Medium';
  const subName = species?.data?.subspecies?.find((s: any) => s.id === draft.subspeciesId)?.name;

  const c = newCharacter({
    name: draft.name.trim(),
    player: draft.player.trim(),
    alignment: draft.alignment,
    classes,
    abilities,
    species: species
      ? { id: `species:${species.id}`, name: species.name, subspecies: subName }
      : { name: { en: draft.customSpeciesName ?? '', es: draft.customSpeciesName ?? '' } },
    background: background
      ? { id: `background:${background.id}`, name: background.name }
      : { name: { en: draft.customBackgroundName ?? '', es: draft.customBackgroundName ?? '' } },
    size: sizeRaw.includes(' or ') ? draft.size ?? 'Medium' : sizeRaw,
    speed: species?.data?.speed ?? 30,
    proficiencies: {
      saves: (first?.data?.saves ?? []) as Ability[],
      skills,
      armor,
      weapons,
      tools: (background?.data?.tools ?? []) as string[],
      languages: ['common'],
    },
    features,
    inventory: [...classPack.items, ...bgPack.items],
    currency: { cp: 0, sp: 0, ep: 0, gp: classPack.gold + bgPack.gold, pp: 0 },
  });
  return { ...c, hp: { ...c.hp, current: maxHp(c) } };
}
