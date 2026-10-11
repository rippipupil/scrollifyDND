import * as path from 'node:path';
import { parseSpellsMd, joinSoftBreaks } from '../lib/spells-md';

const md = parseSpellsMd(path.resolve(__dirname, '../../data/srd-md/spells.md'));

test('parses every spell heading', () => {
  expect(md.size).toBeGreaterThanOrEqual(339);
});

test('control water body is clean and complete', () => {
  const s = md.get('control-water')!;
  expect(s.text).toContain('_Whirlpool._');
  expect(s.text).not.toContain('Precipitation');
  expect(s.text).toContain('If you choose an area in a large body of water');
});

test('higher-level text is split out', () => {
  const s = md.get('fireball')!;
  expect(s.higherLevel).toMatch(/^The damage increases by 1d6/);
  expect(s.text).not.toContain('Using a Higher-Level Spell Slot');
});

test('cantrip upgrade stays in the body', () => {
  expect(md.get('fire-bolt')!.text).toContain('_Cantrip Upgrade._');
});

test('joinSoftBreaks joins wrapped lines but keeps paragraphs, tables and lists', () => {
  expect(joinSoftBreaks('a\nb\n\nc')).toBe('a b\n\nc');
  expect(joinSoftBreaks('| a | b |\n| c | d |')).toBe('| a | b |\n| c | d |');
  expect(joinSoftBreaks('- one\n- two')).toBe('- one\n- two');
});
