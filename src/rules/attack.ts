import { roll, type RollResult } from './dice';

type Ok = Extract<RollResult, { ok: true }>;

export interface FullAttack {
  attack: Ok;
  /** null when no target AC was given. */
  hit: boolean | null;
  crit: boolean;
  fumble: boolean;
  /** Rolled on a hit, or always when the AC is unknown. */
  damage?: Ok;
}

/** A critical hit rolls the damage dice twice: "2d6+3" → "4d6+3". */
export function critDamage(expr: string): string {
  return expr.replace(/(\d*)d(\d+)/gi, (_, n: string, sides: string) => `${(n === '' ? 1 : Number(n)) * 2}d${sides}`);
}

/**
 * Attack roll plus damage in one go (2024 rules): a natural 20 always hits and is a critical hit,
 * a natural 1 always misses.
 */
export function fullAttack(opts: { toHit: number; damage: string; targetAc?: number; mode?: 'normal' | 'adv' | 'dis'; die?: (sides: number) => number }): FullAttack | null {
  const { toHit, damage, targetAc, mode = 'normal', die } = opts;
  const attack = roll(toHit === 0 ? '1d20' : `1d20${toHit > 0 ? '+' : ''}${toHit}`, { adv: mode === 'adv', dis: mode === 'dis', die });
  if (!attack.ok) return null;
  const crit = attack.natural === 20;
  const fumble = attack.natural === 1;
  const hit = targetAc === undefined ? (crit ? true : fumble ? false : null) : crit || (!fumble && attack.total >= targetAc);
  let dmg: Ok | undefined;
  if (hit !== false && damage.trim()) {
    const r = roll(crit ? critDamage(damage) : damage, { die });
    if (r.ok) dmg = { ...r, total: Math.max(0, r.total) };
  }
  return { attack, hit, crit, fumble, damage: dmg };
}
