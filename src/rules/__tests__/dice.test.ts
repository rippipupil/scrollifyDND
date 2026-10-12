import { parseDice, roll } from '../dice';

describe('parseDice', () => {
  test('2d6+3', () => {
    const p = parseDice('2d6+3');
    expect(p.ok && p.terms).toEqual([
      { sign: 1, count: 2, sides: 6 },
      { sign: 1, value: 3 },
    ]);
  });
  test('d20 means 1d20', () => {
    const p = parseDice('d20');
    expect(p.ok && p.terms).toEqual([{ sign: 1, count: 1, sides: 20 }]);
  });
  test('1d8-1 with spaces', () => {
    const p = parseDice(' 1d8 - 1 ');
    expect(p.ok && p.terms).toEqual([
      { sign: 1, count: 1, sides: 8 },
      { sign: -1, value: 1 },
    ]);
  });
  test('d% is d100', () => {
    const p = parseDice('d%');
    expect(p.ok && p.terms).toEqual([{ sign: 1, count: 1, sides: 100 }]);
  });
  test('plain number', () => {
    const p = parseDice('5');
    expect(p.ok && p.terms).toEqual([{ sign: 1, value: 5 }]);
  });
  test.each(['2x6', '', 'd', '2d', '1d0', '1000d6', '3++2'])('invalid "%s"', (e) => {
    expect(parseDice(e).ok).toBe(false);
  });
});

describe('roll', () => {
  const seq = (...v: number[]) => {
    let i = 0;
    return (sides: number) => Math.min(sides, v[i++ % v.length]);
  };
  test('2d6+3 totals the dice plus modifier', () => {
    const r = roll('2d6+3', { die: seq(4, 5) });
    expect(r.ok && r.total).toBe(12);
    expect(r.ok && r.parts[0].rolls).toEqual([4, 5]);
  });
  test('subtracted dice', () => {
    const r = roll('1d20-1d4', { die: seq(15, 3) });
    expect(r.ok && r.total).toBe(12);
  });
  test('natural reported for a single d20', () => {
    const r = roll('1d20+5', { die: seq(20) });
    expect(r.ok && r.natural).toBe(20);
    expect(r.ok && r.total).toBe(25);
  });
  test('advantage keeps the higher d20', () => {
    const r = roll('1d20+2', { adv: true, die: seq(3, 17) });
    expect(r.ok && r.total).toBe(19);
    expect(r.ok && r.parts[0].rolls).toEqual([3, 17]);
    expect(r.ok && r.parts[0].kept).toEqual([17]);
  });
  test('disadvantage keeps the lower d20', () => {
    const r = roll('1d20+2', { dis: true, die: seq(3, 17) });
    expect(r.ok && r.total).toBe(5);
  });
  test('advantage and disadvantage cancel', () => {
    const r = roll('1d20', { adv: true, dis: true, die: seq(8, 19) });
    expect(r.ok && r.parts[0].rolls).toEqual([8]);
  });
  test('invalid expression returns error', () => {
    expect(roll('2x6').ok).toBe(false);
  });
  test('default die stays within range', () => {
    for (let i = 0; i < 200; i++) {
      const r = roll('1d6');
      expect(r.ok && r.total).toBeGreaterThanOrEqual(1);
      expect(r.ok && r.total).toBeLessThanOrEqual(6);
    }
  });
});

describe('rolledDice (what the dice tray draws)', () => {
  const { rolledDice } = require('../dice');
  const seq = (...faces: number[]) => {
    let i = 0;
    return () => faces[i++];
  };

  test('one entry per physical die, with its sides and face', () => {
    const r = roll('2d6+1d8+3', { die: seq(4, 2, 7) });
    expect(rolledDice(r)).toEqual([
      { sides: 6, value: 4, dropped: false },
      { sides: 6, value: 2, dropped: false },
      { sides: 8, value: 7, dropped: false },
    ]);
  });

  test('advantage shows both d20s and marks the lower one dropped', () => {
    const r = roll('1d20+5', { adv: true, die: seq(3, 17) });
    expect(rolledDice(r)).toEqual([
      { sides: 20, value: 3, dropped: true },
      { sides: 20, value: 17, dropped: false },
    ]);
  });

  test('a tie under disadvantage drops only one die', () => {
    const r = roll('1d20', { dis: true, die: seq(9, 9) });
    expect(rolledDice(r).filter((d: { dropped: boolean }) => d.dropped)).toHaveLength(1);
  });

  test('failed rolls and flat modifiers draw nothing', () => {
    expect(rolledDice(roll('nope'))).toEqual([]);
    expect(rolledDice(roll('5'))).toEqual([]);
  });
});
