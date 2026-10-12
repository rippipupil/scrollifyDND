import type { Ability, SkillId } from '../rules/types';

export type EnemyActionKind = 'trait' | 'action' | 'bonus' | 'reaction' | 'legendary';
export const ENEMY_ACTION_KINDS: EnemyActionKind[] = ['trait', 'action', 'bonus', 'reaction', 'legendary'];

export interface EnemyAction {
  uid: string;
  kind: EnemyActionKind;
  name: string;
  text: string;
  /** To-hit bonus when it is an attack roll. */
  attackBonus?: number;
  /** Damage dice to roll on a hit (or on a failed save), e.g. "2d6+3". */
  damage?: string;
  damageType?: string;
  /** Saving throw the targets make. */
  save?: { ability: Ability; dc: number };
}

/** A creature in the DM's bestiary: a full, editable 2024 stat block. */
export interface Enemy {
  id: string;
  name: string;
  size: string;
  type: string;
  alignment: string;
  cr: number;
  xp: number;
  ac: number;
  acNote: string;
  hpMax: number;
  hpFormula: string;
  speed: string;
  abilities: Record<Ability, number>;
  /** Total save bonuses that differ from the plain modifier. */
  saves: Partial<Record<Ability, number>>;
  skills: { id: SkillId; bonus: number }[];
  /** Damage types it is vulnerable to (weaknesses). Ids like "fire", or free text. */
  vulnerabilities: string[];
  resistances: string[];
  immunities: string[];
  conditionImmunities: string[];
  senses: string;
  passivePerception: number;
  languages: string;
  actions: EnemyAction[];
  notes: string;
  /** Content key of the SRD monster it was copied from. */
  source?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Combatant {
  uid: string;
  name: string;
  kind: 'enemy' | 'pc' | 'other';
  enemyId?: string;
  characterId?: string;
  initiative: number | null;
  initBonus: number;
  hp: number;
  hpMax: number;
  temp: number;
  ac: number;
  conditions: string[];
  note: string;
}

export interface Encounter {
  combatants: Combatant[];
  /** 0 = combat not started. */
  round: number;
  activeUid: string | null;
}
