import { armorClass } from '../rules/combat';
import { initiative, uid } from '../rules/core';
import { roll } from '../rules/dice';
import { maxHp } from '../rules/health';
import type { Character } from '../rules/types';
import { enemyInitBonus } from './enemy';
import type { Combatant, Encounter, Enemy } from './types';

type Die = (sides: number) => number;

export function emptyEncounter(): Encounter {
  return { combatants: [], round: 0, activeUid: null };
}

const update = (enc: Encounter, id: string, fn: (c: Combatant) => Combatant): Encounter => ({
  ...enc,
  combatants: enc.combatants.map((c) => (c.uid === id ? fn(c) : c)),
});

/** Adds `count` copies of a bestiary enemy, numbered after any copies already in the fight. */
export function addEnemy(enc: Encounter, e: Enemy, count: number, opts: { rollHp?: boolean; die?: Die } = {}): Encounter {
  const n = Math.max(1, Math.floor(count));
  const pattern = new RegExp(`^${e.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: (\\d+))?$`);
  const taken = enc.combatants.map((c) => c.name.match(pattern)).filter((m): m is RegExpMatchArray => !!m);
  const numbered = n > 1 || taken.length > 0;
  let next = taken.reduce((max, m) => Math.max(max, m[1] ? Number(m[1]) : 1), 0) + 1;
  // A lone earlier copy named without a number keeps its name; new ones continue from 2.
  const added: Combatant[] = Array.from({ length: n }, () => {
    const rolled = opts.rollHp && e.hpFormula ? roll(e.hpFormula, { die: opts.die }) : null;
    const hp = rolled && rolled.ok ? Math.max(1, rolled.total) : e.hpMax;
    const name = numbered ? `${e.name} ${next++}` : e.name;
    return { uid: uid('cmb'), name, kind: 'enemy', enemyId: e.id, initiative: null, initBonus: enemyInitBonus(e), hp, hpMax: hp, temp: 0, ac: e.ac, conditions: [], note: '' };
  });
  return { ...enc, combatants: [...enc.combatants, ...added] };
}

/** Adds a saved player character; HP here is a copy for the DM's view. */
export function addCharacter(enc: Encounter, c: Character): Encounter {
  const pc: Combatant = {
    uid: uid('cmb'),
    name: c.name,
    kind: 'pc',
    characterId: c.id,
    initiative: null,
    initBonus: initiative(c),
    hp: c.hp.current,
    hpMax: maxHp(c),
    temp: c.hp.temp,
    ac: armorClass(c),
    conditions: [...c.conditions],
    note: '',
  };
  return { ...enc, combatants: [...enc.combatants, pc] };
}

export function addOther(enc: Encounter, name: string): Encounter {
  const c: Combatant = { uid: uid('cmb'), name, kind: 'other', initiative: null, initBonus: 0, hp: 0, hpMax: 0, temp: 0, ac: 10, conditions: [], note: '' };
  return { ...enc, combatants: [...enc.combatants, c] };
}

/** Rolls d20 + bonus for enemies that have no initiative yet. */
export function rollEnemyInitiative(enc: Encounter, die?: Die): Encounter {
  return {
    ...enc,
    combatants: enc.combatants.map((c) => {
      if (c.kind !== 'enemy' || c.initiative !== null) return c;
      const r = roll(`1d20${c.initBonus >= 0 ? '+' : ''}${c.initBonus}`, { die });
      return r.ok ? { ...c, initiative: r.total } : c;
    }),
  };
}

export function setInitiative(enc: Encounter, id: string, value: number | null): Encounter {
  return update(enc, id, (c) => ({ ...c, initiative: value }));
}

/** Turn order: highest initiative first, ties by bonus, unrolled last; otherwise the order they were added. */
export function orderedCombatants(enc: Encounter): Combatant[] {
  return enc.combatants
    .map((c, i) => ({ c, i }))
    .sort((x, y) => {
      const a = x.c.initiative;
      const b = y.c.initiative;
      if (a === null || b === null) return a === b ? x.i - y.i : a === null ? 1 : -1;
      return b - a || y.c.initBonus - x.c.initBonus || x.i - y.i;
    })
    .map((x) => x.c);
}

