import { keyOf } from '../content';
import type { ContentEntry } from '../content/types';
import { loc, type Lang } from '../i18n';
import { uid } from '../rules/core';
import type { Character, Feature, InventoryItem, KnownSpell } from '../rules/types';

export function entryToItem(e: ContentEntry): InventoryItem {
  const d = e.data ?? {};
  const base: InventoryItem = {
    uid: uid('item'),
    ref: keyOf(e),
    name: e.name,
    kind: 'gear',
    qty: d.quantity && d.categories?.includes('ammunition') ? d.quantity : 1,
    weight: Number(d.weight) || 0,
    equipped: false,
    attuned: false,
  };
  if (e.category === 'magic-item') {
    return { ...base, kind: 'magic', requiresAttunement: !!d.attunement };
  }
  if (d.armor?.type === 'shield') return { ...base, kind: 'shield', shieldBonus: d.armor.base || 2 };
  if (d.armor) {
    return { ...base, kind: 'armor', armor: { type: d.armor.type, base: d.armor.base, strMin: d.armor.strMin, stealthDisadvantage: d.armor.stealthDisadvantage } };
  }
  if (d.weapon) {
    const w = d.weapon;
    return {
      ...base,
      kind: 'weapon',
      weapon: {
        damage: w.damage,
        damageType: w.damageType,
        properties: w.properties ?? [],
        versatileDamage: w.versatileDamage,
        mastery: w.mastery,
        ranged: !!w.ranged,
        martial: !!w.martial,
        range: w.range ?? w.throwRange,
      },
    };
  }
  return base;
}

export function entryToSpell(e: ContentEntry, classId?: string): KnownSpell {
  const d = e.data ?? {};
  const level = Number(d.level) || 0;
  return {
    uid: uid('spell'),
    ref: keyOf(e),
    name: e.name,
    level,
    prepared: true,
    always: level === 0 ? true : undefined,
    classId,
    concentration: !!d.concentration,
    ritual: !!d.ritual,
  };
}

export function entryToFeature(e: ContentEntry, lang: Lang): Feature {
  return { uid: uid('feat'), ref: keyOf(e), name: loc(e.name, lang), text: loc(e.text, lang), source: e.category };
}

const ADDABLE = new Set(['spell', 'equipment', 'magic-item', 'feat', 'feature', 'background', 'species', 'subclass', 'mastery']);

export function canAddToCharacter(e: ContentEntry): boolean {
  return ADDABLE.has(e.category);
}

/** Adds a wiki entry to the right list of a character sheet. */
export function addEntryToCharacter(c: Character, e: ContentEntry, lang: Lang): Character {
  if (e.category === 'spell') {
    const caster = c.classes.find((k) => k.casterType !== 'none' && (!e.data?.classes || e.data.classes.includes(k.classId))) ?? c.classes.find((k) => k.casterType !== 'none');
    return { ...c, spellcasting: { ...c.spellcasting, spells: [...c.spellcasting.spells, entryToSpell(e, caster?.classId)] } };
  }
  if (e.category === 'equipment' || e.category === 'magic-item') return { ...c, inventory: [...c.inventory, entryToItem(e)] };
  return { ...c, features: [...c.features, entryToFeature(e, lang)] };
}
