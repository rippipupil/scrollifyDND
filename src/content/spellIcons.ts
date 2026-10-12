// Spell icons from game-icons.net (CC BY 3.0), assigned per spell; see scripts/build-spell-icons.ts.
const data: { spells: Record<string, string>; schools: Record<string, string>; paths: Record<string, string[]> } = require('../../assets/data/spell-icons.json');

/** One colour per school of magic, readable under white glyphs in both themes. */
export const SCHOOL_COLORS: Record<string, string> = {
  abjuration: '#2f6db5',
  conjuration: '#b7791f',
  divination: '#5f7a8a',
  enchantment: '#b83280',
  evocation: '#c0392b',
  illusion: '#6b46c1',
  necromancy: '#2f5d3a',
  transmutation: '#238276',
  none: '#6e5a42',
};

/** The icon of a spell by its content key ("spell:fireball"), falling back to its school's icon. */
export function spellIcon(key: string | undefined, school?: string): { id: string; paths: string[]; color: string } {
  const s = school && SCHOOL_COLORS[school] ? school : 'none';
  const id = (key && data.spells[key]) || data.schools[s] || data.schools.none;
  return { id, paths: data.paths[id] ?? [], color: SCHOOL_COLORS[s] };
}
