/**
 * Builds assets/data/spell-icons.json from data/icons/spell-icons.json (spell key → game-icons.net icon) and a local
 * clone of https://github.com/game-icons/icons (CC BY 3.0). Only the icons in use are bundled.
 * Usage: node --experimental-strip-types scripts/build-spell-icons.ts --icons DIR
 */
import fs from 'node:fs';
import path from 'node:path';

/** Default icon per school, for homebrew spells and anything without its own icon. */
export const SCHOOL_ICONS: Record<string, string> = {
  abjuration: 'lorc/magic-shield',
  conjuration: 'lorc/magic-portal',
  divination: 'lorc/crystal-ball',
  enchantment: 'lorc/charm',
  evocation: 'lorc/fire-ray',
  illusion: 'lorc/domino-mask',
  necromancy: 'sbed/death-skull',
  transmutation: 'delapouite/transform',
  none: 'delapouite/spell-book',
};

/** Rounds every number in a path to one decimal; each number keeps a leading separator so tokens never merge. */
export function compactPath(d: string): string {
  return d
    .replace(/-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi, (n) => ` ${Number(Number(n).toFixed(1))}`)
    .replace(/\s+/g, ' ')
    .replace(/([a-zA-Z]) /g, '$1')
    .trim();
}

/** The glyph paths of a game-icons SVG, without its black background square. */
export function glyphPaths(svg: string): string[] {
  return [...svg.matchAll(/<path([^>]*)\sd="([^"]+)"/g)].filter((m) => !/^M0 0h512v512H0z$/.test(m[2])).map((m) => compactPath(m[2]));
}

function main() {
  const i = process.argv.indexOf('--icons');
  if (i < 0) throw new Error('missing --icons DIR');
  const iconsDir = process.argv[i + 1];
  const root = process.cwd();
  const assign: Record<string, string> = JSON.parse(fs.readFileSync(path.join(root, 'data/icons/spell-icons.json'), 'utf8'));
  const used = new Set([...Object.values(assign), ...Object.values(SCHOOL_ICONS)]);
  const paths: Record<string, string[]> = {};
  for (const id of used) {
    const file = path.join(iconsDir, `${id}.svg`);
    if (!fs.existsSync(file)) throw new Error(`icon not found: ${id}`);
    paths[id] = glyphPaths(fs.readFileSync(file, 'utf8'));
  }
  const out = { spells: assign, schools: SCHOOL_ICONS, paths };
  fs.writeFileSync(path.join(root, 'assets/data/spell-icons.json'), JSON.stringify(out));
  const kb = Math.round(fs.statSync(path.join(root, 'assets/data/spell-icons.json')).size / 1024);
  console.log(`spell icons: ${Object.keys(assign).length} spells, ${used.size} icons, ${kb} KB`);
}

if (process.argv[1]?.endsWith('build-spell-icons.ts')) main();
