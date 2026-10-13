/**
 * One-off importer for the index of official monsters outside the SRD. Reads a local copy of
 * 5etools-src data/bestiary and keeps facts only (name, size, creature type, challenge rating, armor class,
 * average hit points, book and page); no stat block text is copied. The app links to AideDD for the full monster.
 * Official Spanish names for the 2024 Monster Manual come from foundryvtt-sinregistrar/translate-dnd5e-mm-2024-es
 * (Apache-2.0); only the names are used.
 * Writes data/external/monsters-official.json; run scripts/oneoff/check_monster_links.py afterwards to verify the links.
 * Usage: node --experimental-strip-types scripts/import-monster-index.ts --5et DIR --mmes DIR
 */
import fs from 'node:fs';
import path from 'node:path';

const arg = (k: string) => {
  const i = process.argv.indexOf(`--${k}`);
  if (i < 0) throw new Error(`missing --${k}`);
  return process.argv[i + 1];
};
const root = process.cwd();
const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));

// Newest printing first: a monster reprinted in a later book is only listed once.
const BOOKS: { src: string; file: string; name: string; era: '2014' | '2024' }[] = [
  { src: 'XMM', file: 'xmm', name: 'Monster Manual (2024)', era: '2024' },
  { src: 'MPMM', file: 'mpmm', name: 'Mordenkainen Presents: Monsters of the Multiverse', era: '2014' },
  { src: 'FTD', file: 'ftd', name: "Fizban's Treasury of Dragons", era: '2014' },
  { src: 'BGG', file: 'bgg', name: "Bigby Presents: Glory of the Giants", era: '2014' },
  { src: 'BMT', file: 'bmt', name: 'The Book of Many Things', era: '2014' },
  { src: 'MM', file: 'mm', name: 'Monster Manual (2014)', era: '2014' },
];
const SIZES: Record<string, string> = { T: 'Tiny', S: 'Small', M: 'Medium', L: 'Large', H: 'Huge', G: 'Gargantuan' };

const crValue = (cr: any): number | undefined => {
  const s = typeof cr === 'object' ? cr?.cr : cr;
  if (s == null) return undefined;
  const [a, b] = String(s).split('/').map(Number);
  return b ? a / b : a;
};
const typeOf = (t: any): string | undefined => (typeof t === 'string' ? t : typeof t?.type === 'string' ? t.type : t?.type?.choose?.join(' or '));
const acOf = (ac: any[]): number | undefined => {
  const x = ac?.[0];
  return typeof x === 'number' ? x : x?.ac;
};

// Foundry ids are a book prefix ('mm', 'dmg') + the English name in PascalCase without punctuation ("Kuo-toa Whip" →
// mmKuotoaWhip0000, "Yuan-ti Malison (Type 1)" → mmYuantiMalison1), cut or zero-padded to 16 characters.
const idKey = (id: string) => id.replace(/^(mm|dmg)/, '').replace(/0+$/, '').toLowerCase();
const nameKey = (n: string) => n.replace(/\(Type (\d+)\)/, '$1').toLowerCase().replace(/[^a-z0-9]/g, '');

function main() {
  const dir = arg('5et');
  const mmEs = read(path.join(arg('mmes'), 'compendium/dnd-monster-manual.actors.json')).entries as Record<string, { name: string }>;
  const byKey = new Map(Object.entries(mmEs).map(([id, v]) => [idKey(id), v.name]));
  // Ids are cut to 16 characters with the prefix included, so a long name matches by prefix.
  const esName = (en: string) => byKey.get(nameKey(en).slice(0, 14)) ?? [...byKey].find(([k]) => k.length >= 12 && nameKey(en).startsWith(k))?.[1];
  const books = BOOKS.map((b) => ({ ...b, monsters: read(path.join(dir, `bestiary-${b.file}.json`)).monster as any[] }));
  const all = new Map<string, any>();
  for (const b of books) for (const m of b.monsters) all.set(`${m.name}|${m.source}`, m);
  // Monsters built as a copy of another one (The Book of Many Things) take their facts from the original.
  const resolve = (m: any): any => {
    if (!m._copy) return m;
    const base = all.get(`${m._copy.name}|${m._copy.source}`);
    return base ? { ...resolve(base), ...m } : m;
  };

  const srd = new Set((read(path.join(root, 'assets/data/monsters.json')) as any[]).map((m) => m.name.en.toLowerCase()));
  const seen = new Set<string>();
  const out: any[] = [];
  for (const b of books) {
    for (const raw of b.monsters) {
      const m = resolve(raw);
      const key = m.name.toLowerCase();
      if (m.srd52 || m.srd || srd.has(key) || seen.has(key) || m.reprintedAs?.length || m.isNpc) continue;
      const cr = crValue(m.cr);
      if (cr == null || !m.size) continue;
      seen.add(key);
      const es = b.src === 'XMM' ? esName(m.name) : undefined;
      out.push({
        category: 'monster',
        name: { en: m.name, ...(es ? { es } : {}) },
        book: b.name,
        data: {
          size: (m.size as string[]).map((s) => SIZES[s] ?? s).join(' or '),
          type: typeOf(m.type),
          challenge_rating: cr,
          ac: acOf(m.ac),
          hp: m.hp?.average,
          page: m.page,
          era: b.era,
        },
      });
    }
  }
  out.sort((a, b) => a.name.en.localeCompare(b.name.en));
  fs.writeFileSync(path.join(root, 'data/external/monsters-official.json'), JSON.stringify(out, null, 1) + '\n');
  const by = out.reduce<Record<string, number>>((acc, x) => ((acc[x.book] = (acc[x.book] ?? 0) + 1), acc), {});
  const xmm = out.filter((x) => x.book === BOOKS[0].name);
  console.log(`official non-SRD monsters: ${out.length}`, by, `2024 MM without a Spanish name: ${xmm.filter((x) => !x.name.es).map((x) => x.name.en).join(', ') || 'none'}`);
}

main();
