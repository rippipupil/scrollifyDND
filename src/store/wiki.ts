import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { appStorage } from './storage';

/** The reader's own layer over the wiki: notes and favourites, keyed by content key ("spell:fireball"). */
interface WikiUserState {
  notes: Record<string, string>;
  favorites: string[];
  setNote: (key: string, text: string) => void;
  toggleFavorite: (key: string) => void;
  /** Merges a backup: notes from the backup win, favourites are joined. */
  restore: (data: { notes?: Record<string, string>; favorites?: string[] }) => void;
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

function cleanNotes(v: unknown): Record<string, string> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return {};
  return Object.fromEntries(Object.entries(v).filter((kv): kv is [string, string] => typeof kv[1] === 'string' && kv[1].trim() !== ''));
}

export const useWikiUser = create<WikiUserState>()(
  persist(
    (set) => ({
      notes: {},
      favorites: [],
      setNote: (key, text) =>
        set((s) => {
          const { [key]: _old, ...rest } = s.notes;
          return { notes: text.trim() ? { ...rest, [key]: text } : rest };
        }),
      toggleFavorite: (key) => set((s) => ({ favorites: s.favorites.includes(key) ? s.favorites.filter((k) => k !== key) : [key, ...s.favorites] })),
      restore: (data) =>
        set((s) => ({
          notes: { ...s.notes, ...cleanNotes(data.notes) },
          favorites: [...new Set([...s.favorites, ...strings(data.favorites)])],
        })),
    }),
    {
      name: 'scrollify.wiki',
      storage: appStorage,
      version: 1,
      partialize: (s) => ({ notes: s.notes, favorites: s.favorites }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<WikiUserState>;
        return { ...current, notes: cleanNotes(p.notes), favorites: strings(p.favorites) };
      },
    },
  ),
);
