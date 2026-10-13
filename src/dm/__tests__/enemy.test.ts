import { getEntry } from '../../content';
import { crLabel, enemyFromMonster, enemyInitBonus, newEnemy, sanitizeEnemy } from '../enemy';

test('a new enemy has sensible defaults', () => {
  const e = newEnemy({ name: 'Bandido' });
  expect(e.name).toBe('Bandido');
  expect(e.abilities).toEqual({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
  expect(e.hpMax).toBeGreaterThan(0);
  expect(e.actions).toEqual([]);
  expect(enemyInitBonus(e)).toBe(0);
});

test('copies an SRD monster into an editable enemy', () => {
  const e = enemyFromMonster(getEntry('monster:goblin-warrior')!, 'es');
  expect(e.name).toBe('Trasgo guerrero');
  expect(e.source).toBe('monster:goblin-warrior');
  expect(e).toMatchObject({ size: 'Small', type: 'feérico', ac: 15, hpMax: 10, hpFormula: '3d6', cr: 0.25, xp: 50 });
  expect(e.abilities).toEqual({ str: 8, dex: 15, con: 10, int: 10, wis: 8, cha: 8 });
  expect(e.skills).toEqual([{ id: 'stealth', bonus: 6 }]);
  expect(e.speed).toBe('9 m');
  expect(e.passivePerception).toBe(9);
  expect(e.languages).toBe('Common, Goblin');
  const scimitar = e.actions.find((a) => a.name === 'Scimitar')!;
  expect(scimitar).toMatchObject({ kind: 'action', attackBonus: 4, damage: '1d6+2', damageType: 'slashing' });
  expect(scimitar.text).toContain('Melee Attack Roll');
  // Translated features come from the SRD 5.2 Spanish translation; the rest keep their English text.
  expect(e.actions.find((a) => a.name === 'Huida escurridiza')).toMatchObject({ kind: 'bonus', text: expect.stringContaining('Destrabarse') });
  expect(enemyInitBonus(e)).toBe(2);
  const en = enemyFromMonster(getEntry('monster:goblin-warrior')!, 'en');
  expect(en.actions.find((a) => a.name === 'Nimble Escape')?.text).toContain('Disengage');
});

test('monster saves, resistances, condition immunities, save DCs and other speeds are kept', () => {
  const aboleth = enemyFromMonster(getEntry('monster:aboleth')!, 'en');
  expect(Object.keys(aboleth.saves).length).toBeGreaterThan(0);
  expect(aboleth.speed).toBe('10 ft., swim 40 ft.');
  expect(aboleth.actions.some((a) => a.kind === 'legendary')).toBe(true);
  const tentacle = aboleth.actions.find((a) => a.name === 'Tentacle')!;
  expect(tentacle.attackBonus).toBe(9);
  expect(tentacle.save).toBeUndefined(); // escape DC, not a saving throw
  const withSave = (getEntry('monster:adult-red-dragon') ?? getEntry('monster:young-red-dragon'))!;
  const dragon = enemyFromMonster(withSave, 'en');
  expect(dragon.immunities).toContain('fire');
  expect(dragon.actions.some((a) => a.save && a.save.dc > 0 && a.save.ability === 'dex')).toBe(true);
  const ci = enemyFromMonster(getEntry('monster:zombie') ?? getEntry('monster:skeleton')!, 'en');
  expect(ci.conditionImmunities.length).toBeGreaterThan(0);
});

test('challenge rating labels use fractions', () => {
  expect(crLabel(0.125)).toBe('1/8');
  expect(crLabel(0.25)).toBe('1/4');
  expect(crLabel(0.5)).toBe('1/2');
  expect(crLabel(5)).toBe('5');
});

test('sanitizeEnemy repairs junk instead of crashing', () => {
  const e = sanitizeEnemy({ id: 'x', name: 7, hpMax: 'lots', abilities: null, actions: [null, { name: 'Bite', attackBonus: 'x', kind: 'nope' }], resistances: 'fire', skills: [{ id: 'stealth', bonus: '3' }, 5] });
  expect(e.id).toBe('x');
  expect(typeof e.name).toBe('string');
  expect(Number.isFinite(e.hpMax)).toBe(true);
  expect(e.abilities.dex).toBe(10);
  expect(e.actions).toHaveLength(1);
  expect(e.actions[0]).toMatchObject({ name: 'Bite', kind: 'action' });
  expect(e.actions[0].attackBonus).toBeUndefined();
  expect(e.resistances).toEqual([]);
  expect(e.skills).toEqual([{ id: 'stealth', bonus: 3 }]);
  expect(() => sanitizeEnemy(null)).toThrow();
});

test('in Spanish, an SRD copy gets Spanish type, alignment, metric speed and senses', () => {
  const g = enemyFromMonster(getEntry('monster:goblin-warrior')!, 'es');
  expect(g.type).toBe('feérico');
  expect(g.alignment).toBe('caótico neutral');
  expect(g.speed).toBe('9 m');
  expect(g.senses).toBe('visión en la oscuridad 18 m');
  const aboleth = enemyFromMonster(getEntry('monster:aboleth')!, 'es');
  expect(aboleth.speed).toBe('3 m, nadar 12 m');
  const en = enemyFromMonster(getEntry('monster:goblin-warrior')!, 'en');
  expect(en.type).toBe('fey');
  expect(en.speed).toBe('30 ft.');
});