const defeated = (c: Combatant) => c.kind === 'enemy' && c.hp <= 0;

/** Starts the combat or passes the turn, skipping defeated enemies; wrapping around adds a round. */
export function nextTurn(enc: Encounter): Encounter {
  const order = orderedCombatants(enc);
  const alive = order.filter((c) => !defeated(c));
  if (!alive.length) return enc;
  if (enc.round === 0 || !enc.activeUid) return { ...enc, round: Math.max(1, enc.round), activeUid: alive[0].uid };
  const at = order.findIndex((c) => c.uid === enc.activeUid);
  for (let step = 1; step <= order.length; step++) {
    const idx = at + step;
    const c = order[idx % order.length];
    if (!defeated(c)) return { ...enc, activeUid: c.uid, round: enc.round + (idx >= order.length ? 1 : 0) };
  }
  return enc;
}

export function removeCombatant(enc: Encounter, id: string): Encounter {
  const rest = enc.combatants.filter((c) => c.uid !== id);
  if (!rest.length) return emptyEncounter();
  if (enc.activeUid !== id) return { ...enc, combatants: rest };
  const order = orderedCombatants(enc);
  const at = order.findIndex((c) => c.uid === id);
  const following = [...order.slice(at + 1), ...order.slice(0, at)].find((c) => !defeated(c));
  return { ...enc, combatants: rest, activeUid: following?.uid ?? null };
}

export function applyCombatDamage(enc: Encounter, id: string, amount: number): Encounter {
  if (!(amount > 0)) return enc;
  return update(enc, id, (c) => {
    const fromTemp = Math.min(c.temp, amount);
    return { ...c, temp: c.temp - fromTemp, hp: Math.max(0, c.hp - (amount - fromTemp)) };
  });
}

export function applyCombatHeal(enc: Encounter, id: string, amount: number): Encounter {
  if (!(amount > 0)) return enc;
  return update(enc, id, (c) => ({ ...c, hp: Math.min(c.hpMax || Infinity, c.hp + amount) }));
}

/** Temporary HP don't stack; keep the higher value. */
export function setCombatTemp(enc: Encounter, id: string, amount: number): Encounter {
  return update(enc, id, (c) => ({ ...c, temp: Math.max(c.temp, Math.max(0, amount)) }));
}

export function toggleCombatCondition(enc: Encounter, id: string, cond: string): Encounter {
  return update(enc, id, (c) => ({ ...c, conditions: c.conditions.includes(cond) ? c.conditions.filter((x) => x !== cond) : [...c.conditions, cond] }));
}

export function patchCombatant(enc: Encounter, id: string, patch: Partial<Combatant>): Encounter {
  return update(enc, id, (c) => ({ ...c, ...patch }));
}

const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** Repairs a stored encounter so the tracker can't crash on it. */
export function sanitizeEncounter(raw: unknown): Encounter {
  if (!isObj(raw)) return emptyEncounter();
  const combatants: Combatant[] = (Array.isArray(raw.combatants) ? raw.combatants : []).filter(isObj).map((c: Record<string, any>) => ({
    uid: str(c.uid) || uid('cmb'),
    name: str(c.name),
    kind: c.kind === 'enemy' || c.kind === 'pc' ? c.kind : 'other',
    ...(typeof c.enemyId === 'string' ? { enemyId: c.enemyId } : {}),
    ...(typeof c.characterId === 'string' ? { characterId: c.characterId } : {}),
    initiative: typeof c.initiative === 'number' && Number.isFinite(c.initiative) ? c.initiative : null,
    initBonus: num(c.initBonus, 0),
    hp: Math.max(0, num(c.hp, 0)),
    hpMax: Math.max(0, num(c.hpMax, 0)),
    temp: Math.max(0, num(c.temp, 0)),
    ac: num(c.ac, 10),
    conditions: Array.isArray(c.conditions) ? c.conditions.filter((x: unknown): x is string => typeof x === 'string') : [],
    note: str(c.note),
  }));
  const activeUid = typeof raw.activeUid === 'string' && combatants.some((c) => c.uid === raw.activeUid) ? raw.activeUid : null;
  return { combatants, round: combatants.length ? Math.max(0, Math.floor(num(raw.round, 0))) : 0, activeUid };
}
