export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export const ABILITIES: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export type ProfLevel = 'none' | 'half' | 'prof' | 'expertise';

/** Localized text. `es` may be missing; UI falls back to `en`. */
export interface Loc {
  en: string;
  es?: string;
}

export type SkillId =
  | 'acrobatics'
  | 'animal-handling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleight-of-hand'
  | 'stealth'
  | 'survival';

/** How a class contributes to multiclass spell slots (2024 rules). */
export type CasterType = 'none' | 'full' | 'half' | 'third' | 'pact';

export interface CharacterClass {
  /** Wiki id (e.g. "wizard") or homebrew id. */
  classId: string;
  name: Loc;
  subclassId?: string;
  subclassName?: Loc;
  level: number;
  hitDie: number;
  hitDiceUsed: number;
  casterType: CasterType;
  spellAbility?: Ability;
}

export type ItemKind = 'weapon' | 'armor' | 'shield' | 'gear' | 'magic' | 'other';

export interface ArmorStats {
  type: 'light' | 'medium' | 'heavy';
  base: number;
  stealthDisadvantage?: boolean;
  strMin?: number;
}

export interface WeaponStats {
  damage: string;
  damageType: string;
  /** Property ids: finesse, light, heavy, thrown, two-handed, versatile, reach, ammunition, loading. */
  properties: string[];
  versatileDamage?: string;
  mastery?: string;
  ranged: boolean;
  martial: boolean;
  range?: string;
}

export interface InventoryItem {
  uid: string;
  ref?: string;
  name: Loc;
  kind: ItemKind;
  qty: number;
  /** Weight in lb for one unit. */
  weight: number;
  equipped: boolean;
  attuned: boolean;
  requiresAttunement?: boolean;
  notes?: string;
  armor?: ArmorStats;
  shieldBonus?: number;
  weapon?: WeaponStats;
  /** Magic bonuses (e.g. +1 weapon / armor). */
  bonus?: { attack?: number; damage?: number; ac?: number };
}

export interface KnownSpell {
  uid: string;
  ref?: string;
  name: Loc;
  level: number;
  prepared: boolean;
  /** Always prepared (subclass, species, feat). */
  always?: boolean;
  classId?: string;
  concentration?: boolean;
  ritual?: boolean;
  notes?: string;
}

export interface Resource {
  uid: string;
  name: string;
  max: number;
  used: number;
  recharge: 'short' | 'long' | 'none';
}

export interface Feature {
  uid: string;
  name: string;
  text: string;
  source?: string;
  ref?: string;
}

export interface Currency {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface Character {
  id: string;
  schemaVersion: number;
  name: string;
  player: string;
  portraitUri?: string;
  createdAt: number;
  updatedAt: number;

  species: { id?: string; name: Loc; subspecies?: Loc };
  background: { id?: string; name: Loc };
  classes: CharacterClass[];
  alignment: string;
  size: string;
  speed: number;

  abilities: Record<Ability, number>;
  proficiencies: {
    saves: Ability[];
    skills: Partial<Record<SkillId, ProfLevel>>;
    armor: string[];
    weapons: string[];
    tools: string[];
    languages: string[];
  };

  hp: { current: number; temp: number; maxOverride?: number; bonusPerLevel: number };
  deathSaves: { successes: number; failures: number };
  dead: boolean;

  spellcasting: {
    spells: KnownSpell[];
    slotsUsed: number[];
    pactUsed: number;
    concentratingOn: string | null;
  };

  inventory: InventoryItem[];
  currency: Currency;

  conditions: string[];
  exhaustion: number;
  inspiration: boolean;
  resources: Resource[];
  features: Feature[];
  effects: { mageArmor?: boolean };

  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    backstory: string;
    appearance: string;
  };
  notes: { uid: string; date: number; text: string }[];

  overrides: {
    ac?: number;
    initiativeBonus?: number;
    spellDcBonus?: number;
    spellAttackBonus?: number;
  };
}
