import { spellSlots } from '../rules/spellcasting';
import type { Ability, Character, ProfLevel, SkillId } from '../rules/types';

export function availableSlots(c: Character): { slots: number[]; pact?: { level: number; count: number } } {
  const s = spellSlots(c);
  return {
    slots: s.slots.map((max, i) => Math.max(0, max - (c.spellcasting.slotsUsed[i] ?? 0))),
    pact: s.pact ? { level: s.pact.level, count: Math.max(0, s.pact.count - c.spellcasting.pactUsed) } : undefined,
  };
}

export interface CastResult {
  ok: boolean;
  character: Character;
  replacedConcentration?: string;
}

/** Casts a known spell. `slot` is a slot level, "pact" for Pact Magic, or "ritual". Cantrips ignore `slot`. */
export function castSpell(c: Character, spellUid: string, slot: number | 'pact' | 'ritual'): CastResult {
  const spell = c.spellcasting.spells.find((s) => s.uid === spellUid);
  if (!spell) return { ok: false, character: c };
  const sc = { ...c.spellcasting, slotsUsed: [...c.spellcasting.slotsUsed] };
  if (spell.level > 0 && slot !== 'ritual') {
    const avail = availableSlots(c);
    if (slot === 'pact') {
      if (!avail.pact || avail.pact.count <= 0 || avail.pact.level < spell.level) return { ok: false, character: c };
      sc.pactUsed += 1;
    } else {
      if (slot < spell.level || (avail.slots[slot - 1] ?? 0) <= 0) return { ok: false, character: c };
      sc.slotsUsed[slot - 1] += 1;
    }
  }
  let replaced: string | undefined;
  if (spell.concentration) {
    replaced = c.spellcasting.concentratingOn ?? undefined;
    sc.concentratingOn = spell.name.es ?? spell.name.en;
  }
  return { ok: true, character: { ...c, spellcasting: sc }, replacedConcentration: replaced };
}

export function toggleCondition(c: Character, id: string): Character {
  return { ...c, conditions: c.conditions.includes(id) ? c.conditions.filter((x) => x !== id) : [...c.conditions, id] };
}

export function toggleSave(c: Character, ab: Ability): Character {
  const saves = c.proficiencies.saves.includes(ab) ? c.proficiencies.saves.filter((x) => x !== ab) : [...c.proficiencies.saves, ab];
  return { ...c, proficiencies: { ...c.proficiencies, saves } };
}

const NEXT: Record<ProfLevel, ProfLevel> = { none: 'prof', prof: 'expertise', expertise: 'none', half: 'prof' };

export function cycleSkillProf(c: Character, skill: SkillId): Character {
  const cur = c.proficiencies.skills[skill] ?? 'none';
  return { ...c, proficiencies: { ...c.proficiencies, skills: { ...c.proficiencies.skills, [skill]: NEXT[cur] } } };
}

/** Spends (+1) or recovers (−1) one spell slot of a level, within the character's maximum. */
export function spendSlot(c: Character, level: number, delta: 1 | -1): Character {
  const max = spellSlots(c).slots[level - 1] ?? 0;
  const used = [...c.spellcasting.slotsUsed];
  while (used.length < 9) used.push(0);
  used[level - 1] = Math.max(0, Math.min(max, (used[level - 1] ?? 0) + delta));
  return { ...c, spellcasting: { ...c.spellcasting, slotsUsed: used } };
}

/** Spends (+1) or recovers (−1) one Pact Magic slot. */
export function spendPactSlot(c: Character, delta: 1 | -1): Character {
  const max = spellSlots(c).pact?.count ?? 0;
  return { ...c, spellcasting: { ...c.spellcasting, pactUsed: Math.max(0, Math.min(max, c.spellcasting.pactUsed + delta)) } };
}
