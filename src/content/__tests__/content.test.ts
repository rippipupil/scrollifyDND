import { allEntries, getEntry, searchContent } from '..';

test('bundled SRD content is available by id', () => {
  expect(getEntry('fireball')?.name.es).toBe('Bola de fuego');
  expect(getEntry('wizard')?.category).toBe('class');
});

test('homebrew entries are merged and searchable', () => {
  const hb = { id: 'hb-aasimar-caido', category: 'species' as const, name: { en: 'Fallen Aasimar', es: 'Aasimar caído' }, source: 'homebrew' as const };
  expect(allEntries([hb]).some((e) => e.id === 'hb-aasimar-caido')).toBe(true);
  expect(searchContent('aasimar caido', {}, 'es', [hb])[0].id).toBe('hb-aasimar-caido');
});
