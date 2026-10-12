import { newEnemy } from '../enemy';
import { addEffect, addEnemy, emptyEncounter, nextTurn, removeEffect, sanitizeEncounter, setInitiative } from '../encounter';
import type { Encounter } from '../types';

const goblin = newEnemy({ id: 'gob', name: 'Trasgo', hpMax: 7, ac: 15 });

/** Two goblins with initiative 20 (first) and 10 (second). */
function fight(): Encounter {
  let enc = addEnemy(emptyEncounter(), goblin, 2);
  enc = setInitiative(enc, enc.combatants[0].uid, 20);
  return setInitiative(enc, enc.combatants[1].uid, 10);
}

test('an effect lasts the rounds the DM sets, ticking at the start of its target turn', () => {
  let enc = fight();
  const [a, b] = enc.combatants;
  enc = addEffect(enc, [b.uid], 'Bendición', 2);
  enc = nextTurn(enc); // round 1, A starts: starting the fight ticks nothing
  expect(enc.combatants[1].effects[0].remaining).toBe(2);
  enc = nextTurn(enc); // B's turn: 2 → 1
  expect(enc.combatants[1].effects[0].remaining).toBe(1);
  expect(enc.expired).toEqual([]);
  enc = nextTurn(enc); // round 2, A
  enc = nextTurn(enc); // B's turn: it runs out
  expect(enc.combatants[1].effects).toEqual([]);
  expect(enc.expired).toEqual([{ who: b.name, effect: 'Bendición' }]);
  enc = nextTurn(enc); // the notice stays until the DM dismisses it
  expect(enc.expired).toHaveLength(1);
  expect(enc.activeUid).toBe(a.uid);
});

test('one effect on several combatants, untimed effects stay until removed', () => {
  let enc = fight();
  const ids = enc.combatants.map((c) => c.uid);
  enc = addEffect(enc, ids, 'Agarrado');
  enc = addEffect(enc, ids, '  ', 3);
  expect(enc.combatants.map((c) => c.effects.map((e) => [e.name, e.remaining]))).toEqual([[['Agarrado', null]], [['Agarrado', null]]]);
  for (let i = 0; i < 6; i++) enc = nextTurn(enc);
  expect(enc.combatants[0].effects).toHaveLength(1);
  enc = removeEffect(enc, ids[0], enc.combatants[0].effects[0].uid);
  expect(enc.combatants[0].effects).toEqual([]);
  expect(enc.combatants[1].effects).toHaveLength(1);
});

test('stored encounters from older versions get empty effects; junk is dropped', () => {
  const enc = sanitizeEncounter({
    combatants: [{ uid: 'x', name: 'Viejo', kind: 'enemy', hp: 3, hpMax: 3 }, { uid: 'y', name: 'Con efectos', effects: [{ name: 'Rápido', remaining: 3 }, { name: '' }, 5, { name: 'Sin fin', remaining: -1 }] }],
    round: 1,
    activeUid: 'x',
  });
  expect(enc.combatants[0].effects).toEqual([]);
  expect(enc.combatants[1].effects.map((e) => [e.name, e.remaining])).toEqual([['Rápido', 3], ['Sin fin', null]]);
  expect(enc.expired).toEqual([]);
});
