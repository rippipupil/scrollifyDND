import { compactPath, glyphPaths } from '../build-spell-icons';

test('compactPath rounds numbers without merging tokens', () => {
  expect(compactPath('M108.28 18.78c-1.2 6.07 1.1 13.32')).toBe('M108.3 18.8c-1.2 6.1 1.1 13.3');
  // "1.2.3" means 1.2 and .3; "-.5" is a negative number
  expect(compactPath('l1.2.3-.54 2')).toBe('l1.2 0.3 -0.5 2');
});

test('glyphPaths drops the black background square', () => {
  const svg = '<svg viewBox="0 0 512 512"><path d="M0 0h512v512H0z"/><path fill="#fff" d="M10 10h5v5z"/></svg>';
  expect(glyphPaths(svg)).toEqual(['M10 10h5v5z']);
});
