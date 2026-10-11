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
const byId = new Map(srdEntries.map((e) => [e.id, e]));
const srdIndex = buildIndex(srdEntries);

export function getEntry(id: string | undefined, homebrew: ContentEntry[] = []): ContentEntry | undefined {
  if (!id) return undefined;
  return homebrew.find((e) => e.id === id) ?? byId.get(id);
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
