import { newCharacter } from '../../rules/core';
import { useCharacters } from '../characters';

beforeEach(() => useCharacters.setState({ characters: {} }));

test('add, update and remove a character', () => {
  const c = newCharacter({ name: 'Angvel' });
  useCharacters.getState().add(c);
  expect(useCharacters.getState().characters[c.id].name).toBe('Angvel');
  useCharacters.getState().update(c.id, (x) => ({ ...x, name: 'Angvel el Caído' }));
  expect(useCharacters.getState().characters[c.id].name).toBe('Angvel el Caído');
  expect(useCharacters.getState().characters[c.id].updatedAt).toBeGreaterThanOrEqual(c.updatedAt);
  useCharacters.getState().remove(c.id);
  expect(useCharacters.getState().characters[c.id]).toBeUndefined();
});

test('update on a missing id is a no-op', () => {
  useCharacters.getState().update('nope', (x) => x);
  expect(useCharacters.getState().characters).toEqual({});
});
