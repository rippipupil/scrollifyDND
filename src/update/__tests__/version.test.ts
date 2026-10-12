import { isNewer, parseManifest } from '../version';

const good = { versionCode: 25, versionName: '1.0.25', apk: 'https://example.com/scrollify-dnd.apk', notes: 'Iconos de conjuros' };

test('parses a valid manifest', () => {
  expect(parseManifest(good)).toEqual(good);
  expect(parseManifest({ ...good, notes: 7 })).toEqual({ versionCode: 25, versionName: '1.0.25', apk: good.apk });
});

test('rejects broken manifests instead of offering a bad update', () => {
  expect(parseManifest(null)).toBeNull();
  expect(parseManifest('x')).toBeNull();
  expect(parseManifest({ ...good, versionCode: 'x' })).toBeNull();
  expect(parseManifest({ ...good, apk: 'ftp://nope' })).toBeNull();
  expect(parseManifest({ ...good, apk: undefined })).toBeNull();
});

test('only a strictly higher build counts as new', () => {
  const m = parseManifest(good);
  expect(isNewer(24, m)).toBe(true);
  expect(isNewer(25, m)).toBe(false);
  expect(isNewer(30, m)).toBe(false);
  expect(isNewer(24, null)).toBe(false);
});
