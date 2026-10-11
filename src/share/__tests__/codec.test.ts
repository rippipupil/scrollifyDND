import { newCharacter, SCHEMA_VERSION } from '../../rules/core';
import { decodeBundle, encodeBundle, fromBase64, prepareCharacterImport, toBase64 } from '../codec';

const angvel = () => newCharacter({ name: 'Angvel ñandú 🍦', player: 'Pablo' });

test('base64 roundtrips UTF-8 text', () => {
  const s = 'Bola de fuego — ñ, á, 🍦';
  expect(fromBase64(toBase64(s))).toBe(s);
});

test('character code roundtrip', () => {
  const c = angvel();
  const code = encodeBundle('character', c);
  expect(code.startsWith('SCRL1:')).toBe(true);
  const r = decodeBundle(code);
  expect(r.ok).toBe(true);
  expect(r.ok && r.kind).toBe('character');
  if (r.ok && r.kind === 'character') expect(r.payload.name).toBe('Angvel ñandú 🍦');
});

test('raw JSON file content is accepted too', () => {
  const json = encodeBundle('character', angvel(), 'json');
  expect(json.trim().startsWith('{')).toBe(true);
  expect(decodeBundle(json).ok).toBe(true);
});

test('homebrew pack roundtrip', () => {
  const pack = [{ id: 'hb-x', category: 'spell', name: { en: 'Contract X', es: 'Contrato X' }, source: 'homebrew', data: { level: 2 } }];
  const r = decodeBundle(encodeBundle('homebrew', pack));
  expect(r.ok && r.kind).toBe('homebrew');
});

test.each(['', 'hello', 'SCRL1:%%%', '{"app":"other"}', '{"app":"scrollify","kind":"character","v":1}', 'SCRL1:' + 'e30'])('garbage %p is rejected', (txt) => {
  expect(decodeBundle(txt).ok).toBe(false);
});

test('homebrew pack with invalid entries is rejected', () => {
  const bad = JSON.stringify({ app: 'scrollify', kind: 'homebrew', v: 1, payload: [{ id: 1 }] });
  expect(decodeBundle(bad).ok).toBe(false);
});

test('old schema characters are migrated on import', () => {
  const raw = JSON.stringify({ app: 'scrollify', kind: 'character', v: 1, payload: { id: 'old', name: 'Viejo', schemaVersion: 0 } });
  const r = decodeBundle(raw);
  expect(r.ok && r.kind === 'character' && r.payload.schemaVersion).toBe(SCHEMA_VERSION);
});

test('import assigns a new id when it collides with an existing character', () => {
  const c = angvel();
  const imported = prepareCharacterImport(c, new Set([c.id]));
  expect(imported.id).not.toBe(c.id);
  expect(prepareCharacterImport(c, new Set()).id).toBe(c.id);
});
