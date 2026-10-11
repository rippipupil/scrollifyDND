import { newCharacter } from '../core';
import {
  applyDamage,
  applyHealing,
  canRest,
  currentSpeed,
  hitDiceRemaining,
  longRest,
  maxHp,
  rollDeathSave,
  setTempHp,
  shortRest,
} from '../health';
import type { Character } from '../types';
import { angvel, wizardClass } from './fixtures';

function hurt(c: Character, current: number, temp = 0): Character {
  return { ...c, hp: { ...c.hp, current, temp, maxOverride: 31 } };
}

describe('maxHp', () => {
  test('Wizard 4 CON 14: 6 + 3×4 avg + 2×4 = 26', () => expect(maxHp(angvel())).toBe(26));
  test('override wins', () => {
    const c = angvel();
    c.hp.maxOverride = 31;
    expect(maxHp(c)).toBe(31);
  });
  test('bonus per level (e.g. Tough) adds per total level', () => {
    const c = angvel();
    c.hp.bonusPerLevel = 2;
    expect(maxHp(c)).toBe(34);
  });
  test('multiclass: only first class gets max die at level 1', () => {
    const c = newCharacter({
      classes: [
        { classId: 'fighter', name: { en: 'Fighter' }, level: 1, hitDie: 10, hitDiceUsed: 0, casterType: 'none' },
        wizardClass(1),
      ],
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    });
    expect(maxHp(c)).toBe(14);
  });
  test('never below 1 per level with terrible CON', () => {
    const c = newCharacter({ classes: [wizardClass(2)], abilities: { str: 10, dex: 10, con: 1, int: 10, wis: 10, cha: 10 } });
    expect(maxHp(c)).toBe(2);
  });
});

describe('applyDamage', () => {
  test('temp HP absorbs first, leftover hits current', () => {
    const { character } = applyDamage(hurt(angvel(), 10, 5), 8);
    expect(character.hp.temp).toBe(0);
    expect(character.hp.current).toBe(7);
  });
  test('damage fully absorbed by temp HP', () => {
    const { character } = applyDamage(hurt(angvel(), 10, 5), 3);
    expect(character.hp.temp).toBe(2);
    expect(character.hp.current).toBe(10);
  });
  test('dropping to 0 makes unconscious', () => {
    const r = applyDamage(hurt(angvel(), 10), 15);
    expect(r.character.hp.current).toBe(0);
    expect(r.character.conditions).toContain('unconscious');
    expect(r.events).toContain('dropped');
    expect(r.character.dead).toBe(false);
  });
  test('remaining damage ≥ max HP is instant death', () => {
    const r = applyDamage(hurt(angvel(), 10), 41);
    expect(r.events).toContain('instantDeath');
    expect(r.character.dead).toBe(true);
  });
  test('temp HP does not count toward overflow', () => {
    const r = applyDamage(hurt(angvel(), 10, 10), 51);
    expect(r.character.dead).toBe(true);
  });
  test('damage at 0 HP is a death save failure; critical is two', () => {
    const c = hurt(angvel(), 0);
    expect(applyDamage(c, 3).character.deathSaves.failures).toBe(1);
    expect(applyDamage(c, 3, { critical: true }).character.deathSaves.failures).toBe(2);
  });
  test('third failure from damage kills', () => {
    const c = hurt(angvel(), 0);
    c.deathSaves.failures = 2;
    expect(applyDamage(c, 1).character.dead).toBe(true);
  });
  test('damage at 0 HP ≥ max HP kills', () => {
    expect(applyDamage(hurt(angvel(), 0), 31).character.dead).toBe(true);
  });
  test('concentration check DC = max(10, floor(dmg/2)), capped at 30', () => {
    const c = hurt(angvel(), 30);
    c.spellcasting.concentratingOn = 'Flaming Sphere';
    expect(applyDamage(c, 7).concentrationDC).toBe(10);
    expect(applyDamage(c, 25).concentrationDC).toBe(12);
    const big = { ...c, hp: { ...c.hp, current: 200, maxOverride: 300 } };
    expect(applyDamage(big, 100).concentrationDC).toBe(30);
    expect(applyDamage(c, 7).events).toContain('concentrationCheck');
  });
  test('dropping to 0 ends concentration', () => {
    const c = hurt(angvel(), 5);
    c.spellcasting.concentratingOn = 'Flaming Sphere';
    const r = applyDamage(c, 10);
    expect(r.character.spellcasting.concentratingOn).toBeNull();
    expect(r.events).toContain('concentrationLost');
  });
  test('zero or negative damage changes nothing', () => {
    const c = hurt(angvel(), 10);
    expect(applyDamage(c, 0).character).toEqual(c);
    expect(applyDamage(c, -5).character).toEqual(c);
  });
});

