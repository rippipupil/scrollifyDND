/**
 * One-off importer for the spell index. Reads local copies of:
 *   --5et   5etools-src data/spells (index.json, spells-*.json, sources.json) — only facts are used
 *           (name, level, school, casting time, range, component flags, duration, classes, book, page);
 *           no rules text is copied.
 *   --srdes foundryvtt-sinregistrar/translate-dnd5e-sdr2-es (CC BY 4.0) — official Spanish SRD 5.2 names
 *   --phbes foundryvtt-sinregistrar/translate-dnd5e-phb-2024-es (MIT) — Spanish PHB 2024 names
 *   --fvtt  foundryvtt/dnd5e packs/_source/spells24 — Foundry ids → English names
 * Writes data/external/spells-official.json, data/i18n/es/spells/99-official-names.json and data/links/spells.json.
 * Usage: node --experimental-strip-types scripts/import-spell-index.ts --5et DIR --srdes DIR --phbes DIR --fvtt DIR
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

const BOOKS: Record<string, { name: string; era: '2014' | '2024' }> = {
  XPHB: { name: "Player's Handbook (2024)", era: '2024' },
  FRHoF: { name: 'Forgotten Realms: Heroes of Faerûn', era: '2024' },
  EFA: { name: 'Eberron: Forge of the Artificer', era: '2024' },
  AU: { name: 'Arcana Unleashed', era: '2024' },
  XGE: { name: "Xanathar's Guide to Everything", era: '2014' },
  TCE: { name: "Tasha's Cauldron of Everything", era: '2014' },
  SCC: { name: 'Strixhaven: A Curriculum of Chaos', era: '2014' },
  FTD: { name: "Fizban's Treasury of Dragons", era: '2014' },
  EGW: { name: "Explorer's Guide to Wildemount", era: '2014' },
  BMT: { name: 'The Book of Many Things', era: '2014' },
  AAG: { name: "Astral Adventurer's Guide", era: '2014' },
  AI: { name: 'Acquisitions Incorporated', era: '2014' },
  GGR: { name: "Guildmasters' Guide to Ravnica", era: '2014' },
  SatO: { name: 'Sigil and the Outlands', era: '2014' },
  IDRotF: { name: 'Icewind Dale: Rime of the Frostmaiden', era: '2014' },
  LLK: { name: 'Lost Laboratory of Kwalish', era: '2014' },
  'AitFR-AVT': { name: 'Adventures in the Forgotten Realms', era: '2014' },
};
const SCHOOLS: Record<string, string> = { A: 'abjuration', C: 'conjuration', D: 'divination', E: 'enchantment', V: 'evocation', I: 'illusion', N: 'necromancy', T: 'transmutation' };

// --- Spanish names -----------------------------------------------------------
function foundryIdToEnglish(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string) => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.yml')) {
        const t = fs.readFileSync(p, 'utf8');
        const id = /^_id: (\S+)/m.exec(t)?.[1];
        const name = /^name: (.+)$/m.exec(t)?.[1].replace(/^['"]|['"]$/g, '');
        if (id && name) out[id] = name;
      }
    }
  };
  walk(dir);
  return out;
}

const SMALL = new Set(['of', 'the', 'and', 'from']);
const pascal = (n: string, small: boolean) =>
  n
    .replace(/[’']/g, '')
    .replace(/[/:,.-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => (small && i > 0 && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1)))
    .join('');

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const accents = (s: string) => (s.normalize('NFD').match(/[̀-ͯ]/g) ?? []).length;
/** Picks the Spanish name: PHB 2024 wording, but the SRD spelling when they only differ in accents/case, and never a known typo. */
function pickEs(srd: string | undefined, phb: string | undefined): string | undefined {
  if (!phb || /Arcanos/.test(phb)) return srd ?? phb;
  if (!srd) return phb;
  if (strip(srd) === strip(phb)) return accents(srd) > accents(phb) ? srd : phb;
  return phb;
}

// --- facts -------------------------------------------------------------------
function time(t: any[]): { n: number; unit: string } | undefined {
  const x = t?.[0];
  return x ? { n: x.number ?? 1, unit: x.unit } : undefined;
}
function range(r: any) {
  if (!r) return undefined;
  const d = r.distance ?? {};
  const base = ['feet', 'miles'].includes(d.type) ? { kind: d.type, amount: d.amount } : { kind: d.type ?? r.type };
  if (['radius', 'sphere', 'cone', 'line', 'cube', 'emanation', 'hemisphere', 'cylinder'].includes(r.type)) {
    return { kind: 'self', area: { shape: r.type, size: d.amount, unit: d.type } };
  }
  return r.type === 'special' ? { kind: 'special' } : base;
}
function components(c: any) {
  if (!c) return undefined;
  const m = c.m;
  return {
    v: !!c.v,
    s: !!c.s,
    m: !!m,
    ...(typeof m === 'object' && m?.cost ? { costGp: m.cost / 100 } : {}),
    ...(typeof m === 'object' && m?.consume ? { consumed: true } : {}),
  };
}
function duration(d: any[]) {
  const x = d?.[0];
  if (!x) return undefined;
  if (x.type === 'timed') return { kind: 'timed', amount: x.duration?.amount, unit: x.duration?.type, concentration: !!x.concentration };
  return { kind: x.type };
}

