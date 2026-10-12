import type { Category, ContentEntry } from '../content/types';

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

interface IndexedEntry {
  entry: ContentEntry;
  names: string[];
  text: string;
}

export type SearchIndex = IndexedEntry[];

export interface SearchFilters {
  category?: Category | Category[];
  spellLevel?: number;
  spellClass?: string;
  school?: string;
  concentration?: boolean;
  ritual?: boolean;
  source?: ContentEntry['source'];
  /** '2014' = 5e options (legacy), '2024' = everything else (5.5). */
  era?: '2014' | '2024';
}

/** Rules edition of an entry: index entries from 2014 books say so; the SRD 5.2 and homebrew count as 2024. */
export function entryEra(e: ContentEntry): '2014' | '2024' {
  return e.data?.era === '2014' ? '2014' : '2024';
}

export function buildIndex(entries: ContentEntry[]): SearchIndex {
  return entries.map((entry) => ({
    entry,
    names: [entry.name.en, entry.name.es].filter((n): n is string => !!n).map(normalize),
    text: normalize(`${entry.text?.en ?? ''} ${entry.text?.es ?? ''}`),
  }));
}

function matchesFilters(e: ContentEntry, f: SearchFilters): boolean {
  if (f.category) {
    const cats = Array.isArray(f.category) ? f.category : [f.category];
    if (!cats.includes(e.category)) return false;
  }
  if (f.source && e.source !== f.source) return false;
  if (f.era && entryEra(e) !== f.era) return false;
  const spellFilter =
    f.spellLevel != null || f.spellClass || f.school || f.concentration != null || f.ritual != null;
  if (spellFilter) {
    if (e.category !== 'spell' || !e.data) return false;
    const d = e.data;
    if (f.spellLevel != null && d.level !== f.spellLevel) return false;
    if (f.spellClass && !(d.classes ?? []).includes(f.spellClass)) return false;
    if (f.school && d.school !== f.school) return false;
    if (f.concentration != null && !!d.concentration !== f.concentration) return false;
    if (f.ritual != null && !!d.ritual !== f.ritual) return false;
  }
  return true;
}

/** Lower is better; null = no match. */
function score(item: IndexedEntry, q: string, words: string[]): number | null {
  let best: number | null = null;
  for (const n of item.names) {
    let s: number | null = null;
    if (n === q) s = 0;
    else if (n.startsWith(q)) s = 1;
    else if (n.split(' ').some((w) => w.startsWith(q))) s = 2;
    else if (n.includes(q)) s = 3;
    else if (words.every((w) => n.includes(w))) s = 4;
    if (s != null && (best == null || s < best)) best = s;
  }
  if (best != null) return best;
  const all = `${item.names.join(' ')} ${item.text}`;
  return words.every((w) => all.includes(w)) ? 5 : null;
}

export function displayName(e: ContentEntry, lang: 'en' | 'es'): string {
  return (lang === 'es' && e.name.es) || e.name.en;
}

export function searchEntries(
  index: SearchIndex,
  query: string,
  filters: SearchFilters = {},
  lang: 'en' | 'es' = 'en',
  limit = Infinity,
): ContentEntry[] {
  const q = normalize(query);
  const words = q.split(' ').filter(Boolean);
  const scored: { e: ContentEntry; s: number; name: string }[] = [];
  for (const item of index) {
    if (!matchesFilters(item.entry, filters)) continue;
    const s = q ? score(item, q, words) : 0;
    if (s == null) continue;
    scored.push({ e: item.entry, s, name: normalize(displayName(item.entry, lang)) });
  }
  scored.sort((a, b) => a.s - b.s || a.name.localeCompare(b.name));
  return scored.slice(0, limit).map((x) => x.e);
}
