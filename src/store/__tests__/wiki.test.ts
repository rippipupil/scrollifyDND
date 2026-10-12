import { useWikiUser } from '../wiki';

beforeEach(() => useWikiUser.setState({ notes: {}, favorites: [] }));

test('notes are kept per entry and an empty note is removed', () => {
  useWikiUser.getState().setNote('spell:ext-spell-silvery-barbs', 'Úsalo contra el crítico del dragón');
  expect(useWikiUser.getState().notes['spell:ext-spell-silvery-barbs']).toBe('Úsalo contra el crítico del dragón');
  useWikiUser.getState().setNote('spell:ext-spell-silvery-barbs', '   ');
  expect(useWikiUser.getState().notes).toEqual({});
});

test('favourites toggle, newest first', () => {
  const { toggleFavorite } = useWikiUser.getState();
  toggleFavorite('spell:fireball');
  toggleFavorite('monster:aboleth');
  expect(useWikiUser.getState().favorites).toEqual(['monster:aboleth', 'spell:fireball']);
  toggleFavorite('spell:fireball');
  expect(useWikiUser.getState().favorites).toEqual(['monster:aboleth']);
});

test('restoring a backup merges and ignores junk', () => {
  useWikiUser.getState().setNote('a', 'mine');
  useWikiUser.getState().toggleFavorite('x');
  useWikiUser.getState().restore({ notes: { b: 'theirs', c: 42 as unknown as string }, favorites: ['x', 'y', 7 as unknown as string] });
  expect(useWikiUser.getState().notes).toEqual({ a: 'mine', b: 'theirs' });
  expect(useWikiUser.getState().favorites).toEqual(['x', 'y']);
});