function main() {
  const et = arg('5et');
  const srdEsEntries = read(path.join(arg('srdes'), 'compendium/dnd5e.spells24.json')).entries;
  const phbEsEntries = read(path.join(arg('phbes'), 'compendium/dnd-players-handbook.spells.json')).entries;
  const idToEn = foundryIdToEnglish(arg('fvtt'));
  const index = read(path.join(et, 'index.json')) as Record<string, string>;
  const sources = read(path.join(et, 'sources.json'));
  const xphb = read(path.join(et, 'spells-xphb.json')).spell as any[];

  // SRD generic name → PHB 2024 name (Arcane Hand → Bigby's Hand).
  const phbNameOf: Record<string, string> = {};
  for (const s of xphb) phbNameOf[typeof s.srd52 === 'string' ? s.srd52 : s.name] = s.name;
  // English (PHB name) → Spanish, from both modules.
  const srdEs: Record<string, string> = {};
  for (const [id, v] of Object.entries<any>(srdEsEntries)) if (idToEn[id]) srdEs[phbNameOf[idToEn[id]] ?? idToEn[id]] = v.name;
  const cand: Record<string, string> = {};
  for (const s of xphb) {
    for (const [prefix, small] of [['phb', false], ['phbspl', true]] as const) cand[(prefix + pascal(s.name, small)).slice(0, 16).padEnd(16, '0')] = s.name;
  }
  const phbEs: Record<string, string> = {};
  for (const [id, v] of Object.entries<any>(phbEsEntries)) {
    const en = idToEn[id] ? phbNameOf[idToEn[id]] ?? idToEn[id] : cand[id];
    if (en) phbEs[en] = v.name;
  }

  const classesOf = (src: string, name: string) => {
    const e = sources[src]?.[name] ?? {};
    const list = [...(e.class ?? []), ...(e.classVariant ?? [])].map((c: any) => String(c.name).toLowerCase());
    return [...new Set(list)].sort();
  };

  // SRD spells: official Spanish display names + names for link slugs, keyed by our spell id (slug of SRD name).
  const ourSpells = read(path.join(root, 'assets/data/spells.json')) as any[];
  const officialNames: Record<string, { name: string }> = {};
  const links: Record<string, { en: string; es?: string }> = {};
  for (const sp of ourSpells) {
    const phbName = phbNameOf[sp.name.en] ?? sp.name.en;
    // "Named" spells keep the SRD's generic Spanish name for display (Mano arcana) but link to the PHB page (Mano de Bigby).
    const named = phbName !== sp.name.en;
    const display = named ? srdEs[phbName] ?? phbEs[phbName] : pickEs(srdEs[phbName], phbEs[phbName]);
    const linkEs = named ? phbEs[phbName] ?? display : display;
    if (display) officialNames[sp.id] = { name: display };
    links[sp.id] = { en: phbName, ...(linkEs ? { es: linkEs } : {}) };
  }

  // Official spells outside the SRD: newest printing wins (2024 books first).
  const srdNames = new Set(ourSpells.map((s) => phbNameOf[s.name.en] ?? s.name.en));
  const order = ['XPHB', 'FRHoF', 'EFA', 'AU', ...Object.keys(BOOKS).filter((k) => BOOKS[k].era === '2014')];
  const seen = new Set<string>();
  const out: any[] = [];
  for (const src of order) {
    if (!index[src]) continue;
    for (const s of read(path.join(et, index[src])).spell as any[]) {
      if (srdNames.has(s.name) || seen.has(s.name.toLowerCase())) continue;
      seen.add(s.name.toLowerCase());
      const dur = duration(s.duration);
      out.push({
        category: 'spell',
        name: { en: s.name, ...(phbEs[s.name] ? { es: pickEs(undefined, phbEs[s.name]) } : {}) },
        book: BOOKS[src].name,
        data: {
          level: s.level,
          school: SCHOOLS[s.school] ?? s.school,
          classes: classesOf(src, s.name),
          castingTime: time(s.time),
          range: range(s.range),
          components: components(s.components),
          duration: dur,
          concentration: !!(dur as any)?.concentration,
          ritual: !!s.meta?.ritual,
          page: s.page,
          era: BOOKS[src].era,
        },
      });
    }
  }
  out.sort((a, b) => a.name.en.localeCompare(b.name.en));

  fs.mkdirSync(path.join(root, 'data/links'), { recursive: true });
  fs.writeFileSync(path.join(root, 'data/external/spells-official.json'), JSON.stringify(out, null, 1) + '\n');
  fs.writeFileSync(path.join(root, 'data/i18n/es/spells/99-official-names.json'), JSON.stringify(officialNames, null, 1) + '\n');
  fs.writeFileSync(path.join(root, 'data/links/spells.json'), JSON.stringify(links, null, 1) + '\n');
  const noEs = out.filter((x) => !x.name.es).length;
  console.log(`official non-SRD spells: ${out.length} (${noEs} without a Spanish name); SRD Spanish names: ${Object.keys(officialNames).length}`);
}

main();
