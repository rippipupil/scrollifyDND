import { critDamage, fullAttack } from '../attack';

/** Dice that return the given faces in order (d20 first). */
const seq = (...faces: number[]) => {
  let i = 0;
  return () => faces[i++ % faces.length];
};

test('critical hits double every damage die but not the modifier', () => {
  expect(critDamage('2d6+3')).toBe('4d6+3');
  expect(critDamage('1d8 + d4 - 1')).toBe('2d8 + 2d4 - 1');
});

test('hit, miss and the damage only on a hit', () => {
  const hit = fullAttack({ toHit: 5, damage: '1d8+3', targetAc: 15, die: seq(10, 6) })!;
  expect([hit.attack.total, hit.hit, hit.damage?.total]).toEqual([15, true, 9]);
  const miss = fullAttack({ toHit: 5, damage: '1d8+3', targetAc: 16, die: seq(10, 6) })!;
  expect([miss.hit, miss.damage]).toEqual([false, undefined]);
});

test('natural 20 always hits and crits; natural 1 always misses', () => {
  const crit = fullAttack({ toHit: 0, damage: '1d8+3', targetAc: 30, die: seq(20, 5, 5) })!;
  expect([crit.hit, crit.crit, crit.damage?.expr, crit.damage?.total]).toEqual([true, true, '2d8+3', 13]);
  const fumble = fullAttack({ toHit: 20, damage: '1d8', targetAc: 5, die: seq(1) })!;
  expect([fumble.hit, fumble.fumble, fumble.damage]).toEqual([false, true, undefined]);
});

test('without a target AC the damage is rolled and the hit is left open', () => {
  const r = fullAttack({ toHit: 4, damage: '2d6', die: seq(12, 3, 3) })!;
  expect([r.hit, r.damage?.total]).toEqual([null, 6]);
});

test('advantage keeps the higher d20', () => {
  const r = fullAttack({ toHit: 0, damage: '1d4', targetAc: 15, mode: 'adv', die: seq(3, 17, 2) })!;
  expect([r.attack.total, r.hit]).toEqual([17, true]);
});
