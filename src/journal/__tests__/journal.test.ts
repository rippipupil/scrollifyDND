import { backlinks, findByTitle, linkedTitles, newEntry, renameEntry, sanitizeEntry, sortEntries, splitLinks } from '../journal';

const page = (id: string, kind: Parameters<typeof newEntry>[0], title: string, body = '', extra = {}) => ({ ...newEntry(kind, title), id, body, ...extra });

test('[[links]] are found once each, ignoring case and accents', () => {
  expect(linkedTitles('Vimos a [[Sildar]] en [[Phandalin]] y luego a [[sildar]] otra vez. [[ ]]')).toEqual(['Sildar', 'Phandalin']);
  expect(splitLinks('Hablad con [[Toblen]] en la posada')).toEqual([{ text: 'Hablad con ' }, { text: 'Toblen', link: true }, { text: ' en la posada' }]);
});

test('pages are found by title and know who links to them', () => {
  const npc = page('a', 'npc', 'Toblen Piedracolina');
  const s1 = page('b', 'session', 'Sesión 1', 'Dormimos en casa de [[toblen piedracolina]].');
  const s2 = page('c', 'session', 'Sesión 2', 'Nada que ver.');
  expect(findByTitle([npc, s1], 'TOBLEN PIEDRACOLINA')?.id).toBe('a');
  expect(backlinks([npc, s1, s2], npc).map((e) => e.id)).toEqual(['b']);
});

test('renaming a page rewrites the links to it', () => {
  const entries = {
    a: page('a', 'place', 'Phandalín'),
    b: page('b', 'quest', 'Rescate', 'Ir a [[phandalin]] y luego a [[Cragmaw]].'),
  };
  const out = renameEntry(entries, 'a', 'Phandalin (pueblo)');
  expect(out.a.title).toBe('Phandalin (pueblo)');
  expect(out.b.body).toBe('Ir a [[Phandalin (pueblo)]] y luego a [[Cragmaw]].');
});

test('sessions newest first and open quests first', () => {
  const list = [
    page('s1', 'session', 'Uno', '', { date: '2026-09-01' }),
    page('s2', 'session', 'Dos', '', { date: '2026-10-01' }),
    page('q1', 'quest', 'B hecha', '', { status: 'done' }),
    page('q2', 'quest', 'A abierta', '', { status: 'open' }),
  ];
  expect(sortEntries(list.slice(0, 2)).map((e) => e.id)).toEqual(['s2', 's1']);
  expect(sortEntries(list.slice(2)).map((e) => e.id)).toEqual(['q2', 'q1']);
});

test('new pages get today for sessions and open for quests; junk is repaired', () => {
  expect(newEntry('session', 'S', new Date('2026-10-12T20:00:00Z')).date).toBe('2026-10-12');
  expect(newEntry('quest').status).toBe('open');
  const e = sanitizeEntry({ kind: 'quest', title: 3, status: 'lost', date: '2026-01-01' });
  expect(e).toMatchObject({ kind: 'quest', title: '', status: 'open' });
  expect(e.date).toBeUndefined();
  expect(sanitizeEntry({ kind: 'weird' }).kind).toBe('note');
  expect(() => sanitizeEntry('nope')).toThrow();
});
