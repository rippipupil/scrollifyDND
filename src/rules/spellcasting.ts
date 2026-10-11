import { charProf, d20Penalty, mod } from './core';
import { FULL_CASTER_SLOTS, PACT_SLOTS } from './tables';
import type { Ability, Character, CharacterClass } from './types';

export interface CastingStats {
  classId: string;
  className: CharacterClass['name'];
  ability: Ability;
  dc: number;
  attack: number;
}

export interface SlotInfo {
  /** Max slots for spell levels 1..9 (index 0 = level 1). */
  slots: number[];
  pact?: { count: number; level: number };
}

export function spellcastingStats(c: Character): CastingStats[] {
  const prof = charProf(c);
  return c.classes
    .filter((k) => k.casterType !== 'none' && k.spellAbility)
    .map((k) => {
      const ability = k.spellAbility as Ability;
      const m = mod(c, ability);
      return {
        classId: k.classId,
        className: k.name,
        ability,
        dc: 8 + prof + m + (c.overrides.spellDcBonus ?? 0),
        attack: prof + m + (c.overrides.spellAttackBonus ?? 0) + d20Penalty(c),
      };
    });
}

function fullTable(casterLevel: number): number[] {
  const row = casterLevel >= 1 ? FULL_CASTER_SLOTS[Math.min(20, casterLevel) - 1] : [];
  return Array.from({ length: 9 }, (_, i) => row[i] ?? 0);
}

function singleClassCasterLevel(k: CharacterClass): number {
  switch (k.casterType) {
    case 'full':
      return k.level;
    case 'half':
      return Math.ceil(k.level / 2);
    case 'third':
      return k.level < 3 ? 0 : Math.ceil(k.level / 3);
    default:
      return 0;
  }
}

function multiclassContribution(k: CharacterClass): number {
  switch (k.casterType) {
    case 'full':
      return k.level;
    case 'half':
      return Math.ceil(k.level / 2);
    case 'third':
      return Math.floor(k.level / 3);
    default:
      return 0;
  }
}

export function spellSlots(c: Character): SlotInfo {
  const slotCasters = c.classes.filter((k) => k.casterType === 'full' || k.casterType === 'half' || k.casterType === 'third');
  const casterLevel =
    slotCasters.length === 1
      ? singleClassCasterLevel(slotCasters[0])
      : slotCasters.reduce((sum, k) => sum + multiclassContribution(k), 0);
  const info: SlotInfo = { slots: fullTable(casterLevel) };
  const warlockLevels = c.classes.filter((k) => k.casterType === 'pact').reduce((s, k) => s + k.level, 0);
  if (warlockLevels > 0) {
    const [count, level] = PACT_SLOTS[Math.min(20, warlockLevels) - 1];
    info.pact = { count, level };
  }
  return info;
}