describe('healing and temp HP', () => {
  test('caps at max', () => expect(applyHealing(hurt(angvel(), 30), 10).hp.current).toBe(31));
  test('healing from 0 resets death saves and removes unconscious', () => {
    const c = applyDamage(hurt(angvel(), 5), 10).character;
    c.deathSaves = { successes: 1, failures: 2 };
    const h = applyHealing(c, 4);
    expect(h.hp.current).toBe(4);
    expect(h.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(h.conditions).not.toContain('unconscious');
  });
  test('dead characters are not healed', () => {
    const c = { ...hurt(angvel(), 0), dead: true };
    expect(applyHealing(c, 10).hp.current).toBe(0);
  });
  test('temp HP do not stack: keep the higher', () => {
    expect(setTempHp(hurt(angvel(), 10, 5), 3).hp.temp).toBe(5);
    expect(setTempHp(hurt(angvel(), 10, 5), 8).hp.temp).toBe(8);
  });
});

describe('death saves', () => {
  const down = () => applyDamage(hurt(angvel(), 5), 10).character;
  test('10+ is a success, below 10 a failure', () => {
    expect(rollDeathSave(down(), 10).deathSaves.successes).toBe(1);
    expect(rollDeathSave(down(), 9).deathSaves.failures).toBe(1);
  });
  test('natural 1 counts two failures', () => expect(rollDeathSave(down(), 1).deathSaves.failures).toBe(2));
  test('natural 20 regains 1 HP', () => {
    const c = rollDeathSave(down(), 20);
    expect(c.hp.current).toBe(1);
    expect(c.conditions).not.toContain('unconscious');
    expect(c.deathSaves).toEqual({ successes: 0, failures: 0 });
  });
  test('third success stabilizes and resets the counters', () => {
    const c = down();
    c.deathSaves.successes = 2;
    const s = rollDeathSave(c, 15);
    expect(s.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(s.hp.current).toBe(0);
  });
  test('third failure kills', () => {
    const c = down();
    c.deathSaves.failures = 2;
    expect(rollDeathSave(c, 5).dead).toBe(true);
  });
});

describe('rests', () => {
  function tired(): Character {
    const c = hurt(angvel(), 10, 4);
    c.classes[0].hitDiceUsed = 3;
    c.spellcasting.slotsUsed = [3, 2, 0, 0, 0, 0, 0, 0, 0];
    c.spellcasting.pactUsed = 1;
    c.exhaustion = 2;
    c.resources = [
      { uid: 'a', name: 'Arcane Recovery', max: 1, used: 1, recharge: 'long' },
      { uid: 'b', name: 'Channel', max: 2, used: 2, recharge: 'short' },
      { uid: 'c', name: 'Wish', max: 1, used: 1, recharge: 'none' },
    ];
    return c;
  }
  test('cannot rest at 0 HP', () => {
    expect(canRest(hurt(angvel(), 0))).toBe(false);
    expect(canRest(hurt(angvel(), 1))).toBe(true);
  });
  test('hit dice remaining', () => expect(hitDiceRemaining(tired())).toEqual([1]));
  test('long rest restores HP, hit dice, slots, resources; clears temp; -1 exhaustion', () => {
    const c = longRest(tired());
    expect(c.hp.current).toBe(31);
    expect(c.hp.temp).toBe(0);
    expect(c.classes[0].hitDiceUsed).toBe(0);
    expect(c.spellcasting.slotsUsed.every((n) => n === 0)).toBe(true);
    expect(c.spellcasting.pactUsed).toBe(0);
    expect(c.exhaustion).toBe(1);
    expect(c.resources.map((r) => r.used)).toEqual([0, 0, 1]);
  });
  test('short rest: spend hit dice (roll + CON, min 1), short resources, pact slots', () => {
    const c = shortRest(tired(), [{ classIndex: 0, roll: 4 }]);
    expect(c.hp.current).toBe(16);
    expect(c.classes[0].hitDiceUsed).toBe(4);
    expect(c.resources.map((r) => r.used)).toEqual([1, 0, 1]);
    expect(c.spellcasting.pactUsed).toBe(0);
    expect(c.spellcasting.slotsUsed[0]).toBe(3);
  });
  test('short rest ignores dice that are not available', () => {
    const c = shortRest(tired(), [
      { classIndex: 0, roll: 4 },
      { classIndex: 0, roll: 4 },
    ]);
    expect(c.hp.current).toBe(16);
  });
  test('hit die healing is at least 1', () => {
    const c = tired();
    c.abilities.con = 3;
    expect(shortRest(c, [{ classIndex: 0, roll: 1 }]).hp.current).toBe(11);
  });
});

test('exhaustion reduces speed by 5 ft per level', () => {
  const c = angvel();
  c.exhaustion = 3;
  expect(currentSpeed(c)).toBe(15);
});
