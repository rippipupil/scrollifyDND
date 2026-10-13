import type { ContentEntry } from '../content/types';
import { sanitizeEncounter } from '../dm/encounter';
import { sanitizeEnemy } from '../dm/enemy';
import type { Encounter, Enemy } from '../dm/types';
import { sanitizeEntry, type JournalEntry } from '../journal/journal';
import type { Character } from '../rules/types';
import { migrateCharacter } from '../store/migrations';

/** Everything the app keeps on the device, in one file. Portraits travel inside the characters as data URIs. */
export interface Backup {
  createdAt: number;
  characters: Character[];
  enemies: Enemy[];
  encounter: Encounter;
  homebrew: ContentEntry[];
  journal: JournalEntry[];
  wiki: { notes: Record<string, string>; favorites: string[] };
}

const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
/** Applies `fn` to each item, dropping the ones it can't read instead of failing the whole backup. */
function each<T>(v: unknown, fn: (x: unknown) => T): T[] {
  const out: T[] = [];
  for (const x of list(v)) {
    try {
      out.push(fn(x));
    } catch {
      // Unreadable item: skipped.
    }
  }
  return out;
}
const isEntry = (e: any): e is ContentEntry => isObj(e) && typeof e.id === 'string' && typeof e.category === 'string' && isObj(e.name) && typeof e.name.en === 'string';

/** Reads the payload of a backup file defensively: every part is checked like the stores check their own data. */
export function sanitizeBackup(raw: unknown): Backup {
  if (!isObj(raw)) throw new Error('not a backup');
  const wiki = isObj(raw.wiki) ? raw.wiki : {};
  return {
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : 0,
    characters: each(raw.characters, migrateCharacter),
    enemies: each(raw.enemies, (x) => {
      if (!isObj(x)) throw new Error('not an enemy');
      return sanitizeEnemy(x);
    }),
    encounter: sanitizeEncounter(raw.encounter),
    homebrew: list(raw.homebrew).filter(isEntry),
    journal: each(raw.journal, sanitizeEntry),
    wiki: {
      notes: isObj(wiki.notes) ? Object.fromEntries(Object.entries(wiki.notes).filter((kv): kv is [string, string] => typeof kv[1] === 'string' && kv[1].trim() !== '')) : {},
      favorites: list(wiki.favorites).filter((x): x is string => typeof x === 'string'),
    },
  };
}

/**
 * Merges restored items into what's on the device by id: new ids are added and, when both sides have the same
 * item, the most recently edited copy wins, so restoring an old backup never undoes newer work.
 */
export function mergeById<T extends { id: string; updatedAt: number }>(current: Record<string, T>, incoming: T[]): { merged: Record<string, T>; added: number; updated: number } {
  const merged = { ...current };
  let added = 0;
  let updated = 0;
  for (const x of incoming) {
    const cur = merged[x.id];
    if (!cur) {
      merged[x.id] = x;
      added++;
    } else if (x.updatedAt > cur.updatedAt) {
      merged[x.id] = x;
      updated++;
    }
  }
  return { merged, added, updated };
}

/** File name for a backup made on `date`: scrollify-backup-2026-10-13. */
export const backupName = (date = new Date()) => `scrollify-backup-${date.toISOString().slice(0, 10)}`;
