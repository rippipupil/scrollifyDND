import { newCharacter } from '../../rules/core';
import { newEnemy } from '../enemy';
import {
  addCharacter,
  addEnemy,
  applyCombatDamage,
  applyCombatHeal,
  emptyEncounter,
  nextTurn,
  orderedCombatants,
  removeCombatant,
  rollEnemyInitiative,
  sanitizeEncounter,
  setCombatTemp,
  toggleCombatCondition,
} from '../encounter';

const goblin = newEnemy({ id: 'gob', name: 'Trasgo', hpMax: 7, hpFormula: '2d6', ac: 15, abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 } });
const fixedDie = (n: number) => () => n;

test('adding several copies numbers them and continues the numbering', () => {
  let enc = addEnemy(emptyEncounter(), goblin, 3);
  expect(enc.combatants.map((c) => c.name)).toEqual(['Trasgo 1', 'Trasgo 2', 'Trasgo 3']);
  enc = addEnemy(enc, goblin, 1);
  expect(enc.combatants.map((c) => c.name).at(-1)).toBe('Trasgo 4');
  expect(enc.combatants[0]).toMatchObject({ kind: 'enemy', enemyId: 'gob', hp: 7, hpMax: 7, ac: 15, initBonus: 2, initiative: null });
});

test('a single copy keeps the plain name', () => {
  expect(addEnemy(emptyEncounter(), goblin, 1).combatants[0].name).toBe('Trasgo');
});

test('HP can be rolled from the formula', () => {
  const enc = addEnemy(emptyEncounter(), goblin, 2, { rollHp: true, die: fixedDie(6) });
  expect(enc.combatants.map((c) => c.hp)).toEqual([12, 12]);
  expect(enc.combatants[0].hpMax).toBe(12);
});

test('player characters join with their sheet values', () => {
  const pc = newCharacter({ name: 'Angvel', abilities: { str: 12, dex: 10, con: 14, int: 16, wis: 13, cha: 19 }, classes: [{ classId: 'wizard', name: { en: 'Wizard' }, level: 4, hitDie: 6, hitDiceUsed: 0, casterType: 'full' }] });
  const enc = addCharacter(emptyEncounter(), { ...pc, hp: { ...pc.hp, current: 18 } });
  expect(enc.combatants[0]).toMatchObject({ kind: 'pc', characterId: pc.id, name: 'Angvel', hp: 18, hpMax: 26, ac: 10, initBonus: 0 });
});

test('rolling initiative fills only enemies without one; order is highest first', () => {
  let enc = addEnemy(emptyEncounter(), goblin, 2);
  enc = { ...enc, combatants: [...enc.combatants, { ...enc.combatants[0], uid: 'pc', kind: 'pc', name: 'PJ', initiative: 18 }] };
  enc = rollEnemyInitiative(enc, fixedDie(10));
  expect(enc.combatants.filter((c) => c.kind === 'enemy').map((c) => c.initiative)).toEqual([12, 12]);
  expect(orderedCombatants(enc).map((c) => c.name)).toEqual(['PJ', 'Trasgo 1', 'Trasgo 2']);
});

test('combatants without initiative go last', () => {
  let enc = addEnemy(emptyEncounter(), goblin, 2);
  enc = { ...enc, combatants: enc.combatants.map((c, i) => (i === 1 ? { ...c, initiative: 5 } : c)) };
  expect(orderedCombatants(enc).map((c) => c.name)).toEqual(['Trasgo 2', 'Trasgo 1']);
});

test('next turn starts the combat, walks the order, skips defeated enemies and counts rounds', () => {
  let enc = rollEnemyInitiative(addEnemy(emptyEncounter(), goblin, 3), fixedDie(10));
  const [a, b, c] = orderedCombatants(enc).map((x) => x.uid);
  enc = nextTurn(enc);
  expect(enc).toMatchObject({ round: 1, activeUid: a });
  enc = applyCombatDamage(enc, b, 99);
  enc = nextTurn(enc);
  expect(enc.activeUid).toBe(c);
  enc = nextTurn(enc);
  expect(enc).toMatchObject({ round: 2, activeUid: a });
});

test('damage uses temp HP first and stops at 0; healing caps at max', () => {
  let enc = addEnemy(emptyEncounter(), goblin, 1);
  const id = enc.combatants[0].uid;
  enc = setCombatTemp(enc, id, 3);
  enc = applyCombatDamage(enc, id, 5);
  expect(enc.combatants[0]).toMatchObject({ temp: 0, hp: 5 });
  enc = applyCombatDamage(enc, id, 50);
  expect(enc.combatants[0].hp).toBe(0);
  enc = applyCombatHeal(enc, id, 100);
  expect(enc.combatants[0].hp).toBe(7);
});

test('conditions toggle on and off', () => {
  let enc = addEnemy(emptyEncounter(), goblin, 1);
  const id = enc.combatants[0].uid;
  enc = toggleCombatCondition(enc, id, 'prone');
  expect(enc.combatants[0].conditions).toEqual(['prone']);
  expect(toggleCombatCondition(enc, id, 'prone').combatants[0].conditions).toEqual([]);
});

test('removing the active combatant passes the turn to the next one', () => {
  let enc = rollEnemyInitiative(addEnemy(emptyEncounter(), goblin, 3), fixedDie(10));
  const order = orderedCombatants(enc).map((x) => x.uid);
  enc = nextTurn(enc);
  enc = removeCombatant(enc, order[0]);
  expect(enc.activeUid).toBe(order[1]);
  expect(enc.combatants).toHaveLength(2);
  const last = removeCombatant(removeCombatant(enc, order[1]), order[2]);
  expect(last).toMatchObject({ combatants: [], activeUid: null, round: 0 });
});

test('sanitizeEncounter repairs junk', () => {
  const enc = sanitizeEncounter({ round: 'x', activeUid: 5, combatants: [null, { name: 3, hp: 'a', conditions: 'prone' }] });
  expect(enc.round).toBe(0);
  expect(enc.activeUid).toBeNull();
  expect(enc.combatants).toHaveLength(1);
  expect(enc.combatants[0]).toMatchObject({ name: '', hp: 0, conditions: [], initiative: null, kind: 'other' });
  expect(sanitizeEncounter(undefined)).toEqual(emptyEncounter());
});
