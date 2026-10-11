import type { ContentEntry } from '../../content/types';
import { useHomebrew } from '../homebrew';

const spell = (id: string, text: string): ContentEntry => ({ id, category: 'spell', name: { en: 'Fire Bolt+' }, text: { en: text }, source: 'homebrew' });

beforeEach(() => useHomebrew.setState({ entries: [] }));

test('importing a pack adds its entries', () => {
  expect(useHomebrew.getState().importMany([spell('a', '1'), spell('b', '2')])).toBe(2);
  expect(useHomebrew.getState().entries.map((e) => e.id).sort()).toEqual(['a', 'b']);
});

test('an identical entry is not duplicated', () => {
  useHomebrew.getState().importMany([spell('a', '1')]);
  expect(useHomebrew.getState().importMany([spell('a', '1')])).toBe(0);
  expect(useHomebrew.getState().entries).toHaveLength(1);
});

test('a different entry with the same id is renamed, never overwriting local edits', () => {
  useHomebrew.getState().upsert(spell('a', 'my local edit'));
  expect(useHomebrew.getState().importMany([spell('a', 'from the pack')])).toBe(1);
  const entries = useHomebrew.getState().entries;
  expect(entries).toHaveLength(2);
  expect(entries.find((e) => e.id === 'a')?.text?.en).toBe('my local edit');
  const copy = entries.find((e) => e.id !== 'a')!;
  expect(copy.id).toBe('a-2');
  expect(copy.text?.en).toBe('from the pack');
  expect(copy.name.en).toBe('Fire Bolt+ (2)');
});
