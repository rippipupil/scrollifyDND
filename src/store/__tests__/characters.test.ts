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

test('stored characters that cannot be read are kept in a backup, not dropped', async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default ?? require('@react-native-async-storage/async-storage');
  const { loadStoredCharacters, BACKUP_KEY } = require('../characters');
  const good = newCharacter({ name: 'Ok' });
  const future = { id: 'f', name: 'Future', schemaVersion: 999 };
  const characters = await loadStoredCharacters({ [good.id]: good, f: future, junk: 'x' });
  expect(Object.keys(characters)).toEqual([good.id]);
  const backup = JSON.parse((await AsyncStorage.getItem(BACKUP_KEY)) ?? '{}');
  expect(backup.f).toEqual(future);
  expect(backup.junk).toBe('x');
});
