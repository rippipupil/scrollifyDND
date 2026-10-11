import { abilityMod, charProf, d20Penalty, formatMod, mod } from './core';
import type { Character, InventoryItem } from './types';

const isEquipped = (i: InventoryItem) => i.equipped && i.qty > 0;

export function armorClass(c: Character): number {
  if (c.overrides.ac != null) return c.overrides.ac;
  const dex = mod(c, 'dex');
  const armor = c.inventory.find((i) => i.kind === 'armor' && i.armor && isEquipped(i));
  const shield = c.inventory.find((i) => i.kind === 'shield' && isEquipped(i));
  const magic = c.inventory.filter(isEquipped).reduce((s, i) => s + (i.bonus?.ac ?? 0), 0);

  let base: number;
  if (armor?.armor) {
    const a = armor.armor;
    base = a.type === 'light' ? a.base + dex : a.type === 'medium' ? a.base + Math.min(dex, 2) : a.base;
  } else {
    const options = [10 + dex];
    if (c.effects.mageArmor) options.push(13 + dex);
    if (c.classes.some((k) => k.classId === 'barbarian')) options.push(10 + dex + mod(c, 'con'));
    if (!shield && c.classes.some((k) => k.classId === 'monk')) options.push(10 + dex + mod(c, 'wis'));
    base = Math.max(...options);
  }
  return base + (shield ? shield.shieldBonus ?? 2 : 0) + magic;
}

export interface Attack {
  id: string;
  name: InventoryItem['name'];
  toHit: number;
  damage: string;
  versatileDamage?: string;
  damageType: string;
  mastery?: string;
  range?: string;
  properties: string[];
}

function withMod(dice: string, m: number): string {
  return m === 0 ? dice : `${dice}${formatMod(m)}`;
}

function isProficient(c: Character, item: InventoryItem): boolean {
  const w = c.proficiencies.weapons;
  if (item.ref && w.includes(item.ref)) return true;
  return item.weapon!.martial ? w.includes('martial') : w.includes('simple');
}

export function weaponAttacks(c: Character): Attack[] {
  const prof = charProf(c);
  const pen = d20Penalty(c);
  const attacks: Attack[] = c.inventory
    .filter((i) => i.kind === 'weapon' && i.weapon && i.qty > 0)
    .map((i) => {
      const w = i.weapon!;
      const str = mod(c, 'str');
      const dex = mod(c, 'dex');
      const abil = w.ranged ? dex : w.properties.includes('finesse') ? Math.max(str, dex) : str;
      const dmgMod = abil + (i.bonus?.damage ?? 0);
      return {
        id: i.uid,
        name: i.name,
        toHit: abil + (isProficient(c, i) ? prof : 0) + (i.bonus?.attack ?? 0) + pen,
        damage: withMod(w.damage, dmgMod),
        versatileDamage: w.versatileDamage ? withMod(w.versatileDamage, dmgMod) : undefined,
        damageType: w.damageType,
        mastery: w.mastery,
        range: w.range,
        properties: w.properties,
      };
    });
  const str = abilityMod(c.abilities.str);
  attacks.push({
    id: 'unarmed-strike',
    name: { en: 'Unarmed Strike', es: 'Ataque sin armas' },
    toHit: str + prof + pen,
    damage: String(Math.max(0, 1 + str)),
    damageType: 'bludgeoning',
    properties: [],
  });
  return attacks;
}

export function carryingCapacity(c: Character): number {
  return c.abilities.str * 15;
}

export function carriedWeight(c: Character): number {
  const items = c.inventory.reduce((s, i) => s + i.qty * i.weight, 0);
  const cur = c.currency;
  const coins = cur.cp + cur.sp + cur.ep + cur.gp + cur.pp;
  return Math.round((items + coins / 50) * 100) / 100;
}
