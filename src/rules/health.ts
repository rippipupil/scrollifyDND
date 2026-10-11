import { mod } from './core';
import type { Character } from './types';

export function maxHp(c: Character): number {
  if (c.hp.maxOverride != null) return c.hp.maxOverride;
  const perLevelBonus = mod(c, 'con') + c.hp.bonusPerLevel;
  let total = 0;
  c.classes.forEach((k, idx) => {
    const avg = k.hitDie / 2 + 1;
    for (let lvl = 1; lvl <= k.level; lvl++) {
      const roll = idx === 0 && lvl === 1 ? k.hitDie : avg;
      total += Math.max(1, roll + perLevelBonus);
    }
  });
  return Math.max(1, total);
}

export type DamageEvent = 'dropped' | 'instantDeath' | 'deathSaveFailure' | 'died' | 'concentrationCheck' | 'concentrationLost';

export interface DamageResult {
  character: Character;
  events: DamageEvent[];
  concentrationDC?: number;
}

const withoutCondition = (list: string[], cond: string) => list.filter((x) => x !== cond);
const withCondition = (list: string[], cond: string) => (list.includes(cond) ? list : [...list, cond]);

export function applyDamage(c: Character, amount: number, opts: { critical?: boolean } = {}): DamageResult {
  if (c.dead || !(amount > 0)) return { character: c, events: [] };
  const events: DamageEvent[] = [];
  const max = maxHp(c);
  const fromTemp = Math.min(c.hp.temp, amount);
  const rest = amount - fromTemp;
  let { current } = c.hp;
  let { deathSaves, conditions } = c;
  let dead: boolean = c.dead;
  let concentratingOn = c.spellcasting.concentratingOn;
  let concentrationDC: number | undefined;

  if (rest > 0 && current === 0) {
    if (rest >= max) {
      dead = true;
      events.push('instantDeath');
    } else {
      const failures = deathSaves.failures + (opts.critical ? 2 : 1);
      deathSaves = { ...deathSaves, failures: Math.min(3, failures) };
      events.push('deathSaveFailure');
      if (failures >= 3) {
        dead = true;
        events.push('died');
      }
    }
  } else if (rest > 0) {
    const overflow = rest - current;
    current = Math.max(0, current - rest);
    if (current === 0) {
      if (overflow >= max) {
        dead = true;
        events.push('instantDeath');
      } else {
        events.push('dropped');
        conditions = withCondition(conditions, 'unconscious');
      }
    }
  }

  if (concentratingOn) {
    if (current === 0 || dead) {
      concentratingOn = null;
      events.push('concentrationLost');
    } else {
      concentrationDC = Math.min(30, Math.max(10, Math.floor(amount / 2)));
      events.push('concentrationCheck');
    }
  }

  return {
    character: {
      ...c,
      hp: { ...c.hp, temp: c.hp.temp - fromTemp, current },
      deathSaves,
      dead,
      conditions,
      spellcasting: { ...c.spellcasting, concentratingOn },
    },
    events,
    concentrationDC,
  };
}

function regain(c: Character, current: number): Character {
  if (c.hp.current === 0 && current > 0) {
    return {
      ...c,
      hp: { ...c.hp, current },
      deathSaves: { successes: 0, failures: 0 },
      conditions: withoutCondition(c.conditions, 'unconscious'),
    };
  }
  return { ...c, hp: { ...c.hp, current } };
}

export function applyHealing(c: Character, amount: number): Character {
  if (c.dead || !(amount > 0)) return c;
  return regain(c, Math.min(maxHp(c), c.hp.current + amount));
}

/** Temporary HP don't stack; keep the higher value. */
export function setTempHp(c: Character, amount: number): Character {
  return { ...c, hp: { ...c.hp, temp: Math.max(c.hp.temp, Math.max(0, amount)) } };
}

export function rollDeathSave(c: Character, d20: number): Character {
  if (c.dead || c.hp.current > 0) return c;
  if (d20 >= 20) return regain(c, 1);
  let { successes, failures } = c.deathSaves;
  if (d20 === 1) failures += 2;
  else if (d20 >= 10) successes += 1;
  else failures += 1;
  if (failures >= 3) return { ...c, dead: true, deathSaves: { successes, failures: 3 } };
  if (successes >= 3) return { ...c, deathSaves: { successes: 0, failures: 0 } };
  return { ...c, deathSaves: { successes, failures } };
}

export function canRest(c: Character): boolean {
  return !c.dead && c.hp.current >= 1;
}

export function hitDiceRemaining(c: Character): number[] {
  return c.classes.map((k) => Math.max(0, k.level - k.hitDiceUsed));
}

export function shortRest(c: Character, spend: { classIndex: number; roll: number }[]): Character {
  const classes = c.classes.map((k) => ({ ...k }));
  const con = mod(c, 'con');
  let healed = 0;
  for (const s of spend) {
    const k = classes[s.classIndex];
    if (!k || k.level - k.hitDiceUsed <= 0) continue;
    k.hitDiceUsed += 1;
    healed += Math.max(1, s.roll + con);
  }
  const next: Character = {
    ...c,
    classes,
    resources: c.resources.map((r) => (r.recharge === 'short' ? { ...r, used: 0 } : r)),
    spellcasting: { ...c.spellcasting, pactUsed: 0 },
  };
  return { ...next, hp: { ...next.hp, current: Math.min(maxHp(next), next.hp.current + healed) } };
}

export function longRest(c: Character): Character {
  return {
    ...c,
    hp: { ...c.hp, current: maxHp(c), temp: 0 },
    deathSaves: { successes: 0, failures: 0 },
    classes: c.classes.map((k) => ({ ...k, hitDiceUsed: 0 })),
    spellcasting: { ...c.spellcasting, slotsUsed: c.spellcasting.slotsUsed.map(() => 0), pactUsed: 0 },
    resources: c.resources.map((r) => (r.recharge === 'none' ? r : { ...r, used: 0 })),
    exhaustion: Math.max(0, c.exhaustion - 1),
  };
}

/** Speed after exhaustion (−5 ft per level, 2024). */
export function currentSpeed(c: Character): number {
  return Math.max(0, c.speed - 5 * Math.max(0, c.exhaustion));
}
