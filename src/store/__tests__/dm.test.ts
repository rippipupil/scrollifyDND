import { newEnemy } from '../../dm/enemy';
import { emptyEncounter } from '../../dm/encounter';
import { decodeBundle, encodeBundle } from '../../share/codec';
import { useDm } from '../dm';

beforeEach(() => useDm.setState({ enemies: {}, encounter: emptyEncounter() }));

test('save, update and delete enemies', () => {
  const e = newEnemy({ name: 'Bandido' });
  useDm.getState().saveEnemy(e);
  expect(useDm.getState().enemies[e.id].name).toBe('Bandido');
  useDm.getState().saveEnemy({ ...e, name: 'Capitán bandido' });
  expect(useDm.getState().enemies[e.id].name).toBe('Capitán bandido');
  useDm.getState().removeEnemy(e.id);
  expect(useDm.getState().enemies[e.id]).toBeUndefined();
});

test('importing enemies never overwrites: clashing ids get a new id', () => {
  const mine = newEnemy({ id: 'e1', name: 'Mío' });
  useDm.getState().saveEnemy(mine);
  const n = useDm.getState().importEnemies([newEnemy({ id: 'e1', name: 'Del paquete' }), newEnemy({ id: 'e2', name: 'Otro' })]);
  expect(n).toBe(2);
  const names = Object.values(useDm.getState().enemies).map((e) => e.name).sort();
  expect(names).toEqual(['Del paquete', 'Mío', 'Otro']);
  expect(useDm.getState().enemies.e1.name).toBe('Mío');
});

test('updateEncounter applies a pure change', () => {
  useDm.getState().updateEncounter((enc) => ({ ...enc, round: 3 }));
  expect(useDm.getState().encounter.round).toBe(3);
});

test('an enemies bundle round-trips through the share codec and junk is repaired', () => {
  const e = newEnemy({ name: 'Ogro', hpMax: 59 });
  const d = decodeBundle(encodeBundle('enemies', [e, { name: 3, actions: 'x' }]));
  expect(d.ok && d.kind).toBe('enemies');
  if (d.ok && d.kind === 'enemies') {
    expect(d.payload[0]).toMatchObject({ name: 'Ogro', hpMax: 59 });
    expect(d.payload[1]).toMatchObject({ name: '', actions: [] });
  }
  expect(decodeBundle(encodeBundle('enemies', 'nope')).ok).toBe(false);
});
