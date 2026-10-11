import { loc, t } from '..';

test('translates a key in Spanish and English', () => {
  expect(t('es', 'tabs.characters')).toBe('Personajes');
  expect(t('en', 'tabs.characters')).toBe('Characters');
});

test('interpolates variables', () => {
  expect(t('es', 'sheet.level', { n: 4 })).toBe('Nivel 4');
});

test('missing key falls back to English, then to the key itself', () => {
  expect(t('es', 'test.onlyEnglish')).toBe('only english');
  expect(t('es', 'no.such.key')).toBe('no.such.key');
});

test('loc picks the language and falls back to English', () => {
  expect(loc({ en: 'Fireball', es: 'Bola de fuego' }, 'es')).toBe('Bola de fuego');
  expect(loc({ en: 'Fireball' }, 'es')).toBe('Fireball');
  expect(loc(undefined, 'es')).toBe('');
});
