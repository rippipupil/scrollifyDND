import type { Lang } from '../i18n';
import { buildIndex, searchEntries, type SearchFilters, type SearchIndex } from '../wiki/search';
import type { Category, ContentEntry } from './types';

const files: ContentEntry[][] = [
  require('../../assets/data/spells.json'),
  require('../../assets/data/equipment.json'),
  require('../../assets/data/magic-items.json'),
  require('../../assets/data/classes.json'),
  require('../../assets/data/subclasses.json'),
  require('../../assets/data/features.json'),
  require('../../assets/data/species.json'),
  require('../../assets/data/backgrounds.json'),
  require('../../assets/data/feats.json'),
  require('../../assets/data/conditions.json'),
  require('../../assets/data/masteries.json'),
  require('../../assets/data/weapon-properties.json'),
  require('../../assets/data/rules.json'),
  require('../../assets/data/monsters.json'),
  require('../../assets/data/external.json'),
];

export const srdEntries: ContentEntry[] = files.flat();

/** Globally unique key: ids repeat across categories (e.g. spell "shield" vs equipment "shield"). */
export function keyOf(e: Pick<ContentEntry, 'category' | 'id'>): string {
  return `${e.category}:${e.id}`;
}

const byKey = new Map(srdEntries.map((e) => [keyOf(e), e]));
const byId = new Map<string, ContentEntry>();
for (const e of srdEntries) if (!byId.has(e.id)) byId.set(e.id, e);
const srdIndex = buildIndex(srdEntries);

/** Looks up by "category:id" key, or by bare id (first match) for convenience. */
export function getEntry(key: string | undefined, homebrew: ContentEntry[] = []): ContentEntry | undefined {
  if (!key) return undefined;
  const hb = homebrew.find((e) => keyOf(e) === key || e.id === key);
  if (hb) return hb;
  return key.includes(':') ? byKey.get(key) : byId.get(key);
}

export function allEntries(homebrew: ContentEntry[] = []): ContentEntry[] {
  return homebrew.length ? [...srdEntries, ...homebrew] : srdEntries;
}

export function entriesOf(category: Category, homebrew: ContentEntry[] = []): ContentEntry[] {
  return allEntries(homebrew).filter((e) => e.category === category);
}

let hbCache: { list: ContentEntry[]; index: SearchIndex } | null = null;

export function searchContent(query: string, filters: SearchFilters = {}, lang: Lang = 'es', homebrew: ContentEntry[] = [], limit?: number) {
  let index = srdIndex;
  if (homebrew.length) {
    if (!hbCache || hbCache.list !== homebrew) hbCache = { list: homebrew, index: [...srdIndex, ...buildIndex(homebrew)] };
    index = hbCache.index;
  }
  return searchEntries(index, query, filters, lang, limit);
}
