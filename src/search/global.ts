import type { ContentEntry } from '../content/types';
import type { Enemy } from '../dm/types';
import { loc, type Lang } from '../i18n';
import type { JournalEntry } from '../journal/journal';
import type { Character } from '../rules/types';
import { normalize } from '../wiki/search';

export type HitKind = 'character' | 'enemy' | 'journal' | 'note' | 'content';
export const HIT_KINDS: HitKind[] = ['character', 'enemy', 'journal', 'note', 'content'];

/** One result of the search across everything the user has: `ref` is the character/enemy/page id or the content key. */
export interface Hit {
  kind: HitKind;
  ref: string;
  title: string;
  snippet?: string;
}

export interface SearchSources {
  characters: Character[];
  enemies: Enemy[];
  journal: JournalEntry[];
  /** Wiki notes by content key, with a way to name the entry they belong to. */
  notes: Record<string, string>;
  entryName: (key: string) => string | undefined;
  /** The wiki search, already limited. */
  content: (query: string) => ContentEntry[];
}

const words = (q: string) => normalize(q).split(' ').filter(Boolean);
const matchesAll = (text: string, ws: string[]) => {
  const n = normalize(text);
  return ws.every((w) => n.includes(w));
};

/** A short piece of `text` around the first query word, on one line. */
export function snippet(text: string, query: string, width = 70): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  const w = words(query)[0];
  // normalize() keeps one character per character once whitespace is collapsed, so indexes line up.
  const at = w ? normalize(flat).indexOf(w) : -1;
  if (at < 0 || flat.length <= width) return flat.length > width ? `${flat.slice(0, width).trimEnd()}…` : flat;
  const start = Math.max(0, at - Math.floor(width / 3));
  const end = Math.min(flat.length, start + width);
  return `${start > 0 ? '…' : ''}${flat.slice(start, end).trim()}${end < flat.length ? '…' : ''}`;
}

/** Searches characters, the DM bestiary, the campaign journal, the reader's wiki notes and the wiki itself. */
export function globalSearch(query: string, src: SearchSources, lang: Lang): Hit[] {
  const ws = words(query);
  if (!ws.length) return [];
  const hits: Hit[] = [];
  for (const c of src.characters) {
    const text = [c.name, c.player, loc(c.species.name, lang), loc(c.background.name, lang), ...c.classes.flatMap((k) => [loc(k.name, lang), k.subclassName ? loc(k.subclassName, lang) : ''])].join(' ');
    if (matchesAll(text, ws)) hits.push({ kind: 'character', ref: c.id, title: c.name });
  }
  for (const e of src.enemies) {
    if (matchesAll(`${e.name} ${e.type} ${e.notes}`, ws)) hits.push({ kind: 'enemy', ref: e.id, title: e.name });
  }
  for (const j of src.journal) {
    if (!matchesAll(`${j.title} ${j.body}`, ws)) continue;
    const inTitle = matchesAll(j.title, ws);
    hits.push({ kind: 'journal', ref: j.id, title: j.title, ...(j.body && !inTitle ? { snippet: snippet(j.body, query) } : {}) });
  }
  for (const [key, note] of Object.entries(src.notes)) {
    const name = src.entryName(key);
    if (name && matchesAll(`${name} ${note}`, ws)) hits.push({ kind: 'note', ref: key, title: name, snippet: snippet(note, query) });
  }
  for (const e of src.content(query)) hits.push({ kind: 'content', ref: `${e.category}:${e.id}`, title: loc(e.name, lang) });
  return hits;
}
