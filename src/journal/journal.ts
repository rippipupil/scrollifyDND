import { uid } from '../rules/core';
import { normalize } from '../wiki/search';

export type JournalKind = 'session' | 'quest' | 'npc' | 'place' | 'note';
export const JOURNAL_KINDS: JournalKind[] = ['session', 'quest', 'npc', 'place', 'note'];
export type QuestStatus = 'open' | 'done' | 'failed';

/** A page of the DM's campaign journal. `[[Title]]` in the body links to another page. */
export interface JournalEntry {
  id: string;
  kind: JournalKind;
  title: string;
  body: string;
  /** Sessions: play date, YYYY-MM-DD. */
  date?: string;
  /** Quests only. */
  status?: QuestStatus;
  createdAt: number;
  updatedAt: number;
}

const LINK = /\[\[([^[\]]+?)\]\]/g;

export function newEntry(kind: JournalKind, title = '', today = new Date()): JournalEntry {
  const now = Date.now();
  return {
    id: uid('jrnl'),
    kind,
    title,
    body: '',
    ...(kind === 'session' ? { date: today.toISOString().slice(0, 10) } : {}),
    ...(kind === 'quest' ? { status: 'open' as const } : {}),
    createdAt: now,
    updatedAt: now,
  };
}

/** Titles linked from a text with [[…]], in order, without repeats. */
export function linkedTitles(body: string): string[] {
  const out: string[] = [];
  for (const m of body.matchAll(LINK)) {
    const t = m[1].trim();
    if (t && !out.some((x) => normalize(x) === normalize(t))) out.push(t);
  }
  return out;
}

/** Finds a page by title, ignoring case and accents. */
export function findByTitle(entries: JournalEntry[], title: string): JournalEntry | undefined {
  const n = normalize(title);
  return entries.find((e) => normalize(e.title) === n);
}

/** Pages whose text links to this one. */
export function backlinks(entries: JournalEntry[], target: JournalEntry): JournalEntry[] {
  const n = normalize(target.title);
  if (!n) return [];
  return entries.filter((e) => e.id !== target.id && linkedTitles(e.body).some((t) => normalize(t) === n));
}

/** Splits a text into plain runs and [[links]] for rendering. */
export function splitLinks(body: string): { text: string; link?: boolean }[] {
  const out: { text: string; link?: boolean }[] = [];
  let last = 0;
  for (const m of body.matchAll(LINK)) {
    if (m.index! > last) out.push({ text: body.slice(last, m.index) });
    out.push({ text: m[1].trim(), link: true });
    last = m.index! + m[0].length;
  }
  if (last < body.length) out.push({ text: body.slice(last) });
  return out;
}

/** Renames a page and rewrites the [[links]] that pointed to its old title, so they keep working. */
export function renameEntry(entries: Record<string, JournalEntry>, id: string, title: string): Record<string, JournalEntry> {
  const target = entries[id];
  if (!target) return entries;
  const old = normalize(target.title);
  const out: Record<string, JournalEntry> = {};
  for (const e of Object.values(entries)) {
    if (e.id === id) out[e.id] = { ...e, title, updatedAt: Date.now() };
    else if (old && linkedTitles(e.body).some((t) => normalize(t) === old)) {
      out[e.id] = { ...e, body: e.body.replace(LINK, (m, t: string) => (normalize(t) === old ? `[[${title}]]` : m)), updatedAt: Date.now() };
    } else out[e.id] = e;
  }
  return out;
}

/** Sessions newest first, open quests before closed ones, the rest by title. */
export function sortEntries(list: JournalEntry[]): JournalEntry[] {
  const rank = (e: JournalEntry) => (e.kind === 'quest' ? (e.status === 'open' ? 0 : 1) : 0);
  return [...list].sort((a, b) => {
    if (a.kind === 'session' && b.kind === 'session') return (b.date ?? '').localeCompare(a.date ?? '') || b.createdAt - a.createdAt;
    return rank(a) - rank(b) || a.title.localeCompare(b.title);
  });
}

const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** Repairs a stored or imported page; throws if it isn't an object. */
export function sanitizeEntry(raw: unknown): JournalEntry {
  if (!isObj(raw)) throw new Error('Journal entry must be an object');
  const kind: JournalKind = JOURNAL_KINDS.includes(raw.kind) ? raw.kind : 'note';
  const now = Date.now();
  return {
    id: str(raw.id) || uid('jrnl'),
    kind,
    title: str(raw.title),
    body: str(raw.body),
    ...(kind === 'session' && /^\d{4}-\d{2}-\d{2}$/.test(str(raw.date)) ? { date: raw.date } : {}),
    ...(kind === 'quest' ? { status: ['open', 'done', 'failed'].includes(raw.status) ? raw.status : 'open' } : {}),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : now,
  };
}
